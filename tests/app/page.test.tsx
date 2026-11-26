import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import HomePage from "../../src/app/page";

afterEach(() => {
  cleanup();
});

describe("HomePage", () => {
  it("renders the TripMate heading", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "TripMate" }),
    ).toBeDefined();
  });
});
