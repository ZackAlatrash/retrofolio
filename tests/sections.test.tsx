import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "../src/sections/Hero";
import { ProofStrip } from "../src/sections/ProofStrip";
import { PipelineScene } from "../src/sections/PipelineScene";
import { ProjectScene } from "../src/sections/ProjectScene";
import { ScrollNarrative } from "../src/sections/ScrollNarrative";
import { getProject } from "../src/content/projects";
import { profile } from "../src/content/profile";

/** Reduced-motion matchMedia shim, matching tests/components.test.tsx. */
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

// Reduced motion keeps every section on its static final-state path (no GSAP,
// no timers), which is exactly what we want to assert against.
beforeEach(() => setReducedMotion(true));

describe("Hero", () => {
  it("renders the name and positioning line", () => {
    render(<Hero />);
    expect(screen.getByText(profile.name)).toBeInTheDocument();
    expect(screen.getByText(profile.positioning)).toBeInTheDocument();
  });
});

describe("ProofStrip", () => {
  it("renders every headline metric label", () => {
    render(<ProofStrip />);
    for (const m of profile.headlineMetrics) {
      expect(screen.getByText(m.label)).toBeInTheDocument();
    }
  });
});

describe("PipelineScene", () => {
  it("renders all six stage labels under reduced motion", () => {
    render(<PipelineScene />);
    const stages = getProject("omnipotence")!.diagram!;
    expect(stages).toHaveLength(6);
    for (const stage of stages) {
      expect(screen.getByText(stage.label)).toBeInTheDocument();
    }
  });
});

describe("ProjectScene", () => {
  it("exposes the citation deep-link id and the hardest-problem text", () => {
    const omni = getProject("omnipotence")!;
    const { container } = render(<ProjectScene project={omni} />);
    expect(container.querySelector("#project-omnipotence")).not.toBeNull();
    expect(screen.getByText(omni.hardestProblem!)).toBeInTheDocument();
  });
});

describe("ScrollNarrative", () => {
  it("renders the chatSlot node in place", () => {
    render(
      <ScrollNarrative
        chatSlot={<div data-testid="chat-slot">live chat</div>}
      />,
    );
    expect(screen.getByTestId("chat-slot")).toBeInTheDocument();
  });
});
