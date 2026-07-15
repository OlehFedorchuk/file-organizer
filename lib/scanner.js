import { EventEmitter } from "events";
import fs from "fs/promises";
import path from "path";
import { handleFsError } from "./utils.js";

export class Scanner extends EventEmitter {
  async scan(directory) {
    this.emit("scan-start", { directory });
    let allFiles = [];

    try {
      const entries = await fs.readdir(directory, {
        recursive: true,
        withFileTypes: true,
      });

      for (const entry of entries) {
        if (entry.isFile()) {
          const fullPath = path.join(entry.parentPath || directory, entry.name);
          allFiles.push(fullPath);
        }
      }
    } catch (error) {
      handleFsError(error, directory);
    }

    const totalFiles = allFiles.length;
    const statsResult = {
      totalFiles: 0,
      totalSize: 0,
      byType: new Map(),
      age: { last7: 0, last30: 0, older90: 0 },
      largest: [],
      oldest: null,
    };

    const now = Date.now();

    for (let i = 0; i < totalFiles; i++) {
      const filePath = allFiles[i];
      try {
        const stat = await fs.stat(filePath);
        const size = stat.size;
        const mtime = stat.mtime;
        const ext = path.extname(filePath).toLowerCase() || "(no ext)";
        const ageDays = (now - mtime.getTime()) / (1000 * 60 * 60 * 24);

        const fileData = {
          path: filePath,
          name: path.basename(filePath),
          size,
          mtime,
          ageDays,
          ext,
        };

        statsResult.totalFiles++;
        statsResult.totalSize += size;

        if (!statsResult.byType.has(ext)) {
          statsResult.byType.set(ext, { count: 0, size: 0 });
        }
        const typeData = statsResult.byType.get(ext);
        typeData.count++;
        typeData.size += size;

        if (ageDays <= 7) statsResult.age.last7++;
        else if (ageDays <= 30) statsResult.age.last30++;
        else if (ageDays > 90) statsResult.age.older90++;

        statsResult.largest.push(fileData);
        statsResult.largest.sort((a, b) => b.size - a.size);
        if (statsResult.largest.length > 3) statsResult.largest.pop();

        if (
          !statsResult.oldest ||
          fileData.ageDays > statsResult.oldest.ageDays
        ) {
          statsResult.oldest = fileData;
        }

        this.emit("file-found", { current: i + 1, total: totalFiles });
      } catch (e) {
        // Пропускаємо окремі файли, до яких немає доступу під час циклу
      }
    }

    this.emit("scan-complete", statsResult);
  }
}
