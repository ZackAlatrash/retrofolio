import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactScreen } from "../src/screens/ContactScreen";
import { SettingsProvider } from "../src/game/settings";
import { profile } from "../src/content/profile";

/** Reduced-motion matchMedia shim, matching tests/sections.test.tsx. */
function setReducedMotion(reduced: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes("reduce"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

const renderContact = () =>
  render(
    <SettingsProvider>
      <ContactScreen />
    </SettingsProvider>,
  );

describe("ContactScreen under reduced motion", () => {
  beforeEach(() => setReducedMotion(true));

  // The credits roll is wrapped in a masked layer so it dissolves at the top of
  // the frame instead of clipping on it. That wrapper is only styled when
  // motion is allowed; under reduced motion it must stay inert and leave the
  // roll in normal flow, where every line has to remain reachable.
  it("still renders the whole roll, mask wrapper or not", () => {
    renderContact();
    expect(screen.getByText("CONTACT")).toBeInTheDocument();
    expect(
      screen.getByText(/Valid Dutch residence and work permit/),
    ).toBeInTheDocument();
    expect(screen.getByText(/graduating 2027/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /DOWNLOAD CV/i }),
    ).toBeInTheDocument();
  });

  it("holds the real email and no invented destination", () => {
    renderContact();
    expect(screen.getByText(profile.email)).toBeInTheDocument();
  });
});

describe("ContactScreen with motion", () => {
  beforeEach(() => setReducedMotion(false));

  // The roll's own title is the only heading on this screen. Everything tried
  // above it, a full-bleed gradient band and then a framed plate, competed
  // with this heading rather than adding to it, so nothing sits up there now
  // and the HUD's own CONTACT highlight labels the screen.
  it("carries one heading and no marker above it", () => {
    const { container } = renderContact();
    expect(screen.getByText("CONTACT")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/STAGE 04/);
    expect(container.textContent).not.toMatch(/THE END/);
  });
});
