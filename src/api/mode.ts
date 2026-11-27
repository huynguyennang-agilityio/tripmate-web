// Mock mode (EPIC-11 spec, section 2.11): on with NEXT_PUBLIC_API_MODE=mock
// outside a production build, and in screen tests (the Vitest setup file sets
// the same variable). A production build never has it: next.config.ts refuses
// to build with the variable set to `mock`, and this function answers `false`
// for a production build whatever the variable says.
export function isMockMode(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.NEXT_PUBLIC_API_MODE === "mock";
}
