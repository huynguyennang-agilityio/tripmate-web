// Test support for WF2-3, WF2-4 and WF2-5: a `fetch` stub that records every
// call the client makes and answers with a fixed `Response`.
import { vi } from "vitest";

export type RecordedCall = {
  url: string;
  method: string;
  headers: Headers;
};

type Responder = (callNumber: number, call: RecordedCall) => Response;

function headersOf(input: RequestInfo | URL, init?: RequestInit): Headers {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init?.headers).forEach((value, name) => {
    headers.set(name, value);
  });
  return headers;
}

function urlOf(input: RequestInfo | URL): string {
  if (input instanceof Request) return input.url;
  return input instanceof URL ? input.href : String(input);
}

/** Replaces `globalThis.fetch` for the current test; returns the calls it saw. */
export function stubFetch(respond: Responder): RecordedCall[] {
  const calls: RecordedCall[] = [];
  const fake = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: RecordedCall = {
      url: urlOf(input),
      method: (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase(),
      headers: headersOf(input, init),
    };
    calls.push(call);
    return respond(calls.length, call);
  });
  vi.stubGlobal("fetch", fake);
  return calls;
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

/** The error body of api-design.md, section 4.1. */
export function errorResponse(status: number, code: string): Response {
  return jsonResponse(status, {
    error: { code, params: {}, fields: null, requestId: "01WF2TESTREQUESTID00000000" },
  });
}

/** The path of a recorded URL, absolute or relative. */
export function pathOf(url: string): string {
  return new URL(url, "http://localhost").pathname;
}
