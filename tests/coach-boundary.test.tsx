import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoachBoundary } from "../src/showcase/CoachBoundary";
import { getProject } from "../src/content/projects";

const boundary = getProject("recomp-tracker")!.coachBoundary!;

function renderBoundary() {
  return render(<CoachBoundary boundary={boundary} accent="#8fd3a0" />);
}

describe("coach boundary", () => {
  it("shows every capability, grouped by how much freedom it gets", () => {
    renderBoundary();
    for (const lane of boundary.lanes) {
      expect(screen.getByText(lane.label)).toBeInTheDocument();
    }
    for (const tool of boundary.tools) {
      expect(screen.getByRole("button", { name: new RegExp(tool.label) })).toBeInTheDocument();
    }
  });

  it("explains a capability on click", async () => {
    const user = userEvent.setup();
    renderBoundary();
    const tool = boundary.tools[0];

    expect(screen.queryByText(tool.detail)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: new RegExp(tool.label) }));
    expect(screen.getByText(tool.detail)).toBeInTheDocument();
  });

  it("isolates either side of the boundary in a sample answer", async () => {
    const user = userEvent.setup();
    const { container } = renderBoundary();
    const opacity = (source: string) =>
      [...container.querySelectorAll<HTMLElement>(`[data-source="${source}"]`)].map(
        (el) => el.style.opacity,
      );

    expect(new Set(opacity("computed"))).toEqual(new Set(["1"]));
    expect(new Set(opacity("written"))).toEqual(new Set(["1"]));

    const filter = screen.getByRole("button", { name: /COMPUTED BY THE APP/ });
    expect(filter).toHaveAttribute("aria-pressed", "false");
    await user.click(filter);
    expect(filter).toHaveAttribute("aria-pressed", "true");

    // The model's half fades rather than disappearing: the point is the
    // proportion of an answer it is responsible for.
    expect(new Set(opacity("computed"))).toEqual(new Set(["1"]));
    expect(opacity("written").every((o) => Number(o) < 1)).toBe(true);

    await user.click(filter);
    expect(new Set(opacity("written"))).toEqual(new Set(["1"]));
  });

  it("lists the verdict outcomes in the order the engine tries them", () => {
    renderBoundary();
    const items = screen.getAllByRole("listitem");
    boundary.verdict.outcomes.forEach((outcome, i) => {
      expect(items[i].textContent).toContain(outcome.when);
    });
  });
});

describe("recomp tracker coach content", () => {
  it("has all 19 capabilities the resume claims", () => {
    expect(boundary.tools).toHaveLength(19);
  });

  it("splits them three ways, not two", () => {
    const count = (lane: string) => boundary.tools.filter((t) => t.lane === lane).length;
    // Nine read, eight gated writes, and two writes deliberately left ungated.
    expect(count("read")).toBe(9);
    expect(count("confirm")).toBe(8);
    expect(count("memory")).toBe(2);
    expect(boundary.lanes).toHaveLength(3);
  });

  it("carries four verdict states and eight ordered outcomes", () => {
    // Wait-for-data is a real state, not an edge case: it is where a new user
    // sits until fourteen days of data exist.
    expect(boundary.verdict.states).toHaveLength(4);
    expect(boundary.verdict.states).toContain("Wait for data");
    expect(boundary.verdict.outcomes).toHaveLength(8);
  });

  it("puts the two gates before any trend outcome", () => {
    const [first, second] = boundary.verdict.outcomes;
    expect(first.verdict).toBe("Wait for data");
    expect(second.verdict).toBe("Wait for data");
  });

  it("only ever moves calories on the two outcomes that should", () => {
    const moves = boundary.verdict.outcomes.filter((o) => o.change);
    expect(moves).toHaveLength(2);
    expect(moves.map((m) => m.change)).toEqual(["+150", "-100"]);
  });

  it("describes capabilities in plain language, with no code in the copy", () => {
    // The brief was explanation, not signatures: no snake_case identifiers,
    // no camelCase method names, no parentheses calls.
    const copy = [
      boundary.claim,
      ...boundary.tools.flatMap((t) => [t.label, t.detail]),
      ...boundary.lanes.flatMap((l) => [l.rule, l.why]),
      ...boundary.verdict.outcomes.map((o) => o.when),
      boundary.verdict.note,
    ];
    for (const line of copy) {
      expect(line, `snake_case in: ${line}`).not.toMatch(/[a-z]+_[a-z]+/);
      expect(line, `call syntax in: ${line}`).not.toMatch(/\w+\(\)/);
      expect(line, `em dash in: ${line}`).not.toContain("—");
    }
  });
});
