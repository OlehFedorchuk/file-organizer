import fs from "node:fs/promises";
import path from "node:path";

export default async function scanner(path) {
  try {
    const files = await getAllFiles(path);
    console.log(files);
    console.log(`Total files:, ${files.length}`);
  } catch (error) {
    console.log("Error read directory:", error.message);
  }
  return path;
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
