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
    console.log(`📂 Scanning: ${dirPath}`);

    // Отримуємо детальний масив об'єктів по кожному файлу під час роботи progress bar
    const detailedFiles = await getDetailedFilesData(files);

    // Рахуємо загальний розмір з уже готового масиву
    const totalBytes = detailedFiles.reduce((sum, f) => sum + f.size, 0);

    console.log("📊 Scan Results:");
    console.log("----------------------");
    console.log(`Total files: ${files.length}`);
    console.log(`Total size: ${formatSize(totalBytes)}`);
    console.log(" ");

    // --- СЕКЦІЯ: By File Type (Кількість + Розмір) ---
    console.log("By File Type:");
    const typeStats = {};

    for (const file of detailedFiles) {
      if (!typeStats[file.ext]) {
        typeStats[file.ext] = { count: 0, size: 0 };
      }
      typeStats[file.ext].count += 1;
      typeStats[file.ext].size += file.size;
    }

    Object.entries(typeStats).forEach(([ext, info]) => {
      console.log(`  ${ext}: ${info.count} file(s) (${formatSize(info.size)})`);
    });

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

// Замість старої функції TotalSize. Тепер збираємо об'єкти з метаданими
async function getDetailedFilesData(pathFiles) {
  const detailedList = [];
  const totalFiles = pathFiles.length;

  for (let i = 0; i < totalFiles; i++) {
    const pathFile = pathFiles[i];

    // Отримуємо розширення файлу одразу
    const ext = path.extname(pathFile).toLowerCase() || "no extension";
    const size = await Parse(pathFile);

    detailedList.push({
      path: pathFile,
      size: size,
      ext: ext,
    });

    drawProgressBar(i + 1, totalFiles);
  }
  return detailedList;
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
