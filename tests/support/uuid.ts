// api-design.md, section 2: `X-Device-Id: <uuid>` and `Idempotency-Key: <uuid>`.
// Any UUID version is accepted (lead decision Q13).
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
