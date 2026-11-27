// @vitest-environment node
// WF2-9 (level C): The generated messages do not match the pinned contracts
// version -> The check fails. Lead decision Q6: the check runs on a copy of the
// tree; unchanged it passes, with one generated message changed it fails.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { copyRepo, runNodeScript, type RepoCopy } from "../support/repo-copy";

const CHECK = join("scripts", "check-contracts.mjs");

let copy: RepoCopy | undefined;

afterEach(() => {
  copy?.remove();
  copy = undefined;
});

type Messages = { [key: string]: string | Messages };

describe("check:contracts on the generated messages", () => {
  it(
    "WF2-9 the check fails when the generated messages do not match the pinned contracts version",
    () => {
      copy = copyRepo();

      const unchanged = runNodeScript(copy.root, CHECK);
      expect(unchanged.status, `the check on the unchanged tree:\n${unchanged.output}`).toBe(0);

      const file = join(copy.root, "src", "messages", "vi.json");
      const messages = JSON.parse(readFileSync(file, "utf8")) as Messages;
      const server = messages.server;
      expect(typeof server, "the generated vi messages have the area server").toBe("object");
      const area = server as Messages;
      expect(typeof area.unavailable, "server.unavailable in the generated vi messages").toBe(
        "string",
      );
      area.unavailable = `${String(area.unavailable)} (WF2-9)`;
      writeFileSync(file, `${JSON.stringify(messages, null, 2)}\n`);

      const changed = runNodeScript(copy.root, CHECK);
      expect(changed.status, `the check on changed messages:\n${changed.output}`).not.toBe(0);
      expect(changed.status, "the check ran to its end").not.toBeNull();
    },
    300_000,
  );
});
