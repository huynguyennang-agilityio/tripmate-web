// Generation from the pinned contracts version (the npm dependency
// `tripmate-contracts`), shared by `generate-contracts.mjs` (writes the
// committed output) and `check-contracts.mjs` (writes it to a temporary folder
// and compares). Both work offline once `npm ci` has run.
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { generate } from "orval";

import orvalConfig from "../../orval.config.mjs";

export const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
export const LANGUAGES = ["en", "vi"];
// The committed output, relative to the repository root.
export const GENERATED_CLIENT_DIR = "src/api/generated";
export const GENERATED_MESSAGES_DIR = "src/messages";
export const MUTATOR_FILE = "src/api/client.ts";

const translationsDir = (language) =>
  dirname(fileURLToPath(import.meta.resolve(`tripmate-contracts/translations/${language}/common.json`)));

/**
 * The messages of one language as one object, nested by the dots of the keys
 * (next-intl reads a dot as nesting): `server.unavailable` is
 * `{ "server": { "unavailable": "..." } }`. Keys are sorted, so the output
 * does not depend on the order of the files.
 */
export function buildMessages(language) {
  const dir = translationsDir(language);
  const flat = {};
  for (const file of readdirSync(dir).filter((name) => name.endsWith(".json")).sort()) {
    Object.assign(flat, JSON.parse(readFileSync(join(dir, file), "utf8")));
  }
  const nested = {};
  for (const key of Object.keys(flat).sort()) {
    const parts = key.split(".");
    let node = nested;
    for (const part of parts.slice(0, -1)) {
      node[part] ??= {};
      if (typeof node[part] === "string") {
        throw new Error(`Message key ${key} sits inside the text of another key`);
      }
      node = node[part];
    }
    const last = parts[parts.length - 1];
    if (typeof node[last] === "object") {
      throw new Error(`Message key ${key} has keys below it`);
    }
    node[last] = flat[key];
  }
  return nested;
}

/** Writes `<language>.json` for every language into `dir`. */
export function writeMessages(dir) {
  mkdirSync(dir, { recursive: true });
  for (const language of LANGUAGES) {
    writeFileSync(join(dir, `${language}.json`), `${JSON.stringify(buildMessages(language), null, 2)}\n`);
  }
}

/**
 * Runs Orval with `workspace` as the root of the output. The mutator is read
 * from the same relative place in the workspace, so the import path in the
 * generated files is the same wherever the workspace is.
 */
export async function writeClient(workspace) {
  if (workspace !== REPO_ROOT) {
    mkdirSync(join(workspace, dirname(MUTATOR_FILE)), { recursive: true });
    copyFileSync(join(REPO_ROOT, MUTATOR_FILE), join(workspace, MUTATOR_FILE));
    // Orval reads the version of @tanstack/react-query from package.json and writes
    // different code for each, so the workspace needs the same one.
    copyFileSync(join(REPO_ROOT, "package.json"), join(workspace, "package.json"));
  }
  await generate(orvalConfig.tripmate, workspace, { throwOnError: true });
}
