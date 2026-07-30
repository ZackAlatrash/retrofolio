import { describe, it, expect } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { EvidenceGate } from "../src/showcase/EvidenceGate";
import { getProject } from "../src/content/projects";

const gate = getProject("lex-ai")!.evidenceGate!;

function renderGate() {
  return render(<EvidenceGate gate={gate} accent="#7d8cc9" />);
}

const verdict = (c: HTMLElement) =>
  c.querySelector("[data-verdict]")?.getAttribute("data-verdict");

const slider = () => screen.getByRole("slider", { name: "Retrieval confidence" });

describe("evidence gate module", () => {
  it("flips from answering to refusing across the threshold", () => {
    const { container } = renderGate();
    expect(verdict(container)).toBe("answer");

    // Drive the input directly: dragging a range by keyboard would take 17 presses.
    fireRange(slider(), 0.1);
    expect(verdict(container)).toBe("refuse");

    fireRange(slider(), gate.threshold);
    expect(verdict(container)).toBe("answer");

    fireRange(slider(), gate.threshold - 0.01);
    expect(verdict(container)).toBe("refuse");
  });

  it("describes refusing as happening before the model is called", () => {
    const { container } = renderGate();
    fireRange(slider(), 0.1);
    expect(verdict(container)).toBe("refuse");
    expect(screen.getByText(gate.below)).toBeInTheDocument();
  });

  it("names the band the current score falls in", () => {
    renderGate();
    fireRange(slider(), 0.05);
    const offTopic = gate.bands.find((b) => b.to <= 0.2)!;
    expect(screen.getByText(offTopic.meaning)).toBeInTheDocument();

    fireRange(slider(), 0.75);
    const onTopic = gate.bands.find((b) => b.answered)!;
    expect(screen.getByText(onTopic.meaning)).toBeInTheDocument();
  });

  it("lists what was built by hand", () => {
    renderGate();
    for (const item of gate.handBuilt) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
      expect(screen.getByText(item.detail)).toBeInTheDocument();
    }
  });
});

describe("lex-ai gate content", () => {
  it("keeps the threshold clear of every measured on-topic question", () => {
    // The whole calibration argument: the line sits in empty space, so it does
    // not need nudging every time the corpus grows.
    const onTopic = gate.bands.filter((b) => b.answered);
    expect(onTopic.length).toBeGreaterThan(0);
    for (const band of onTopic) {
      expect(band.from, `${band.label} starts above the line`).toBeGreaterThan(gate.threshold);
    }
  });

  it("marks every band below the line as refused", () => {
    for (const band of gate.bands) {
      if (band.to <= gate.threshold) {
        expect(band.answered, `${band.label} is refused`).toBe(false);
      }
    }
  });

  it("covers the whole confidence range with no gaps", () => {
    const sorted = [...gate.bands].sort((a, b) => a.from - b.from);
    expect(sorted[0].from).toBe(0);
    sorted.slice(1).forEach((band, i) => {
      expect(band.from, `${band.label} continues from the previous band`).toBe(sorted[i].to);
    });
  });

  it("carries no em dashes", () => {
    const copy = [
      gate.claim,
      gate.below,
      gate.above,
      gate.calibration,
      ...gate.bands.flatMap((b) => [b.label, b.meaning]),
      ...gate.handBuilt.flatMap((h) => [h.label, h.detail]),
    ];
    for (const line of copy) {
      expect(line, `em dash in: ${line}`).not.toContain("—");
    }
  });
});

/** Set a range input's value the way a drag would, and let React see it. */
function fireRange(el: HTMLElement, value: number) {
  const input = el as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )!.set!;
  act(() => {
    setter.call(input, String(value));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
