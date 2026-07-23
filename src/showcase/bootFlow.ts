/** The cartridge boot flow: phases + a tiny rAF tween engine. */

export type FlowPhase =
  | "shelf"
  | "inserting"
  | "splash"
  | "diving"
  | "detail"
  | "ejecting";

export interface FlowState {
  phase: FlowPhase;
  bootId: string | null;
  fast: boolean;
}

export const IDLE_FLOW: FlowState = { phase: "shelf", bootId: null, fast: false };

const easeSmooth = (k: number) => k * k * (3 - 2 * k);

/**
 * Runs `step(eased)` every frame for `dur` ms, then `done()`. Returns a cancel
 * function. All continuous motion in the boot flow goes through this so styles
 * mutate directly (no React re-render per frame).
 */
export function tween(
  dur: number,
  step: (e: number) => void,
  done?: () => void,
  ease: (k: number) => number = easeSmooth,
): () => void {
  // In a hidden tab rAF stalls; complete instantly so the flow never hangs.
  if (typeof document !== "undefined" && document.hidden) {
    step(1);
    done?.();
    return () => {};
  }
  let t0: number | null = null;
  let raf = 0;
  let cancelled = false;
  const frame = (ts: number) => {
    if (cancelled) return;
    if (t0 === null) t0 = ts;
    const k = Math.min((ts - t0) / dur, 1);
    step(ease(k));
    if (k < 1) raf = requestAnimationFrame(frame);
    else done?.();
  };
  raf = requestAnimationFrame(frame);
  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
  };
}

/** Where the cartridge lands within the console image (fractions of its box). */
export const SLOT = { cx: 0.5, top: 0.14, width: 0.4 };

/**
 * How a cartridge sits in the console, like a real top-loader: `stick` is the
 * fraction of the cart's height left visible above the slot line while seated,
 * `hover` is the gap (fraction of the cart's width) it hovers above the slot
 * before being pushed in.
 */
export const SEAT = { stick: 0.3, hover: 0.06 };

/** Spring-loaded ease for the eject pop: overshoots, then settles. */
export function easePop(k: number): number {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
}
