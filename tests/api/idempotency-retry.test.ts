// WF2-4 (level U): A create request that is retried -> Both attempts carry the
// same `Idempotency-Key`. Lead decision Q4: the caller names one user action
// with `newAction()`; every send of that action, automatic or by "Try again",
// is a retry and reuses its key. The contract has no create yet, so the
// request is a made-up `POST`.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { errorResponse, jsonResponse, stubFetch } from "../support/fetch-stub";
import { UUID } from "../support/uuid";
import { load } from "../support/load";

const CREATE = {
  url: "/v1/wf2-test-records",
  method: "POST",
  data: { name: "WF2-4 record" },
};

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Idempotency-Key on a retried create", () => {
  it("WF2-4 both attempts of a retried create request carry the same Idempotency-Key", async () => {
    const calls = stubFetch((callNumber) =>
      callNumber === 1
        ? errorResponse(503, "server.unavailable")
        : jsonResponse(201, { id: "wf2-4", name: "WF2-4 record" }),
    );

    const { apiFetch, newAction } = await load<typeof import("../../src/api/client")>("/src/api/client");

    const action = newAction();
    // The first attempt meets a 503; the client may retry it by itself.
    await apiFetch(CREATE, { action }).catch(() => undefined);
    // "Try again": the same action sent again.
    await apiFetch(CREATE, { action });

    const posts = calls.filter((call) => call.method === "POST");
    expect(posts.length).toBeGreaterThanOrEqual(2);
    const keys = posts.map((call) => call.headers.get("Idempotency-Key"));
    for (const key of keys) {
      expect(key).toMatch(UUID);
    }
    expect(new Set(keys).size).toBe(1);
  });
});
