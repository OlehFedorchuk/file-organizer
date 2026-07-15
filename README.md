# 📂 File Organizer CLI

A powerful Node.js command-line application for scanning, organizing, and cleaning directories. It helps you analyze file statistics, detect duplicate files, organize files into categories, and safely remove outdated files.

---

## ✨ Features

- 📊 Scan directories recursively and generate detailed statistics.
- 🔍 Find duplicate files using SHA-256 hashing.
- 📦 Organize files into categories without modifying the originals.
- 🧹 Cleanup old files with safe Dry Run mode.
- ⚡ Progress tracking using EventEmitter.
- 💾 Efficient handling of large files using Streams.
- 🛡️ Comprehensive error handling for all filesystem operations.

---

## 📁 Project Structure

```
file-organizer/
├── package.json
├── .gitignore
├── README.md
├── file-organizer.js
└── lib/
├── scanner.js
├── duplicates.js
├── organizer.js
└── cleanup.js
```

---

## 🚀 Installation

Clone the repository:

bash git clone https://github.com/your-username/file-organizer.git

Go to the project directory:

bash cd file-organizer

Install dependencies

```
bash npm install
```

---

## ▶️ Usage

General syntax:

bash node file-organizer.js <command> [options]

or using npm scripts:

bash npm run <command> -- [arguments]

---

# 📊 Scan Command

Analyze a directory recursively and display detailed statistics.

### Command

bash node file-organizer.js scan /path/to/directory

or

bash npm run scan -- /path/to/directory

### Displays

- Total number of files
- Total directory size
- File types statistics
- File age statistics
- Top 3 largest files
- Oldest file

Example:

text 📂 Scanning:
Downloads Processing... ████████████████████ 247/247

📊 Scan Results Total files: 247 Total size: 1.2 GB
By File Type:
.pdf 89 files
.png 67 files
.zip 23 files

Largest Files:
video.mp4
archive.zip
presentation.pptx

---

# 🔍 Duplicates Command

Search for files with identical content using SHA-256 hashes.

### Command

bash node file-organizer.js duplicates /path/to/directory

or

bash npm run duplicates -- /path/to/directory

### Displays

- Duplicate groups
- SHA-256 hash
- File locations
- Wasted disk space
- Total wasted space

Example:

text Found 3 duplicate groups SHA-256: a3f2e1b8... lecture.pdf lecture(1).pdf lecture_copy.pdf Wasted space: 6.4 MB

---

# 📦 Organize Command

Copy files into categorized folders.

Original files remain untouched.

### Command

bash node file-organizer.js organize /source --output /target

or

bash npm run organize -- /source --output /target

### Categories

- Documents
- Images
- Archives
- Code
- Videos
- Other

Example output:

text Documents/ Images/ Archives/ Code/ Videos/ Other/ 247 files copied

Large files (10 MB or larger) are copied using Streams with pipeline() for improved performance and lower memory usage.

---

# 🧹 Cleanup Command

Find files older than a specified number of days.

## Dry Run

bash node file-organizer.js cleanup /path --older-than 90

Lists files without deleting them.

## Delete Files

bash node file-organizer.js cleanup /path --older-than 90 --confirm

Deletes the listed files after confirmation.

Displays:

- Number of files
- Total size
- Age
- Freed disk space

---

# 🏗️ Architecture

Each command is implemented as an independent class extending EventEmitter.

Classes:

- Scanner
- DuplicateFinder
- Organizer
- Cleanup

Events are used to:

- report progress
- update progress bars
- notify about completed operations
- handle errors independently from business logic

This architecture keeps the application modular, reusable, and easy to maintain.

---

# ⚙️ Technologies

- Node.js
- ES Modules
- File System API (fs/promises)
- Streams
- Pipeline
- Crypto (SHA-256)
- EventEmitter
- Path

---

# 🛡️ Error Handling

The application handles common filesystem errors:

- ENOENT – directory or file not found
- EACCES – permission denied
- Unexpected filesystem errors

Every filesystem operation is wrapped in try...catch blocks.

---

# 📈 Performance

To improve performance:

- Recursive directory scanning
- SHA-256 hashing using Streams
- Large file copying with pipeline()
- Event-driven architecture
- Memory-efficient processing

---

# 📜 Available Commands

| Command    | Description                          |
| ---------- | ------------------------------------ |
| scan       | Analyze directory contents           |
| duplicates | Find duplicate files                 |
| organize   | Copy files into categories           |
| cleanup    | Find and optionally delete old files |

---

# 💡 Example Workflow

bash npm run scan -- ~/Downloads npm run duplicates -- ~/Downloads npm run organize -- ~/Downloads --output ~/Organized npm run cleanup -- ~/Downloads --older-than 90 npm run cleanup -- ~/Downloads --older-than 90 --confirm
