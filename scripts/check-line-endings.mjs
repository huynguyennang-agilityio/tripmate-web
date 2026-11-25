// Fails when the working tree differs from the index right after a checkout,
// which is how a line-ending problem shows on Windows or macOS (WF1-3).
// Node only, so it runs the same on every OS.
import { execFileSync } from "node:child_process";

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

const status = git(["status", "--porcelain"]);

if (status.trim() === "") {
  console.log("check:eol: working tree is clean.");
  process.exit(0);
}

console.error("check:eol: these files show as changed:");
console.error(status);
console.error("git ls-files --eol:");
console.error(git(["ls-files", "--eol"]));
process.exit(1);
