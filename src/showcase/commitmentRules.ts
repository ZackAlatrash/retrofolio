import type { CommitmentClock, PolicyReasonCopy } from "../content/types";

/**
 * The example commitment, evaluated for a given day.
 *
 * Kept as plain functions over plain values, with no React in sight, which is
 * the same rule the app it describes applies to its own domain layer. It also
 * means the lifecycle can be tested directly rather than through the UI.
 */

export type Phase = "active" | "recoveryPending" | "recovery" | "completed";

export interface ClockState {
  day: number;
  phase: Phase;
  /** Short label for the state chip. */
  label: string;
  /** Why it is in this state, in one line. */
  detail: string;
  /** Protocols the system will allow at once. */
  capacity: number;
  used: number;
  /** Consecutive clean days counted so far, and the target. */
  streak: number;
  streakTarget: number;
  /** 1-based window the day falls in, and how many the lock contains. */
  window: number;
  windows: number;
  /** Whole days left before the lock ends. Zero once it has. */
  daysRemaining: number;
  lockEnded: boolean;
}

export const STREAK_TARGET = 7;
const STABLE_CAPACITY = 3;
const RECOVERY_CAPACITY = 2;

/** Last day the scrubber reaches: a little past lock end, to show completion. */
export function lastDay(c: CommitmentClock): number {
  return c.lockDays + 3;
}

export function stateAt(day: number, c: CommitmentClock): ClockState {
  const { violation, resolved, restored } = c.timeline;
  const windows = Math.ceil(c.lockDays / c.windowDays);
  const lockEnded = day >= c.lockDays;
  const daysRemaining = Math.max(0, c.lockDays - day);
  const window = Math.min(windows, Math.floor(day / c.windowDays) + 1);

  const base = { day, window, windows, daysRemaining, lockEnded, streakTarget: STREAK_TARGET };

  if (lockEnded) {
    return {
      ...base,
      phase: "completed",
      label: "Completed",
      detail: "The lock ran to its end while the commitment was in good standing.",
      capacity: STABLE_CAPACITY,
      used: 2,
      streak: 0,
    };
  }

  if (day >= violation && day < resolved) {
    return {
      ...base,
      phase: "recoveryPending",
      label: "Recovery, awaiting your answer",
      detail:
        "The week became impossible to hit, so recovery triggered. Until you answer the prompt and choose what to pause, clean days do not start counting.",
      capacity: RECOVERY_CAPACITY,
      used: RECOVERY_CAPACITY,
      streak: 0,
    };
  }

  if (day >= resolved && day < restored) {
    const streak = Math.min(STREAK_TARGET, day - resolved + 1);
    return {
      ...base,
      phase: "recovery",
      label: `Recovery, ${streak} of ${STREAK_TARGET} clean days`,
      detail:
        "Capacity is reduced and the newest commitment is paused. Seven consecutive clean days restore it.",
      capacity: RECOVERY_CAPACITY,
      used: RECOVERY_CAPACITY,
      streak,
    };
  }

  const restoredNow = day >= restored;
  return {
    ...base,
    phase: "active",
    label: "Active",
    detail: restoredNow
      ? "Seven clean days in a row, so the system restored itself: capacity is back and the paused commitment resumed."
      : "Running normally, inside the lock.",
    capacity: STABLE_CAPACITY,
    used: 2,
    streak: 0,
  };
}

export interface Verdict {
  allowed: boolean;
  reason?: PolicyReasonCopy;
  /** The reason's message with this day's numbers filled in. */
  message?: string;
  hint?: string;
}

function reason(c: CommitmentClock, id: string): PolicyReasonCopy {
  const found = c.reasons.find((r) => r.id === id);
  if (!found) throw new Error(`commitmentClock: unknown reason ${id}`);
  return found;
}

/** Fills {n}, {s}, {date}, {a} and {b}. Pluralisation flips at exactly one. */
export function fill(template: string, s: ClockState, c: CommitmentClock): string {
  return template
    .replace(/\{n\}/g, String(s.daysRemaining))
    .replace(/\{s\}/g, s.daysRemaining === 1 ? "" : "s")
    .replace(/\{date\}/g, lockEndLabel(c))
    .replace(/\{a\}/g, String(s.used))
    .replace(/\{b\}/g, String(s.capacity));
}

export function lockEndLabel(c: CommitmentClock): string {
  const start = new Date(`${c.baseDate}T00:00:00Z`);
  const end = new Date(start.getTime() + c.lockDays * 86400000);
  return end.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function verdictFor(actionId: string, s: ClockState, c: CommitmentClock): Verdict {
  const deny = (id: string): Verdict => {
    const r = reason(c, id);
    return { allowed: false, reason: r, message: fill(r.message, s, c), hint: r.hint };
  };

  switch (actionId) {
    // The per-field split is the whole point: cosmetic edits stay open.
    case "edit-title":
      return { allowed: true };

    case "edit-frequency":
      return s.lockEnded ? { allowed: true } : deny("cannotEditFieldDuringLock");

    case "retire":
      return s.lockEnded ? { allowed: true } : deny("cannotRetireDuringLock");

    case "remove":
      // Retiring is the step that makes removal legal, and it is itself locked.
      return s.phase === "completed"
        ? { allowed: true }
        : deny("cannotRemoveUnlessCompletedOrRetired");

    case "add":
      return s.used >= s.capacity ? deny("capacityExceeded") : { allowed: true };

    case "complete":
      return s.phase === "completed" ? deny("protocolCompletedOrRetired") : { allowed: true };

    default:
      return { allowed: true };
  }
}
