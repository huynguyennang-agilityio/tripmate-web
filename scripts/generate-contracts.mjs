// Writes the generated client, hooks and MSW handlers (src/api/generated/) and
// the next-intl messages (src/messages/) from the pinned contracts version.
// Run it after moving the pin; commit the result.
import { join } from "node:path";

import { GENERATED_MESSAGES_DIR, REPO_ROOT, writeClient, writeMessages } from "./lib/contracts.mjs";

await writeClient(REPO_ROOT);
writeMessages(join(REPO_ROOT, GENERATED_MESSAGES_DIR));
console.log("generate:contracts: wrote src/api/generated and src/messages.");
