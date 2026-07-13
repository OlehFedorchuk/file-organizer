import scan from "./lib/scanner.js";
import duplicates from "./lib/duplicates.js";
import cleanup from "./lib/cleanup.js";
import organaizer from "./lib/organizer.js";
import fs from "node:fs/promises";

function main(arg, path) {
  if (!path) {
    console.log(
      "Error! Not entered path to derectiry, use: node analyzer.js <path>",
    );
    return 0;
  }
  switch (arg) {
    case "scan":
      scan(path);
      break;
    case "duplicates":
      console.log(duplicates(path));
      break;
    case "cleanup":
      console.log("Func cleanup", cleanup(path));
      break;
    case "organize":
      console.log("Func organize", organaizer(path));
      break;

    default:
      break;
  }
}

const [, , arg, path] = process.argv;
main(arg, path);
