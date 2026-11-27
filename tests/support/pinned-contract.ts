// Reads the pinned contracts version from the npm git dependency
// `tripmate-contracts` (lead decision Q1), at run time (Q3): the tests follow
// the pin and never hard-code the values of one version.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** Reads one file of the pinned package, for example `openapi.json`. */
export function readPinnedJson(file: string): unknown {
  return JSON.parse(readFileSync(require.resolve(`tripmate-contracts/${file}`), "utf8"));
}

type Json = Record<string, unknown>;

function asObject(value: unknown, what: string): Json {
  if (typeof value !== "object" || value === null) {
    throw new Error(`The pinned contract has no ${what}`);
  }
  return value as Json;
}

function deref(document: Json, value: Json): Json {
  const ref = value.$ref;
  if (typeof ref !== "string") return value;
  let node: unknown = document;
  for (const part of ref.replace(/^#\//, "").split("/")) {
    node = asObject(node, ref)[part];
  }
  return asObject(node, ref);
}

/** The example of the `application/json` answer of one operation's response. */
export function pinnedExample(path: string, method: string, status: string): Json {
  const document = asObject(readPinnedJson("openapi.json"), "openapi.json");
  const operation = asObject(
    asObject(asObject(document.paths, "paths")[path], path)[method],
    `${method} ${path}`,
  );
  const response = asObject(asObject(operation.responses, "responses")[status], status);
  const media = asObject(
    asObject(response.content, `content of ${status}`)["application/json"],
    "application/json content",
  );
  if (media.example !== undefined) return asObject(media.example, "example");
  if (media.examples !== undefined) {
    const first = Object.values(asObject(media.examples, "examples"))[0];
    return asObject(asObject(first, "example").value, "example value");
  }
  const schema = deref(document, asObject(media.schema, "schema"));
  if (schema.example !== undefined) return asObject(schema.example, "example");
  if (Array.isArray(schema.examples) && schema.examples.length > 0) {
    return asObject(schema.examples[0], "example");
  }
  throw new Error(`The pinned contract has no example for ${method} ${path} ${status}`);
}

/** One message of the pinned translations, for example ("vi", "server.unavailable"). */
export function pinnedMessage(language: "vi" | "en", key: string): string {
  const area = key.split(".")[0];
  const messages = asObject(readPinnedJson(`translations/${language}/${area}.json`), area);
  const text = messages[key];
  if (typeof text !== "string") {
    throw new Error(`The pinned translations have no ${language} text for ${key}`);
  }
  return text;
}
