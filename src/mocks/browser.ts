// Mock mode in the browser (`NEXT_PUBLIC_API_MODE=mock`, dev server only).
// Loaded only through a dynamic import behind a non-production check in
// src/app/providers.tsx, so no production bundle holds MSW.
import { setupWorker } from "msw/browser";

import { apiBaseUrl } from "../api/client";
import { handlers } from "./handlers";

/** An API request: a path under `/v1/`, or any path of the API's origin. */
function isApiRequest(request: Request): boolean {
  const url = new URL(request.url);
  return url.pathname.startsWith("/v1/") || url.origin === new URL(apiBaseUrl()).origin;
}

export async function startMockWorker(): Promise<void> {
  await setupWorker(...handlers).start({
    // An API request with no handler is an error. Everything else the page
    // fetches (Next's RSC payloads and prefetches, `/__nextjs_*`, assets)
    // passes through.
    onUnhandledRequest(request, print) {
      if (isApiRequest(request)) print.error();
    },
  });
}
