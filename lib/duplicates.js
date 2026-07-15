import { EventEmitter } from "events";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import crypto from "crypto";
import { handleFsError } from "./utils.js";

export class DuplicateFinder extends EventEmitter {
  calculateHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash("sha256");
      const stream = fs.createReadStream(filePath);

      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", reject);
    });
  }

  async find(directory) {
    this.emit("search-start", { directory });
    let allFiles = [];

    try {
      const entries = await fsp.readdir(directory, {
        recursive: true,
        withFileTypes: true,
      });
      for (const entry of entries) {
        if (entry.isFile()) {
          allFiles.push(path.join(entry.parentPath || directory, entry.name));
        }
      }
    } catch (error) {
      handleFsError(error, directory);
    }

    const hashMap = new Map();
    const totalFiles = allFiles.length;

    for (let i = 0; i < totalFiles; i++) {
      const filePath = allFiles[i];
      try {
        const hash = await this.calculateHash(filePath);
        const stat = await fsp.stat(filePath);

        if (!hashMap.has(hash)) {
          hashMap.set(hash, { size: stat.size, paths: [] });
        }
        hashMap.get(hash).paths.push(filePath);
      } catch (e) {
        // Пропуск заблокованих файлів
      }
      this.emit("file-processed", { current: i + 1, total: totalFiles });
    }

    const duplicateGroups = [];
    let totalWastedSpace = 0;

    for (const [hash, data] of hashMap.entries()) {
      if (data.paths.length > 1) {
        const copiesCount = data.paths.length;
        const wasted = data.size * (copiesCount - 1);
        totalWastedSpace += wasted;

        duplicateGroups.push({
          hash,
          size: data.size,
          paths: data.paths,
          wasted,
        });
      }
    }

    this.emit("duplicates-found", {
      groups: duplicateGroups,
      totalWastedSpace,
    });
  }
}
