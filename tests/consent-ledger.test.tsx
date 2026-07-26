import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentLedger } from "../src/showcase/ConsentLedger";
import { getProject } from "../src/content/projects";

const ledger = getProject("consented-cart")!.consentLedger!;

function renderLedger() {
  return render(<ConsentLedger ledger={ledger} accent="#cf7d7d" />);
}

const stateOf = (c: HTMLElement, kind: string) =>
  c.querySelector(`[data-record="${kind}"]`)?.getAttribute("data-state");

const sendable = (c: HTMLElement) =>
  [...c.querySelectorAll("[data-sendable]")].map((el) => el.getAttribute("data-sendable"));

describe("consent ledger", () => {
  it("starts with marketing unticked and ungranted", () => {
    const { container } = renderLedger();
    const box = screen.getByRole("checkbox");
    expect(box).not.toBeChecked();
    expect(stateOf(container, "Marketing")).toBe("withheld");
    expect(stateOf(container, "Transactional")).toBe("granted");
  });

  it("cannot reach a marketing send without ticking the box", async () => {
    const user = userEvent.setup();
    const { container } = renderLedger();
    // The claim invites the visitor to try. Transactional sendable, marketing not.
    expect(sendable(container)).toEqual(["yes", "no"]);

    await user.click(screen.getByRole("checkbox"));
    expect(stateOf(container, "Marketing")).toBe("granted");
    expect(sendable(container)).toEqual(["yes", "yes"]);

    await user.click(screen.getByRole("checkbox"));
    expect(stateOf(container, "Marketing")).toBe("withheld");
    expect(sendable(container)).toEqual(["yes", "no"]);
  });

  it("revokes each record without touching the other", async () => {
    const user = userEvent.setup();
    const { container } = renderLedger();
    await user.click(screen.getByRole("checkbox"));
    expect(sendable(container)).toEqual(["yes", "yes"]);

    const revokeButtons = screen.getAllByRole("button", { name: /revoke this record/ });
    // Revoking marketing must leave the emails the shopper asked for alone.
    await user.click(revokeButtons[1]);
    expect(stateOf(container, "Marketing")).toBe("revoked");
    expect(stateOf(container, "Transactional")).toBe("granted");
    expect(sendable(container)).toEqual(["yes", "no"]);

    await user.click(screen.getByRole("button", { name: /revoke this record/ }));
    expect(stateOf(container, "Transactional")).toBe("revoked");
    expect(sendable(container)).toEqual(["no", "no"]);
  });

  it("lists what each record preserves and what cannot happen", () => {
    renderLedger();
    for (const field of ledger.snapshot) {
      expect(screen.getByText(field.label)).toBeInTheDocument();
    }
    for (const g of ledger.guarantees) {
      expect(screen.getByText(g.cannot)).toBeInTheDocument();
      expect(screen.getByText(g.because)).toBeInTheDocument();
    }
  });
});

describe("consented cart consent content", () => {
  it("writes exactly two records, only one granted by default", () => {
    expect(ledger.rows).toHaveLength(2);
    expect(ledger.rows.filter((r) => r.grantedByDefault)).toHaveLength(1);
    expect(ledger.rows.find((r) => r.kind === "Marketing")!.grantedByDefault).toBe(false);
  });

  it("keeps the wording, not just a version number", () => {
    // The record snapshots verbatim text, which is a stronger claim than a
    // version integer and the reason the guarantee below holds.
    const labels = ledger.snapshot.map((f) => f.label.toLowerCase());
    expect(labels.some((l) => l.includes("wording"))).toBe(true);
    expect(labels.some((l) => l.includes("box"))).toBe(true);
  });

  it("claims a policy change cannot rewrite an existing record", () => {
    const g = ledger.guarantees.find((g) => /policy change/.test(g.cannot));
    expect(g, "the confirmed guarantee is stated").toBeDefined();
    expect(g!.because).toMatch(/never|nothing/i);
  });

  it("carries no em dashes and no code identifiers", () => {
    const copy = [
      ledger.claim,
      ...ledger.rows.flatMap((r) => [r.kind, r.purpose, r.allows]),
      ...ledger.snapshot.flatMap((f) => [f.label, f.detail]),
      ...ledger.guarantees.flatMap((g) => [g.cannot, g.because]),
    ];
    for (const line of copy) {
      expect(line, `em dash in: ${line}`).not.toContain("—");
      expect(line, `identifier in: ${line}`).not.toMatch(/[a-z]+[A-Z][a-z]+\b|\w+\(\)/);
    }
  });
});
