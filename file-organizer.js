import readline from "readline";
import { Scanner } from "./lib/scanner.js";
import { DuplicateFinder } from "./lib/duplicates.js";
import { Organizer } from "./lib/organizer.js";
import { Cleanup } from "./lib/cleanup.js";
import { formatSize, drawProgressBar } from "./lib/utils.js";

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log("💡 Usage: npm run <command> -- [arguments]");
  console.log("Commands: scan, duplicates, organize, cleanup");
  process.exit(0);
}

const updateLine = (text) => {
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(text);
};

switch (command) {
  case "scan": {
    const dir = args[1];
    if (!dir) {
      console.error("Error: Specify directory path.");
      process.exit(1);
    }

    const scanner = new Scanner();
    scanner.on("scan-start", (d) =>
      console.log(`📂 Scanning: ${d.directory}\n`),
    );
    scanner.on("file-found", (data) => {
      updateLine(`Processing... ${drawProgressBar(data.current, data.total)}`);
    });

    scanner.on("scan-complete", (stats) => {
      console.log("\n\n📊 Scan Results:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`Total files: ${stats.totalFiles}`);
      console.log(`Total size:  ${formatSize(stats.totalSize)}`);

      console.log("\nBy File Type:");
      for (const [ext, data] of stats.byType.entries()) {
        console.log(
          `  ${ext.padEnd(8)} ${data.count.toString().padStart(4)} files   ${formatSize(data.size)}`,
        );
      }

      console.log("\nFile Age:");
      console.log(`  Last 7 days:   ${stats.age.last7} files`);
      console.log(`  Last 30 days:  ${stats.age.last30} files`);
      console.log(`  Older than 90: ${stats.age.older90} files`);

      console.log("\nLargest files:");
      stats.largest.forEach((f, idx) => {
        console.log(`  ${idx + 1}. ${f.name} ${formatSize(f.size)}`);
      });

      if (stats.oldest) {
        console.log(
          `\nOldest file: ${stats.oldest.name} (modified ${Math.floor(stats.oldest.ageDays)} days ago)`,
        );
      }
    });

    await scanner.scan(dir);
    break;
  }

  case "duplicates": {
    const dir = args[1];
    if (!dir) {
      console.error("Error: Specify directory path.");
      process.exit(1);
    }

    const finder = new DuplicateFinder();
    finder.on("search-start", (d) =>
      console.log(`🔍 Searching for duplicates in: ${d.directory}\n`),
    );
    finder.on("file-processed", (data) => {
      updateLine(
        `Calculating hashes... ${drawProgressBar(data.current, data.total)}`,
      );
    });

    finder.on("duplicates-found", (result) => {
      console.log(
        `\n\nFound ${result.groups.length} duplicate groups (${formatSize(result.totalWastedSpace)} wasted):\n`,
      );

      result.groups.forEach((group, idx) => {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(
          `Group ${idx + 1} (${group.paths.length} copies, ${formatSize(group.size)} each):`,
        );
        console.log(`  SHA-256: ${group.hash.substring(0, 16)}...`);
        group.paths.forEach((p) => console.log(`  📄 ${p}`));
        console.log(`  Wasted space: ${formatSize(group.wasted)}`);
      });

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(
        `💾 Total wasted space: ${formatSize(result.totalWastedSpace)}`,
      );
    });

    await finder.find(dir);
    break;
  }

  case "organize": {
    const src = args[1];
    const outIdx = args.indexOf("--output");
    const dest = outIdx !== -1 ? args[outIdx + 1] : null;

    if (!src || !dest) {
      console.error(
        "Error: Usage: npm run organize -- <source> --output <target>",
      );
      process.exit(1);
    }

    const organizer = new Organizer();
    organizer.on("organize-start", (d) => {
      console.log(
        `📦 Organizing: ${d.sourceDir}\nTarget: ${d.targetDir}\n\nCreating folders... Done.\n`,
      );
    });
    organizer.on("copy-complete", (data) => {
      updateLine(
        `Copying files... ${drawProgressBar(data.current, data.total)}`,
      );
    });

    organizer.on("organization-complete", (res) => {
      console.log("\n\n ✅ Organization complete!\nSummary:");
      for (const [cat, data] of Object.entries(res.summary)) {
        console.log(
          `  ${cat.padEnd(10)}: ${data.count.toString().padStart(4)} files → ${formatSize(data.size)}`,
        );
      }
      console.log(
        `\nTotal copied: ${res.totalFiles} files (${formatSize(res.totalCopiedSize)})`,
      );
    });

    await organizer.organize(src, dest);
    break;
  }

  case "cleanup": {
    const dir = args[1];
    const ageIdx = args.indexOf("--older-than");
    const threshold = ageIdx !== -1 ? parseInt(args[ageIdx + 1], 10) : null;
    const confirm = args.includes("--confirm");

    if (!dir || threshold === null || isNaN(threshold)) {
      console.error(
        "Error: Usage: npm run cleanup -- <path> --older-than <days> [--confirm]",
      );
      process.exit(1);
    }

    const cleaner = new Cleanup();
    cleaner.on("cleanup-start", (d) =>
      console.log(
        `\n🧹 Cleanup: ${d.directory}\nLooking for files older than ${d.daysThreshold} days...`,
      ),
    );

    cleaner.on("dry-run-complete", (res) => {
      console.log(`\nFound ${res.files.length} files to delete:\n`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      res.files.forEach((f) => {
        console.log(
          `${f.name}\n  Size: ${formatSize(f.size)}\n  Modified: ${f.daysOld} days ago (${f.mtimeStr})\n`,
        );
      });
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(
        `Total: ${res.files.length} files (${formatSize(res.totalSize)})`,
      );
      console.log("\n⚠️ DRY RUN MODE: No files were deleted.");
      console.log("To actually delete these files, run with --confirm flag.");
    });

    cleaner.on("deletion-start", (d) => {
      console.log(
        `\n⚠️ DELETING ${d.count} files (${formatSize(d.totalSize)}). This action cannot be undone!\n`,
      );
    });

    cleaner.on("file-deleted", (data) => {
      updateLine(`Deleting... ${drawProgressBar(data.current, data.total)}`);
    });

    cleaner.on("cleanup-complete", (res) => {
      console.log(
        `\n\n Cleanup complete!\ Deleted: ${res.deletedCount} files (${formatSize(res.totalSize)} freed)`,
      );
    });

    await cleaner.process(dir, threshold, confirm);
    break;
  }

  default:
    console.error(` Unknown command: ${command}`);
    process.exit(1);
}
