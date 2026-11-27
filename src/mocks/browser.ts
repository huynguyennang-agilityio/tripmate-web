// Mock mode in the browser (`NEXT_PUBLIC_API_MODE=mock`, dev server only).
// Loaded only through a dynamic import behind a non-production check in
// src/app/providers.tsx, so no production bundle holds MSW.
import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

export async function startMockWorker(): Promise<void> {
  await setupWorker(...handlers).start({ onUnhandledRequest: "error" });
}
