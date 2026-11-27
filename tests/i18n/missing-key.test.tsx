// WF2-10 (level S): A key the pinned contracts version does not have -> The
// build fails; no key is shown as raw text. Lead decision Q10: both typed keys
// (the `@ts-expect-error` below makes `npm run typecheck` fail unless such a key
// is a type error) and a throw on a missing message (so the prerender of
// `next build` fails); never the raw key.
import { cleanup, render } from "@testing-library/react";
import { Component, type ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { load } from "../support/load";

const MISSING = "wf2.key_not_in_contract";

afterEach(() => {
  cleanup();
});

class Catch extends Component<{ onError: (error: unknown) => void; children: ReactNode }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

describe("A message key the pinned contract does not have", () => {
  it("WF2-10 a key the pinned contracts version does not have fails the build and is never shown as raw text", async () => {
    const { useTranslations } = await load<typeof import("next-intl")>("next-intl");
    const { Providers } = await load<typeof import("../../src/app/providers")>("/src/app/providers");

    function Probe() {
      const t = useTranslations();
      // @ts-expect-error -- WF2-10: the key is not in the pinned contract, so it must not type check
      const text = t(MISSING);
      return <p>{text}</p>;
    }

    const errors: unknown[] = [];
    render(
      <Providers locale="en">
        <Catch onError={(error) => errors.push(error)}>
          <Probe />
        </Catch>
      </Providers>,
    );

    expect(errors.length, "the missing key throws").toBeGreaterThan(0);
    expect(document.body.textContent ?? "").not.toContain(MISSING);
    expect(document.body.textContent ?? "").not.toContain("key_not_in_contract");
  });
});
