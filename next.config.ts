import type { NextConfig } from "next";

// ADR-0007: the Web client is a static build (HTML, JS, CSS) with no server
// rendering, no API routes and no server actions. `next build` writes it to `out/`.
const nextConfig: NextConfig = {
  output: "export",
  // Type errors are owned by `npm run typecheck` only, so a type error fails
  // that check and not the static build. `next build` does not run ESLint.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
