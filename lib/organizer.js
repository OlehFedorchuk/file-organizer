import { EventEmitter } from "events";
import fs from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import path from "path";
import { handleFsError, getCategory, CATEGORIES } from "./utils.js";

export class Organizer extends EventEmitter {
  async getUniqueTargetPath(targetDir, filename) {
    let ext = path.extname(filename);
    let base = path.basename(filename, ext);
    let targetPath = path.join(targetDir, filename);
    let counter = 1;

    while (true) {
      try {
        await fs.access(targetPath);
        targetPath = path.join(targetDir, `${base}(${counter})${ext}`);
        counter++;
      } catch {
        // Якщо помилка (файлу немає), шлях вільний
        break;
      }
    }
    return targetPath;
  }

  async organize(sourceDir, targetDir) {
    this.emit("organize-start", { sourceDir, targetDir });

    let allFiles = [];
    try {
      const entries = await fs.readdir(sourceDir, {
        recursive: true,
        withFileTypes: true,
      });
      for (const entry of entries) {
        if (entry.isFile()) {
          allFiles.push(path.join(entry.parentPath || sourceDir, entry.name));
        }
      }

      for (const cat of Object.keys(CATEGORIES)) {
        await fs.mkdir(path.join(targetDir, cat), { recursive: true });
      }
    } catch (error) {
      handleFsError(error, sourceDir);
    }

    const totalFiles = allFiles.length;
    const summary = {};
    Object.keys(CATEGORIES).forEach(
      (k) => (summary[k] = { count: 0, size: 0 }),
    );

    let totalCopiedSize = 0;

    for (let i = 0; i < totalFiles; i++) {
      const srcPath = allFiles[i];
      try {
        const stat = await fs.stat(srcPath);
        const category = getCategory(srcPath);
        const filename = path.basename(srcPath);
        const destCatDir = path.join(targetDir, category);
        const destPath = await this.getUniqueTargetPath(destCatDir, filename);

        this.emit("copy-start", { path: srcPath });

        if (stat.size >= 10 * 1024 * 1024) {
          await pipeline(
            createReadStream(srcPath),
            createWriteStream(destPath),
          );
        } else {
          await fs.copyFile(srcPath, destPath);
        }

        summary[category].count++;
        summary[category].size += stat.size;
        totalCopiedSize += stat.size;

        this.emit("copy-complete", { current: i + 1, total: totalFiles });
      } catch (error) {
        this.emit("copy-error", { path: srcPath, error });
      }
    }

    this.emit("organization-complete", {
      summary,
      totalFiles,
      totalCopiedSize,
    });
  }
}
