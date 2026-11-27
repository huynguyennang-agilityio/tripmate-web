// WF2-5 (level U): The same action done a second time by the user -> A new key.
// Lead decision Q4: the user doing it again is a new action (`newAction()`),
// which gets a new `Idempotency-Key`, even with the same request.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse, stubFetch } from "../support/fetch-stub";
import { UUID } from "../support/uuid";
import { load } from "../support/load";

const CREATE = {
  url: "/v1/wf2-test-records",
  method: "POST",
  data: { name: "WF2-5 record" },
};

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Idempotency-Key on a new action", () => {
  it("WF2-5 the same action done a second time by the user gets a new Idempotency-Key", async () => {
    const calls = stubFetch(() => jsonResponse(201, { id: "wf2-5", name: "WF2-5 record" }));

    const { apiFetch, newAction } = await load<typeof import("../../src/api/client")>("/src/api/client");

    await apiFetch(CREATE, { action: newAction() });
    await apiFetch(CREATE, { action: newAction() });

    expect(calls).toHaveLength(2);
    const first = calls[0].headers.get("Idempotency-Key");
    const second = calls[1].headers.get("Idempotency-Key");
    expect(first).toMatch(UUID);
    expect(second).toMatch(UUID);
    expect(second).not.toBe(first);
  });
});
