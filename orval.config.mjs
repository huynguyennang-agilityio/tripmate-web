// Orval generates the typed client, the TanStack Query hooks and the MSW
// handlers from the pinned contracts version (the npm dependency
// `tripmate-contracts`, EPIC-11 spec, sections 2.10 and 2.11). The output is
// committed; `npm run generate` rewrites it and `npm run check:contracts`
// fails when it differs from what the pinned version gives.
// Paths are relative to the workspace: the repository root, or the temporary
// folder of scripts/check-contracts.mjs (which keeps the same layout).
import { fileURLToPath } from "node:url";

const config = {
  tripmate: {
    input: {
      // An absolute path, so the check can run in a folder with no node_modules.
      target: fileURLToPath(import.meta.resolve("tripmate-contracts/openapi.json")),
    },
    output: {
      mode: "single",
      target: "src/api/generated/index.ts",
      schemas: "src/api/generated/model",
      client: "react-query",
      // The axios-style call shape: one request object, the data back (see src/api/client.ts).
      httpClient: "axios",
      mock: {
        generators: [
          {
            type: "msw",
            // Answers come from the examples of the contract, never from random data.
            useExamples: true,
            // No delay: screen tests and the dev server answer at once.
            delay: false,
          },
        ],
      },
      clean: true,
      override: {
        mutator: { path: "src/api/client.ts", name: "apiFetch" },
        query: { useQuery: true },
      },
    },
  },
};

export default config;
