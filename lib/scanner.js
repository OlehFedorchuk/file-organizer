import fs from "node:fs/promises";
import path from "node:path";

export default async function scanner(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    let files = [];
    if (stats.isFile()) {
      files = [dirPath];
    } else if (stats.isDirectory()) {
      files = await getAllFiles(dirPath);
    }
    console.log(" ");
    console.log(`📂 Scanning: ${process.argv[3]}`);
    const totalBytes = await TotalSize(files);
    console.log(" ");
    console.log("📊 Scan Results:");
    console.log("----------------------");
    console.log(`Total files: ${files.length}`);

    console.log(`Total size: ${formatSize(totalBytes)}`);
    console.log(" ");
    console.log("By File Type:");
    console.log(" ");
    console.log("File Age:");
    console.log(" ");
    console.log("Largest files:");
    console.log(" ");
    console.log("Oldest file:");
  } catch (error) {
    console.log("Error read directory:", error.message);
  }
  return dirPath;
}

async function getAllFiles(dirPath, fileList = []) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await getAllFiles(fullPath, fileList);
    } else if (entry.isFile()) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}

async function TotalSize(pathFiles) {
  let total = 0;
  const totalFiles = pathFiles.length;

  for (let i = 0; i < totalFiles; i++) {
    const pathFile = pathFiles[i];

    total += await Parse(pathFile);

    drawProgressBar(i + 1, totalFiles);
  }
  return total;
}

async function Parse(pathFile) {
  try {
    const stats = await fs.stat(pathFile);
    return stats.size;
  } catch (error) {
    console.error("Помилка отримання статистики:", error.message);
    return 0;
  }
}

function drawProgressBar(current, total) {
  const width = 30;
  const percentage = Math.round((current / total) * 100);
  const filledLength = Math.round((width * current) / total);
  const bar = "█".repeat(filledLength) + "░".repeat(width - filledLength);
  process.stdout.write(
    `\rProgress... [${bar}] ${percentage}% (${current}/${total})`,
  );
  if (current === total) {
    process.stdout.write("\n\n");
  }
}
