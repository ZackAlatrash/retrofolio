import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "../src/components/Badge";
import { StatCounter } from "../src/components/StatCounter";
import { DeviceFrame } from "../src/components/DeviceFrame";
import { Diagram } from "../src/components/Diagram";

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

describe("Badge", () => {
  it("renders the status word", () => {
    render(<Badge status="deployed" />);
    expect(screen.getByText("deployed")).toBeInTheDocument();
  });
});

describe("StatCounter", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders the final value immediately under reduced motion", () => {
    setReducedMotion(true);
    render(<StatCounter value="~1,300" label="tests" />);
    expect(screen.getByText("~1,300")).toBeInTheDocument();
    expect(screen.getByText("tests")).toBeInTheDocument();
  });

  it("renders non-numeric values verbatim", () => {
    setReducedMotion(true);
    render(<StatCounter value="live" label="status" />);
    expect(screen.getByText("live")).toBeInTheDocument();
  });
});

describe("DeviceFrame", () => {
  it("exposes an accessible label and renders children", () => {
    render(
      <DeviceFrame kind="phone" label="Recomp Tracker screenshot">
        <span>inside</span>
      </DeviceFrame>,
    );
    expect(
      screen.getByRole("img", { name: "Recomp Tracker screenshot" }),
    ).toBeInTheDocument();
    expect(screen.getByText("inside")).toBeInTheDocument();
  });
});

describe("Diagram", () => {
  const stages = [
    { label: "query", caption: "embed" },
    { label: "answer", caption: "cited" },
  ];

  it("renders all stage labels and captions when fully revealed", () => {
    render(<Diagram stages={stages} />);
    expect(screen.getByText("query")).toBeInTheDocument();
    expect(screen.getByText("answer")).toBeInTheDocument();
    expect(screen.getByText("cited")).toBeInTheDocument();
  });
});
