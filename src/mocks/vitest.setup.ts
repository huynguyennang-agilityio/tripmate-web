// Mock mode in every Vitest run (EPIC-11 spec, section 2.11): the MSW server
// answers with the generated handlers, and a request with no handler fails the
// test. A test that stubs `fetch` replaces it for that test only.
import { afterAll, afterEach, beforeAll } from "vitest";
import { setupServer } from "msw/node";

import { handlers } from "./handlers";

process.env.NEXT_PUBLIC_API_MODE = "mock";

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
