// WF2-3 (level U): Any request -> It carries `X-Device-Id`, the same value
// after a reload. api-design.md, section 2: `X-Device-Id: <uuid>` on every
// request, created once per install. A reload is shown as a fresh module
// graph (`vi.resetModules()`) with the browser storage of jsdom kept.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse, pathOf, stubFetch } from "../support/fetch-stub";
import { UUID } from "../support/uuid";
import { load } from "../support/load";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("X-Device-Id", () => {
  it("WF2-3 every request carries X-Device-Id, the same value after a reload", async () => {
    const calls = stubFetch(() => jsonResponse(200, { status: "ok", version: "wf2-3" }));

    const client = await load<typeof import("../../src/api/client")>("/src/api/client");
    const generated = await load<typeof import("../../src/api/generated")>("/src/api/generated");

    await client.apiFetch({ url: "/v1/health", method: "GET" });
    await generated.healthV1HealthGet();

    expect(calls).toHaveLength(2);
    expect(calls.map((call) => pathOf(call.url))).toEqual(["/v1/health", "/v1/health"]);
    const first = calls[0].headers.get("X-Device-Id");
    expect(first).toMatch(UUID);
    expect(calls[1].headers.get("X-Device-Id")).toBe(first);

    // The reload: module state is gone, the browser storage stays.
    vi.resetModules();
    const reloaded = await load<typeof import("../../src/api/client")>("/src/api/client");
    await reloaded.apiFetch({ url: "/v1/health", method: "GET" });

    expect(calls).toHaveLength(3);
    expect(calls[2].headers.get("X-Device-Id")).toBe(first);
  });
});
