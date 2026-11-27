import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "TripMate",
  description: "Plan a trip together.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // The rule that picks the language belongs to the first feature card
  // (EPIC-01); until then the app is English.
  return (
    <html lang="en">
      <body>
        <Providers locale="en">{children}</Providers>
      </body>
    </html>
  );
}
