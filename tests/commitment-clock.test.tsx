import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CommitmentClock } from "../src/showcase/CommitmentClock";
import { STREAK_TARGET, fill, lastDay, stateAt, verdictFor } from "../src/showcase/commitmentRules";
import { getProject } from "../src/content/projects";

const clock = getProject("locked-in")!.commitmentClock!;
const at = (day: number) => stateAt(day, clock);
const verdict = (id: string, day: number) => verdictFor(id, at(day), clock);

describe("commitment lifecycle", () => {
  it("runs active, into recovery, then back to active before the lock ends", () => {
    const { violation, resolved, restored } = clock.timeline;
    expect(at(0).phase).toBe("active");
    expect(at(violation - 1).phase).toBe("active");
    expect(at(violation).phase).toBe("recoveryPending");
    expect(at(resolved).phase).toBe("recovery");
    expect(at(restored - 1).phase).toBe("recovery");
    expect(at(restored).phase).toBe("active");
    expect(at(clock.lockDays).phase).toBe("completed");
  });

  it("does not accrue clean days while the entry prompt is unanswered", () => {
    // The pending state is a real one: the streak waits for the user.
    const { violation, resolved } = clock.timeline;
    expect(at(violation).streak).toBe(0);
    expect(at(resolved).streak).toBe(1);
  });

  it("needs seven consecutive clean days to restore", () => {
    const { resolved, restored } = clock.timeline;
    expect(at(restored - 1).streak).toBe(STREAK_TARGET);
    expect(restored - resolved).toBe(STREAK_TARGET);
  });

  it("cuts capacity while in recovery and restores it after", () => {
    const { violation, restored } = clock.timeline;
    expect(at(0).capacity).toBe(3);
    expect(at(violation).capacity).toBe(2);
    expect(at(restored).capacity).toBe(3);
  });

  it("tiles the lock into windows rather than one long stretch", () => {
    // Crossing a window boundary is what resets the violation count, so the
    // window a day falls in has to be visible.
    expect(at(0).window).toBe(1);
    expect(at(clock.windowDays - 1).window).toBe(1);
    expect(at(clock.windowDays).window).toBe(2);
    expect(at(0).windows).toBe(Math.ceil(clock.lockDays / clock.windowDays));
  });
});

describe("the gatekeeper", () => {
  it("locks the core rules but never the cosmetic ones", () => {
    // The per-field split is the point: a lock you can rename is still a lock.
    expect(verdict("edit-title", 0).allowed).toBe(true);
    expect(verdict("edit-title", clock.lockDays).allowed).toBe(true);
    expect(verdict("edit-frequency", 0).allowed).toBe(false);
    expect(verdict("edit-frequency", clock.lockDays).allowed).toBe(true);
  });

  it("blocks retiring during the lock, and removal until it is closed", () => {
    expect(verdict("retire", 0).allowed).toBe(false);
    expect(verdict("retire", clock.lockDays).allowed).toBe(true);
    expect(verdict("remove", 0).allowed).toBe(false);
    expect(verdict("remove", clock.lockDays).allowed).toBe(true);
  });

  it("blocks a new commitment only while recovery has cut capacity", () => {
    const { violation, restored } = clock.timeline;
    expect(verdict("add", 0).allowed).toBe(true);
    expect(verdict("add", violation).allowed).toBe(false);
    expect(verdict("add", restored).allowed).toBe(true);
  });

  it("gives a reason for every refusal", () => {
    // The engine's contract is that nothing is refused silently.
    for (let day = 0; day <= lastDay(clock); day++) {
      for (const action of clock.actions) {
        const v = verdictFor(action.id, at(day), clock);
        if (v.allowed) continue;
        expect(v.reason, `${action.id} on day ${day}`).toBeDefined();
        expect(v.message!.length).toBeGreaterThan(10);
        expect(v.message).not.toMatch(/\{[a-z]+\}/);
      }
    }
  });

  it("counts the lock down inside the refusal text, and pluralises at one", () => {
    const dayBeforeEnd = clock.lockDays - 1;
    const twoBefore = clock.lockDays - 2;
    expect(verdict("retire", dayBeforeEnd).message).toContain("1 day remaining");
    expect(verdict("retire", twoBefore).message).toContain("2 days remaining");
  });

  it("fills capacity numbers from the state, not from a fixed string", () => {
    const s = at(clock.timeline.violation);
    expect(fill("{a}/{b}", s, clock)).toBe(`${s.used}/${s.capacity}`);
  });
});

describe("commitment clock module", () => {
  it("shows the day, the state and every gated action", () => {
    const { container } = render(<CommitmentClock clock={clock} accent="#9aa0b8" />);
    expect(screen.getByRole("slider", { name: "Day of the commitment" })).toBeInTheDocument();
    expect(container.querySelector("[data-phase]")?.getAttribute("data-phase")).toBe("active");
    for (const action of clock.actions) {
      expect(container.querySelector(`[data-action="${action.id}"]`)).not.toBeNull();
    }
  });

  it("says outright that the commitment is an example", () => {
    render(<CommitmentClock clock={clock} accent="#9aa0b8" />);
    expect(screen.getByText(clock.note)).toBeInTheDocument();
    expect(clock.note).toMatch(/example/i);
  });
});

describe("locked in content", () => {
  it("treats the window as the fixed constant, not the lock", () => {
    // The lock length is chosen per commitment; only the window is hard-coded.
    const project = getProject("locked-in")!;
    expect(clock.windowDays).toBe(14);
    expect(project.problem).not.toMatch(/28-day lock/i);
    expect(project.metrics!.some((m) => m.value.includes("14-day"))).toBe(true);
  });

  it("carries no em dashes", () => {
    const copy = [
      clock.claim,
      clock.note,
      ...clock.actions.map((a) => a.label),
      ...clock.reasons.flatMap((r) => [r.title, r.message, r.hint ?? ""]),
      ...clock.pipeline.flatMap((p) => [p.label, p.detail]),
      ...clock.layers.flatMap((l) => [l.label, l.detail]),
    ];
    for (const line of copy) {
      expect(line, `em dash in: ${line}`).not.toContain("—");
    }
  });
});
