"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";

import { isMockMode } from "../api/mode";
import { messages, type Locale } from "../i18n/messages";

// The MSW service worker runs in the browser of the dev server only. Screen
// tests (NODE_ENV "test") answer through the MSW server of the Vitest setup
// file, and a production build never mocks. The `NODE_ENV` test is inlined by
// the build, so the dynamic import below, and MSW with it, is left out of a
// production bundle. `isMockMode()` (src/api/mode.ts) is the one rule for mock
// mode; the server and the browser evaluate the same two variables, so the
// first render is the same on both.
const usesBrowserWorker = () => process.env.NODE_ENV === "development" && isMockMode();

async function enableMocking(): Promise<void> {
  if (process.env.NODE_ENV === "development" && isMockMode()) {
    const { startMockWorker } = await import("../mocks/browser");
    await startMockWorker();
  }
}

export function Providers({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  // With the browser worker no screen renders before the worker answers.
  const [ready, setReady] = useState(!usesBrowserWorker());

  useEffect(() => {
    let active = true;
    enableMocking().then(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, []);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages[locale]}
      // A missing or broken message throws: the prerender of `next build`
      // fails, and the key is never shown as text.
      onError={(error) => {
        throw error;
      }}
      getMessageFallback={({ namespace, key }) => {
        throw new Error(`Missing message: ${[namespace, key].filter(Boolean).join(".")}`);
      }}
    >
      <QueryClientProvider client={queryClient}>{ready ? children : null}</QueryClientProvider>
    </NextIntlClientProvider>
  );
}
