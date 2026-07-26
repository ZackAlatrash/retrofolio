import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VisionBench } from "../src/showcase/VisionBench";
import { getProject } from "../src/content/projects";

const bench = getProject("tulipvision")!.visionBench!;

function renderBench() {
  return render(<VisionBench bench={bench} accent="#84b98e" />);
}

const stepButton = (i: number) =>
  screen.getByRole("button", { name: new RegExp(bench.tiling.steps[i].label) });

describe("vision bench", () => {
  it("walks through the tiling method one step at a time", async () => {
    const user = userEvent.setup();
    renderBench();

    expect(stepButton(0)).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(bench.tiling.steps[0].detail)).toBeInTheDocument();

    for (let i = 1; i < bench.tiling.steps.length; i++) {
      await user.click(stepButton(i));
      expect(stepButton(i)).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByText(bench.tiling.steps[i].detail)).toBeInTheDocument();
    }
  });

  it("describes each diagram state for screen readers", async () => {
    const user = userEvent.setup();
    renderBench();
    // The diagram carries the argument, so it cannot be decorative.
    const first = screen.getByRole("img").getAttribute("aria-label");
    expect(first).toBeTruthy();

    await user.click(stepButton(3));
    expect(screen.getByRole("img").getAttribute("aria-label")).not.toBe(first);
  });

  it("draws the overlay live rather than trusting a picture to contain it", async () => {
    // A supplied image is a backdrop only. Boxes baked into artwork would be a
    // fake screenshot of a detector whose real scores are two panels below.
    const user = userEvent.setup();
    const withImage = {
      ...bench,
      tiling: { ...bench.tiling, image: "game/method/tulipvision-field.webp" },
    };
    const { container } = render(<VisionBench bench={withImage} accent="#84b98e" />);
    const img = container.querySelector("image");

    expect(img).not.toBeNull();
    // Built from BASE_URL, never a leading slash: Pages serves from a subpath.
    expect(img!.getAttribute("href")).toBe(
      `${import.meta.env.BASE_URL}game/method/tulipvision-field.webp`,
    );
    expect(img!.getAttribute("href")!.startsWith("/")).toBe(
      import.meta.env.BASE_URL.startsWith("/"),
    );

    // The overlay is redrawn per step, so it cannot be part of the artwork:
    // one model input at step one, the full grid of crops at step two.
    const dashed = () => container.querySelectorAll("rect[stroke-dasharray]").length;
    expect(dashed()).toBe(1);
    await user.click(screen.getByRole("button", { name: /Cut into tiles/ }));
    expect(dashed()).toBeGreaterThan(1);
  });

  it("degrades to a flat field when the art is missing", () => {
    // A missing asset must never leave a blank rectangle where the diagram was.
    const noImage = { ...bench, tiling: { ...bench.tiling, image: undefined } };
    const { container } = render(<VisionBench bench={noImage} accent="#84b98e" />);

    expect(container.querySelector("image")).toBeNull();
    // The plants still have stand-ins, so every step still reads.
    expect(container.querySelectorAll("circle").length).toBeGreaterThan(0);
    expect(container.querySelector("svg[role='img'] rect")).not.toBeNull();
  });

  it("lets the art show the plants instead of covering them with markers", () => {
    const { container } = renderBench();
    expect(bench.tiling.image).toBeTruthy();
    expect(container.querySelectorAll("circle").length).toBe(0);
  });

  it("disclaims the overlay as illustration, not detector output", () => {
    // The real scores sit two panels below, so an unlabelled overlay on a
    // field image would read as a screenshot of the model producing them.
    renderBench();
    expect(screen.getByText(bench.tiling.note)).toBeInTheDocument();
    expect(bench.tiling.note).toMatch(/not .*output|schematic|illustration/i);
    expect(bench.tiling.note).toMatch(/not/i);
  });

  it("marks which track was the author's own", () => {
    const { container } = renderBench();
    const mine = bench.models.filter((m) => m.mine);
    expect(mine).toHaveLength(1);
    const row = container.querySelector(`[data-model="${mine[0].name}"]`)!;
    expect(within(row as HTMLElement).getByText("MY TRACK")).toBeInTheDocument();
  });

  it("renders unscored models without inventing a number", () => {
    const { container } = renderBench();
    const unscored = bench.models.filter((m) => m.map50 === undefined);
    expect(unscored.length).toBeGreaterThan(0);
    for (const m of unscored) {
      const row = container.querySelector(`[data-model="${m.name}"]`) as HTMLElement;
      expect(within(row).getByText("not scored")).toBeInTheDocument();
      expect(row.querySelector("[style*='width']")).toBeNull();
    }
  });
});

describe("tulipvision bench content", () => {
  it("does not present the author's model as the winner", () => {
    // The credibility of the study rests on reporting it straight.
    const scored = bench.models.filter((m) => typeof m.map50 === "number");
    const best = scored.reduce((a, b) => (a.map50! >= b.map50! ? a : b));
    expect(best.mine, "the best scoring model is not the author's").toBe(false);
    expect(bench.models.find((m) => m.mine)!.map50).toBeLessThan(best.map50!);
  });

  it("keeps every reported figure inside a sane range", () => {
    for (const m of bench.models) {
      for (const v of [m.map50, m.precision, m.recall]) {
        if (v === undefined) continue;
        expect(v, `${m.name} figure is a proportion`).toBeGreaterThan(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it("explains the method without naming algorithms or code", () => {
    const copy = [
      bench.claim,
      bench.protocol,
      ...bench.tiling.steps.flatMap((s) => [s.label, s.detail]),
      ...bench.shipped.flatMap((s) => [s.label, s.detail]),
    ];
    for (const line of copy) {
      expect(line, `em dash in: ${line}`).not.toContain("—");
      expect(line, `jargon in: ${line}`).not.toMatch(/\bNMS\b|non-maximum|\d+x\d+/i);
    }
  });
});
