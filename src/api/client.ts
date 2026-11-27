// The one function every request of the Web client goes through, and the
// mutator of the Orval-generated client (orval.config.mjs).
//
// Headers (api-design.md, section 2):
// - `X-Device-Id: <uuid>` on every request, made once per install and kept in
//   localStorage, so it is the same after a reload.
// - `Idempotency-Key: <uuid>` on a `POST` sent with an action. One user action
//   is one `newAction()`; every send of that action, by the client or by a
//   "Try again" control, reuses its key. The user doing it again calls
//   `newAction()` again and gets a new key. A `POST` with no action (sign-in,
//   refresh) carries no key.

const DEVICE_ID_STORAGE_KEY = "tripmate.deviceId";
const DEFAULT_API_URL = "http://localhost:8000";

/** One user action; holds the `Idempotency-Key` of every send of it. */
export type ApiAction = { readonly idempotencyKey: string };

export type ApiRequest = {
  url: string;
  method: string;
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export type ApiOptions = {
  action?: ApiAction;
};

/** The error body of api-design.md, section 4.1. */
export type ApiErrorBody = {
  error: {
    code: string;
    params: Record<string, unknown>;
    fields: { field: string; code: string }[] | null;
    requestId: string;
  };
};

/** Thrown for every answer that is not 2xx; `code` is the error code of the body. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly body: unknown;
  readonly requestId: string | undefined;

  constructor(status: number, body: unknown, requestId: string | undefined) {
    const code = (body as Partial<ApiErrorBody> | null)?.error?.code;
    super(code ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.body = body;
    this.requestId = requestId;
  }
}

function uuid(): string {
  const webCrypto = globalThis.crypto;
  if (typeof webCrypto.randomUUID === "function") return webCrypto.randomUUID();
  // randomUUID exists only in a secure context; a page opened over plain HTTP
  // from another machine still needs an ID.
  const bytes = webCrypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

let memoryDeviceId: string | undefined;

/** The device ID: created once, then read back from localStorage. */
function deviceId(): string {
  try {
    const stored = globalThis.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (stored) return stored;
    const made = memoryDeviceId ?? uuid();
    globalThis.localStorage.setItem(DEVICE_ID_STORAGE_KEY, made);
    memoryDeviceId = made;
    return made;
  } catch {
    // Storage is blocked: keep one ID for the life of the page.
    memoryDeviceId ??= uuid();
    return memoryDeviceId;
  }
}

/** Starts one user action, with one new `Idempotency-Key`. */
export function newAction(): ApiAction {
  return { idempotencyKey: uuid() };
}

function apiUrl(path: string, params: ApiRequest["params"]): string {
  const base = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");
  const url = new URL(`${base}${path}`);
  for (const [name, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      url.searchParams.append(name, String(item));
    }
  }
  return url.href;
}

export async function apiFetch<T>(request: ApiRequest, options: ApiOptions = {}): Promise<T> {
  const method = request.method.toUpperCase();
  const headers = new Headers({ Accept: "application/json", ...request.headers });
  headers.set("X-Device-Id", deviceId());
  if (method === "POST" && options.action) {
    headers.set("Idempotency-Key", options.action.idempotencyKey);
  }
  let body: string | undefined;
  if (request.data !== undefined) {
    body = JSON.stringify(request.data);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json; charset=utf-8");
  }

  const response = await globalThis.fetch(apiUrl(request.url, request.params), {
    method,
    headers,
    body,
    signal: request.signal,
  });

  const text = response.status === 204 ? "" : await response.text();
  let parsed: unknown;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }
  if (!response.ok) {
    throw new ApiError(response.status, parsed, response.headers.get("X-Request-Id") ?? undefined);
  }
  return parsed as T;
}
