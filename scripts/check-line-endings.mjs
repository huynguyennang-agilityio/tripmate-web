// Fails when a text file breaks the LF rule of .gitattributes (WF1-3):
// 1. the working tree differs from the index right after a checkout, which
//    is how a line-ending problem shows on Windows or macOS; or
// 2. `git ls-files --eol` reports a CRLF or mixed ending in the index or in
//    the working tree. Git does not report a file whose blob already has
//    CRLF, or a CRLF working copy made before .gitattributes existed, as
//    changed, so step 1 alone cannot see them.
// Files Git treats as binary (`-text`) are skipped.
// Node only, so it runs the same on every OS.
import { execFileSync } from "node:child_process";

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

const BAD_ENDINGS = new Set(["crlf", "mixed"]);

// With -z each entry is "i/<eol> w/<eol> attr/<attr>\t<path>" ended by NUL.
function badEolEntries() {
  const bad = [];
  for (const entry of git(["ls-files", "--eol", "-z"]).split("\0")) {
    if (entry === "") continue;
    const tab = entry.indexOf("\t");
    const [index, worktree, ...attrParts] = entry.slice(0, tab).trim().split(/\s+/);
    const path = entry.slice(tab + 1);
    const indexEol = index.replace(/^i\//, "");
    const worktreeEol = worktree.replace(/^w\//, "");
    const attr = attrParts.join(" ").replace(/^attr\//, "");
    if (indexEol === "-text" || /(^|\s)-text(\s|$)/.test(attr)) continue;
    if (BAD_ENDINGS.has(indexEol) || BAD_ENDINGS.has(worktreeEol)) {
      bad.push(`${index} ${worktree} ${path}`);
    }
  }
  return bad;
}

let failed = false;

const status = git(["status", "--porcelain"]);
if (status.trim() !== "") {
  failed = true;
  console.error("check:eol: these files show as changed:");
  console.error(status);
}

const bad = badEolEntries();
if (bad.length > 0) {
  failed = true;
  console.error("check:eol: these text files have CRLF or mixed line endings:");
  for (const line of bad) console.error(`  ${line}`);
}

if (failed) {
  console.error("git ls-files --eol:");
  console.error(git(["ls-files", "--eol"]));
  process.exit(1);
}

console.log("check:eol: working tree is clean and every text file is LF.");
