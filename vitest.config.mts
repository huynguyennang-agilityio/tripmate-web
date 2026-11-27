import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    // Mock mode in every run (MSW server with the generated handlers).
    setupFiles: ["src/mocks/vitest.setup.ts"],
  },
});
