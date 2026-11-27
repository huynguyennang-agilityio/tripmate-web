import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants";
import type { NextConfig } from "next";

// The service worker script MSW needs in the browser (mock mode, dev server
// only). It is copied to `public/` (git-ignored) when the dev server starts
// and removed before a production build, so `out/` never holds it.
const workerFile = join("public", "mockServiceWorker.js");

// ADR-0007: the Web client is a static build (HTML, JS, CSS) with no server
// rendering, no API routes and no server actions. `next build` writes it to `out/`.
export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) {
    if (process.env.NEXT_PUBLIC_API_MODE === "mock") {
      throw new Error(
        "NEXT_PUBLIC_API_MODE=mock is not allowed in a production build: mock mode " +
          "(MSW) must never ship. Unset NEXT_PUBLIC_API_MODE and build again; use " +
          "`NEXT_PUBLIC_API_MODE=mock npm run dev` for mock mode.",
      );
    }
    rmSync(workerFile, { force: true });
  }
  if (phase === PHASE_DEVELOPMENT_SERVER && process.env.NEXT_PUBLIC_API_MODE === "mock") {
    mkdirSync("public", { recursive: true });
    copyFileSync(createRequire(import.meta.url).resolve("msw/mockServiceWorker.js"), workerFile);
  }

  return {
    output: "export",
    // `next dev` would write an AGENTS.md; the rules live in CLAUDE.md.
    agentRules: false,
    // Type errors are owned by `npm run typecheck` only, so a type error fails
    // that check and not the static build. `next build` does not run ESLint.
    typescript: {
      ignoreBuildErrors: true,
    },
  };
}
