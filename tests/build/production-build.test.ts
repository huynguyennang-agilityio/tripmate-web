// @vitest-environment node
// WF2-7 (level U): A production build with no mock setting -> Mock mode is off,
// and the mock handlers are not in the bundle. Lead decision Q5: one file checks
// `isMockMode()` and runs a real `next build`, then scans `out/` for
// `mockServiceWorker.js` and the `[MSW]` marker, after checking that the marker
// is in msw's own build (so its absence means something).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { REPO_ROOT, filesUnder } from "../support/repo-copy";
import { load } from "../support/load";

const MARKER = "[MSW]";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

function mswPackageRoot(): string {
  const require = createRequire(join(REPO_ROOT, "package.json"));
  let dir = dirname(require.resolve("msw/browser"));
  while (!existsSync(join(dir, "package.json")) || basename(dir) !== "msw") {
    const parent = dirname(dir);
    if (parent === dir) throw new Error("msw package root not found");
    dir = parent;
  }
  return dir;
}

function filesHolding(dir: string, text: string): string[] {
  return filesUnder(dir).filter((file) => readFileSync(file, "latin1").includes(text));
}

describe("Production build", () => {
  it(
    "WF2-7 a production build with no mock setting has mock mode off and no mock handlers in the bundle",
    async () => {
      // Mock mode is off in production with no mock setting.
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("NEXT_PUBLIC_API_MODE", undefined);
      vi.resetModules();
      const { isMockMode } = await load<typeof import("../../src/api/mode")>("/src/api/mode");
      expect(isMockMode()).toBe(false);

      // The marker is real: msw's own build holds it.
      const msw = mswPackageRoot();
      const mswScripts = filesUnder(join(msw, "lib")).filter((file) => /\.(m?js|cjs)$/.test(file));
      expect(mswScripts.some((file) => readFileSync(file, "latin1").includes(MARKER))).toBe(true);

      // A production build with no mock setting.
      const dropped = (name: string) =>
        name === "NEXT_PUBLIC_API_MODE" || name === "NODE_ENV" || name.startsWith("VITEST");
      const env = Object.fromEntries(
        Object.entries({ ...process.env, NEXT_TELEMETRY_DISABLED: "1" }).filter(
          ([name]) => !dropped(name),
        ),
        // NODE_ENV is left out on purpose: `next build` sets it to production itself.
      ) as unknown as NodeJS.ProcessEnv;
      const build = spawnSync(
        process.execPath,
        [join(REPO_ROOT, "node_modules", "next", "dist", "bin", "next"), "build"],
        { cwd: REPO_ROOT, env, encoding: "utf8", timeout: 280_000 },
      );
      expect(build.status, `next build:\n${build.stdout}${build.stderr}`).toBe(0);

      const out = join(REPO_ROOT, "out");
      const files = filesUnder(out);
      expect(files.length, "out/ holds the build").toBeGreaterThan(0);
      expect(
        files.some(
          (file) =>
            (file === join(out, "health.html") || file === join(out, "health", "index.html")) &&
            readFileSync(file).length > 0,
        ),
        "the test screen /health is in the build",
      ).toBe(true);
      expect(
        files.every((file) => !/mockServiceWorker\.js$/.test(file)),
        "no mockServiceWorker.js in out/",
      ).toBe(true);
      expect(filesHolding(out, MARKER), `no file of out/ holds ${MARKER}`).toEqual([]);
    },
    300_000,
  );
});
