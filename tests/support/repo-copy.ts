// Test support for WF2-6 and WF2-9 (lead decision Q6): a copy of the working
// tree in a temporary folder, with `node_modules` linked back, where a check can
// run on a changed generated file without touching the real tree.
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  rmdirSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));

const SKIPPED = new Set(["node_modules", ".git", ".next", "out", "coverage"]);

export type RepoCopy = { root: string; remove: () => void };

export function copyRepo(): RepoCopy {
  const root = mkdtempSync(join(tmpdir(), "tripmate-web-wf2-"));
  cpSync(REPO_ROOT, root, {
    recursive: true,
    filter: (source) => {
      const rel = relative(REPO_ROOT, source);
      if (rel === "") return true;
      return !SKIPPED.has(rel.split(sep)[0]) && !basename(source).endsWith(".tsbuildinfo");
    },
  });
  const link = join(root, "node_modules");
  // A junction needs no admin rights on Windows; elsewhere the type is ignored.
  symlinkSync(join(REPO_ROOT, "node_modules"), link, "junction");
  return {
    root,
    remove: () => {
      // Remove the link itself first, so the real node_modules is never walked.
      if (existsSync(link) || lstatSync(link, { throwIfNoEntry: false })) {
        try {
          unlinkSync(link);
        } catch {
          rmdirSync(link);
        }
      }
      rmSync(root, { recursive: true, force: true });
    },
  };
}

export type RunResult = { status: number | null; output: string };

/** Runs `node <script>` in `cwd`; `status` is the exit code. */
export function runNodeScript(cwd: string, script: string): RunResult {
  const run = spawnSync(process.execPath, [script], {
    cwd,
    encoding: "utf8",
    timeout: 240_000,
    env: { ...process.env, FORCE_COLOR: "0" },
  });
  return {
    status: run.status,
    output: `${run.stdout ?? ""}${run.stderr ?? ""}${run.error ? String(run.error) : ""}`,
  };
}

/** Every file under `dir` (recursive), sorted, as absolute paths. */
export function filesUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .sort();
}
