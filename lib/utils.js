import path from "path";

export function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function drawProgressBar(current, total, width = 20) {
  if (total === 0) return "░".repeat(width) + " 0/0";
  const percentage = Math.min(current / total, 1);
  const filled = Math.round(percentage * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  return `${bar} ${current}/${total} files`;
}

export function handleFsError(error, targetPath) {
  if (error.code === "ENOENT") {
    console.error(`❌ Error: Directory or file not found: ${targetPath}`);
  } else if (error.code === "EACCES") {
    console.error(`❌ Error: Permission denied: ${targetPath}`);
  } else {
    console.error(`❌ Unexpected error: ${error.message}`);
  }
  process.exit(1);
}

export const CATEGORIES = {
  Documents: [".pdf", ".docx", ".doc", ".txt", ".md", ".xlsx", ".pptx"],
  Images: [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".bmp"],
  Archives: [".zip", ".rar", ".tar", ".gz", ".7z"],
  Code: [".js", ".py", ".java", ".cpp", ".html", ".css", ".json"],
  Videos: [".mp4", ".avi", ".mkv", ".mov", ".webm"],
  Other: [],
};

export function getCategory(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  for (const [category, extensions] of Object.entries(CATEGORIES)) {
    if (extensions.includes(ext)) return category;
  }
  return "Other";
}
