import { EventEmitter } from "events";
import fs from "fs/promises";
import path from "path";
import { handleFsError } from "./utils.js";

export class Cleanup extends EventEmitter {
  async process(directory, daysThreshold, confirm) {
    this.emit("cleanup-start", { directory, daysThreshold, confirm });
    let allFiles = [];

    try {
      const entries = await fs.readdir(directory, {
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

    const now = Date.now();
    const filesToDelete = [];
    let totalSizeToFree = 0;

    for (const filePath of allFiles) {
      try {
        const stat = await fs.stat(filePath);
        const ageDays = (now - stat.mtime.getTime()) / (1000 * 60 * 60 * 24);

        if (ageDays > daysThreshold) {
          filesToDelete.push({
            path: filePath,
            name: path.basename(filePath),
            size: stat.size,
            daysOld: Math.floor(ageDays),
            mtimeStr: stat.mtime.toISOString().split("T")[0],
          });
          totalSizeToFree += stat.size;
          this.emit("file-found", { path: filePath });
        }
      } catch (e) {}
    }

    if (!confirm) {
      this.emit("dry-run-complete", {
        files: filesToDelete,
        totalSize: totalSizeToFree,
      });
      return;
    }

    this.emit("deletion-start", {
      count: filesToDelete.length,
      totalSize: totalSizeToFree,
    });

    let deletedCount = 0;
    for (let i = 0; i < filesToDelete.length; i++) {
      const file = filesToDelete[i];
      try {
        await fs.unlink(file.path);
        deletedCount++;
        this.emit("file-deleted", {
          current: i + 1,
          total: filesToDelete.length,
        });
      } catch (e) {
        // Помилка видалення окремого файлу (наприклад, зайнятий процесом)
      }
    }

    this.emit("cleanup-complete", { deletedCount, totalSize: totalSizeToFree });
  }
}
