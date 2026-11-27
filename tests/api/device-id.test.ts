// WF2-3 (level U): Any request -> It carries `X-Device-Id`, the same value
// after a reload. api-design.md, section 2: `X-Device-Id: <uuid>` on every
// request, created once per install. A reload is shown as a fresh module
// graph (`vi.resetModules()`) with the browser storage of jsdom kept.
// "Any request" covers the methods the client treats differently: a `GET`,
// a `POST` sent with an action (which also gets an `Idempotency-Key`) and a
// `POST` sent with no action (sign-in, refresh). The contract has no `POST`
// yet, so the `POST` path is made up (lead decision Q4).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse, pathOf, stubFetch } from "../support/fetch-stub";
import { UUID } from "../support/uuid";
import { load } from "../support/load";

const POST = {
  url: "/v1/wf2-test-records",
  method: "POST",
  data: { name: "WF2-3 record" },
};

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
    const calls = stubFetch((_callNumber, call) =>
      call.method === "POST"
        ? jsonResponse(201, { id: "wf2-3", name: "WF2-3 record" })
        : jsonResponse(200, { status: "ok", version: "wf2-3" }),
    );

    const client = await load<typeof import("../../src/api/client")>("/src/api/client");
    const generated = await load<typeof import("../../src/api/generated")>("/src/api/generated");

    await client.apiFetch({ url: "/v1/health", method: "GET" });
    await generated.healthV1HealthGet();
    await client.apiFetch(POST, { action: client.newAction() });
    await client.apiFetch(POST);

    expect(calls).toHaveLength(4);
    expect(calls.map((call) => [call.method, pathOf(call.url)])).toEqual([
      ["GET", "/v1/health"],
      ["GET", "/v1/health"],
      ["POST", "/v1/wf2-test-records"],
      ["POST", "/v1/wf2-test-records"],
    ]);
    const first = calls[0].headers.get("X-Device-Id");
    expect(first).toMatch(UUID);
    expect(calls[1].headers.get("X-Device-Id"), "GET through the generated client").toBe(first);
    expect(calls[2].headers.get("X-Device-Id"), "POST with an action").toBe(first);
    expect(calls[3].headers.get("X-Device-Id"), "POST with no action").toBe(first);

    // The reload: module state is gone, the browser storage stays.
    vi.resetModules();
    const reloaded = await load<typeof import("../../src/api/client")>("/src/api/client");
    await reloaded.apiFetch({ url: "/v1/health", method: "GET" });
    await reloaded.apiFetch(POST, { action: reloaded.newAction() });
    await reloaded.apiFetch(POST);

    expect(calls).toHaveLength(7);
    expect(calls.slice(4).map((call) => call.method)).toEqual(["GET", "POST", "POST"]);
    expect(calls[4].headers.get("X-Device-Id"), "GET after the reload").toBe(first);
    expect(calls[5].headers.get("X-Device-Id"), "POST with an action after the reload").toBe(first);
    expect(calls[6].headers.get("X-Device-Id"), "POST with no action after the reload").toBe(first);
  });
});
