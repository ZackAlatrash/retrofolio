import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarketingSite } from "../src/showcase/MarketingSite";
import { getProject } from "../src/content/projects";
import { FRAME_COUNT } from "../src/hero/useHeroScrub";

const site = getProject("kukis")!.marketingSite!;

function renderSite() {
  return render(<MarketingSite site={site} accent="#cf7d7d" />);
}

const outcome = (c: HTMLElement, approach: string) =>
  c.querySelector(`[data-approach="${approach}"]`)?.getAttribute("data-reachable");

describe("marketing site module", () => {
  it("shows both approaches for whichever shopper is picked", async () => {
    const user = userEvent.setup();
    const { container } = renderSite();

    for (const c of site.cases) {
      await user.click(screen.getByRole("button", { name: c.label }));
      for (const o of c.outcomes) {
        expect(outcome(container, o.approach)).toBe(o.reachable ? "yes" : "no");
        expect(screen.getByText(o.detail)).toBeInTheDocument();
      }
    }
  });

  it("opens on the case that carries the argument", async () => {
    // Landing on the shopper who accepts proves nothing: both approaches work.
    const { container } = renderSite();
    const declines = site.cases.find((c) => c.id === "declines")!;
    const pressed = screen.getByRole("button", { name: declines.label });
    expect(pressed).toHaveAttribute("aria-pressed", "true");
    expect(outcome(container, "Tools that depend on cookies")).toBe("no");
    expect(outcome(container, "Consent-first capture")).toBe("yes");
  });

  it("labels each outcome as reachable or lost", () => {
    const { container } = renderSite();
    const lost = container.querySelector('[data-reachable="no"]') as HTMLElement;
    expect(within(lost).getByText("LOST")).toBeInTheDocument();
  });

  it("lists the hero and delivery notes", () => {
    renderSite();
    for (const item of [...site.hero, ...site.delivery]) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
      expect(screen.getByText(item.detail)).toBeInTheDocument();
    }
  });
});

describe("kukis content", () => {
  it("makes exactly one approach fail, and only for the shopper who declines", () => {
    // If both shoppers looked the same the page would have no argument.
    const declines = site.cases.find((c) => c.id === "declines")!;
    const accepts = site.cases.find((c) => c.id === "accepts")!;
    expect(accepts.outcomes.every((o) => o.reachable)).toBe(true);
    expect(declines.outcomes.filter((o) => !o.reachable)).toHaveLength(1);
    expect(declines.outcomes.find((o) => o.reachable)!.approach).toMatch(/consent-first/i);
  });

  it("claims no figure for how many shoppers decline", () => {
    // The site's own standard is that every claim is defensible. A round
    // percentage with no source on the page would fail it.
    const copy = [
      site.claim,
      site.premise,
      ...site.cases.flatMap((c) => [c.label, ...c.outcomes.map((o) => o.detail)]),
    ];
    for (const line of copy) {
      expect(line, `unsourced figure in: ${line}`).not.toMatch(/\d+\s?%|\bhalf\b/i);
    }
  });

  it("only claims kinship with this site's hero while that is still true", () => {
    // The note says "same ninety-six frames". If the portfolio's own hero ever
    // changes length, this fails rather than quietly lying.
    expect(FRAME_COUNT).toBe(96);
    expect(site.heroNote).toMatch(/ninety-six/i);
  });

  it("carries no em dashes", () => {
    const copy = [
      site.claim,
      site.premise,
      site.heroNote,
      ...site.cases.flatMap((c) => [c.label, ...c.outcomes.flatMap((o) => [o.approach, o.detail])]),
      ...[...site.hero, ...site.delivery].flatMap((d) => [d.label, d.detail]),
    ];
    for (const line of copy) {
      expect(line, `em dash in: ${line}`).not.toContain("—");
    }
  });
});
