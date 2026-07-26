import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SystemMap } from "../src/showcase/SystemMap";
import { getProject } from "../src/content/projects";

const map = getProject("omnipotence")!.systemMap!;

/** WCAG 2.1 relative luminance. */
function luminance(hex: string): number {
  const [r, g, b] = hex
    .replace("#", "")
    .match(/../g)!
    .map((h) => {
      const c = parseInt(h, 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * The node background as it actually composites: rgba(34,41,71,.95) over the
 * track's rgba(20,25,44,.6) over the detail screen's #0b0f1c. Measuring against
 * the flat colour would flatter every ratio below.
 */
const NODE_BG = "#212845";

function renderMap() {
  return render(<SystemMap map={map} accent="#a98fdb" />);
}

/** The stage node for a given track and 1-based position. */
function stageButton(trackLabel: string, ordinal: number) {
  return screen.getByRole("button", {
    name: new RegExp(`^${trackLabel} stage ${ordinal}:`),
  });
}

/** Every stage paired with the track it belongs to. */
const allStages = map.tracks.flatMap((t) =>
  t.stages.map((stage, i) => ({ stage, trackLabel: t.label, ordinal: i + 1 })),
);

describe("system map", () => {
  it("renders every stage of every track", () => {
    renderMap();
    for (const track of map.tracks) {
      expect(screen.getByText(track.label)).toBeInTheDocument();
    }
    for (const { stage, trackLabel, ordinal } of allStages) {
      expect(stageButton(trackLabel, ordinal).textContent).toContain(stage.label);
    }
  });

  it("names each stage once, not twice", async () => {
    const user = userEvent.setup();
    renderMap();
    // "chunk" the subcommand and "Chunk" the label are the same word. The node
    // shows the label; the subcommand belongs in the detail panel. Checked
    // structurally: prose like "one router profile per repo" legitimately
    // contains a command name, a dedicated badge element repeating it does not.
    for (const { stage, trackLabel, ordinal } of allStages) {
      if (!stage.command) continue;
      const node = stageButton(trackLabel, ordinal);
      const names = [stage.label.toLowerCase(), stage.command.toLowerCase()];
      const echoes = [...node.querySelectorAll("*")].filter((el) =>
        names.includes(el.textContent?.trim().toLowerCase() ?? ""),
      );
      expect(echoes, `${stage.label} is named more than once on the node`).toHaveLength(1);
    }

    const runnable = allStages.find((s) => s.stage.command)!;
    await user.click(stageButton(runnable.trackLabel, runnable.ordinal));
    expect(screen.getByText(new RegExp(`runs on its own: ${runnable.stage.command}`)))
      .toBeInTheDocument();
  });

  it("only claims a stage runs on its own when it really does", async () => {
    const user = userEvent.setup();
    renderMap();
    // Embed query and Route are part of `ask`, not separate subcommands.
    const notRunnable = allStages.filter((s) => !s.stage.command);
    expect(notRunnable.length).toBeGreaterThan(0);
    for (const { trackLabel, ordinal } of notRunnable) {
      await user.click(stageButton(trackLabel, ordinal));
      expect(screen.queryByText(/runs on its own/)).not.toBeInTheDocument();
      await user.click(stageButton(trackLabel, ordinal));
    }
  });

  it("has no run control", () => {
    renderMap();
    expect(screen.queryByRole("button", { name: /RUN/i })).not.toBeInTheDocument();
  });

  it("keeps the artifact off the node face and in the detail instead", async () => {
    const user = userEvent.setup();
    renderMap();
    const withOutput = allStages.filter((s) => s.stage.output);
    expect(withOutput.length).toBeGreaterThan(0);

    // Uniform boxes depend on nothing variable-length riding along on the node.
    for (const { stage, trackLabel, ordinal } of withOutput) {
      expect(stageButton(trackLabel, ordinal).textContent).not.toContain(stage.output!);
    }

    const first = withOutput[0];
    await user.click(stageButton(first.trackLabel, first.ordinal));
    expect(screen.getByText(new RegExp(`hands on: ${first.stage.output}`))).toBeInTheDocument();
  });

  it("shows nothing on a node but its number, name and implementation", () => {
    renderMap();
    // Whatever a node renders has to be shared by every node, or the boxes
    // stop matching.
    for (const { stage, trackLabel, ordinal } of allStages) {
      const text = stageButton(trackLabel, ordinal).textContent ?? "";
      const impl = stage.swap ? stage.swap.prod : stage.impl;
      const remainder = text
        .replace(String(ordinal).padStart(2, "0"), "")
        .replace(stage.step ?? "", "")
        .replace(stage.label, "")
        .replace(impl, "")
        .replace(/[▾⇄\s]/g, "");
      expect(remainder, `${stage.label} carries extra content`).toBe("");
    }
  });

  it("swaps only the swappable adapters when the target changes", async () => {
    const user = userEvent.setup();
    renderMap();

    const swappable = allStages.filter((s) => s.stage.swap);
    const fixed = allStages.filter((s) => !s.stage.swap);
    expect(swappable.length).toBeGreaterThan(0);

    // Production is the default view.
    for (const { stage, trackLabel, ordinal } of swappable) {
      expect(stageButton(trackLabel, ordinal).textContent).toContain(stage.swap!.prod);
    }

    await user.click(screen.getByRole("button", { name: "LOCAL DEV" }));

    for (const { stage, trackLabel, ordinal } of swappable) {
      expect(stageButton(trackLabel, ordinal).textContent).toContain(stage.swap!.local);
    }
    // The point of the switch: everything else is untouched.
    for (const { stage, trackLabel, ordinal } of fixed) {
      expect(stageButton(trackLabel, ordinal).textContent).toContain(stage.impl);
    }
  });

  it("opens a stage's detail on click and closes it again", async () => {
    const user = userEvent.setup();
    renderMap();
    const stage = map.tracks[0].stages[0];
    const node = stageButton(map.tracks[0].label, 1);

    expect(node).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(stage.detail)).not.toBeInTheDocument();

    await user.click(node);
    expect(node).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(stage.detail)).toBeInTheDocument();

    await user.click(node);
    expect(screen.queryByText(stage.detail)).not.toBeInTheDocument();
  });

  it("labels the deployment switch as a group with a pressed state", () => {
    renderMap();
    const group = screen.getByRole("group", { name: "Deployment target" });
    expect(within(group).getByRole("button", { name: "PRODUCTION" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(group).getByRole("button", { name: "LOCAL DEV" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});

describe("omnipotence system map content", () => {
  it("describes both pipelines", () => {
    expect(map.tracks.map((t) => t.id)).toEqual(["ingest", "ask"]);
  });

  it("every stage carries an implementation and a detail", () => {
    for (const stage of map.tracks.flatMap((t) => t.stages)) {
      expect(stage.impl, `${stage.label} impl`).toBeTruthy();
      expect(stage.detail.length, `${stage.label} detail`).toBeGreaterThan(40);
    }
  });

  it("keeps every text colour at WCAG AA against the node background", () => {
    // The map is dense and sits on a dark CRT, which is exactly where low
    // contrast stops being a style choice and starts being unreadable.
    const inks = {
      "INK (stage label)": "#eef0fa",
      "INK_2 (implementation)": "#b9c0dd",
      "INK_3 (artifact, muted)": "#98a1c6",
      "accent (purple shell)": "#a98fdb",
    };
    for (const [name, hex] of Object.entries(inks)) {
      expect(contrast(hex, NODE_BG), name).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps the node border visible enough to read as a control", () => {
    // WCAG 1.4.11: non-text UI components need 3:1. The border is the main
    // signal that a stage is a button, so it cannot be decorative-faint.
    const borders = {
      "resting border": "#737ebb",
      "top edge": "#8b97d4",
      "chevron border": "#7984bd",
    };
    for (const [name, hex] of Object.entries(borders)) {
      expect(contrast(hex, NODE_BG), name).toBeGreaterThanOrEqual(3);
    }
  });

  it("carries no em dashes", () => {
    const copy = map.tracks.flatMap((t) => [
      t.purpose,
      ...t.stages.flatMap((s) => [s.label, s.detail, s.output ?? ""]),
    ]);
    for (const line of [...copy, map.join]) {
      expect(line).not.toContain("—");
    }
  });
});
