"use client";

import { useHealthV1HealthGet } from "../../api/generated";

// The test screen of WF2: reads `GET /v1/health` through the generated hook, in
// mock mode (the example of the contract) and in real mode (the backend).
export default function HealthPage() {
  const { data, error, isPending } = useHealthV1HealthGet();

  return (
    <main>
      <h1>Health</h1>
      {isPending && <p>Loading</p>}
      {error ? <p role="alert">Could not read GET /v1/health</p> : null}
      {data && (
        <dl>
          <dt>Status</dt>
          <dd>{data.status}</dd>
          <dt>Version</dt>
          <dd>{data.version}</dd>
        </dl>
      )}
    </main>
  );
}
