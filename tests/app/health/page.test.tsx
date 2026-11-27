// WF2-1 (level S): Mock mode on -> The test screen shows the example of
// `GET /v1/health` from the pinned contract.
// Mock mode is on in every Vitest run through the code's setup file (lead
// decision Q8); this test stubs nothing. The example is read from the pinned
// contract at run time (Q3). Only the values are asserted, in any layout (Q11).
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { pinnedExample } from "../../support/pinned-contract";
import { load } from "../../support/load";

afterEach(() => {
  cleanup();
});

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Matches an element whose own text holds `value` as a whole word. */
function holdsValue(value: string) {
  const pattern = new RegExp(`(^|[^A-Za-z0-9.])${escapeRegExp(value)}($|[^A-Za-z0-9.])`);
  return (content: string) => pattern.test(content);
}

describe("Test screen /health", () => {
  it("WF2-1 in mock mode the test screen shows the example of GET /v1/health from the pinned contract", async () => {
    const example = pinnedExample("/v1/health", "get", "200");
    expect(typeof example.status, "the example has a status").toBe("string");
    expect(typeof example.version, "the example has a version").toBe("string");

    const { Providers } = await load<typeof import("../../../src/app/providers")>("/src/app/providers");
    const { default: HealthPage } = await load<typeof import("../../../src/app/health/page")>("/src/app/health/page");

    render(
      <Providers locale="en">
        <HealthPage />
      </Providers>,
    );

    expect(
      (await screen.findAllByText(holdsValue(String(example.version)), {}, { timeout: 5000 }))
        .length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(holdsValue(String(example.status))).length).toBeGreaterThan(0);
  });
});
