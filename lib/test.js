import fs from "node:fs/promises";

try {
  const stats = await fs.stat("lib/example.txt");
  console.log("Статистика файлу:", formatSize(stats.size));
} catch (error) {
  console.error("Помилка отримання статистики:", error.message);
}
function formatSize(bytes) {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}
