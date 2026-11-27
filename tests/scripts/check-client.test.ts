// @vitest-environment node
// WF2-6 (level C): The generated client does not match the pinned contracts
// version -> The check fails. Lead decision Q6: the check runs on a copy of the
// tree; unchanged it passes, with one generated client file changed it fails.
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { copyRepo, filesUnder, runNodeScript, type RepoCopy } from "../support/repo-copy";

const CHECK = join("scripts", "check-contracts.mjs");

let copy: RepoCopy | undefined;

afterEach(() => {
  copy?.remove();
  copy = undefined;
});

describe("check:contracts on the generated client", () => {
  it(
    "WF2-6 the check fails when the generated client does not match the pinned contracts version",
    () => {
      copy = copyRepo();

      const unchanged = runNodeScript(copy.root, CHECK);
      expect(unchanged.status, `the check on the unchanged tree:\n${unchanged.output}`).toBe(0);

      const generated = filesUnder(join(copy.root, "src", "api", "generated")).filter((file) =>
        file.endsWith(".ts"),
      );
      expect(generated.length, "generated client files").toBeGreaterThan(0);
      appendFileSync(generated[0], "\nexport const wf2DriftProbe = 1;\n");

      const changed = runNodeScript(copy.root, CHECK);
      expect(changed.status, `the check on a changed client:\n${changed.output}`).not.toBe(0);
      expect(changed.status, "the check ran to its end").not.toBeNull();
    },
    300_000,
  );
});
