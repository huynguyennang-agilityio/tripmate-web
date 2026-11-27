// WF2-8 (level S): A screen test of one message key -> The key shows its text in
// Vietnamese and in English. The texts are read from the pinned translations
// at run time (lead decision Q3). `server.unavailable` is used because its two
// texts differ (`common.app_name` is the same in both languages).
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { pinnedMessage } from "../support/pinned-contract";
import { load } from "../support/load";

const KEY = "server.unavailable";

afterEach(() => {
  cleanup();
});

describe("Messages", () => {
  it("WF2-8 one message key shows its text in Vietnamese and in English", async () => {
    const viText = pinnedMessage("vi", KEY);
    const enText = pinnedMessage("en", KEY);
    expect(viText).not.toBe(enText);

    const { useTranslations } = await load<typeof import("next-intl")>("next-intl");
    const { Providers } = await load<typeof import("../../src/app/providers")>("/src/app/providers");

    function Probe() {
      const t = useTranslations();
      return <p data-testid="wf2-8">{t(KEY)}</p>;
    }

    render(
      <Providers locale="vi">
        <Probe />
      </Providers>,
    );
    expect((await screen.findByTestId("wf2-8")).textContent).toBe(viText);
    cleanup();

    render(
      <Providers locale="en">
        <Probe />
      </Providers>,
    );
    expect((await screen.findByTestId("wf2-8")).textContent).toBe(enText);
  });
});
