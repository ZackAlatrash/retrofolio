/**
 * The fused Title -> Game Library scroll sequence, in viewport-height units.
 * One pinned container drives three phases:
 *   scrub: the hero video frames (code vortex -> title screen)
 *   pull:  the camera pull-back (TV shrinks/rises, station revealed, channel
 *          flickers from the title to the selected project)
 *   rest:  the station holds full-frame so the shelf is comfortably usable
 *          before the section unpins and scrolls away.
 */
export const SCRUB_VH = 220;
export const PULL_VH = 90;
export const REST_VH = 70;

export const SCROLLABLE_VH = SCRUB_VH + PULL_VH + REST_VH;
/** Total container height (sticky viewport included). */
export const CONTAINER_VH = SCROLLABLE_VH + 100;

/** Fraction of scrollable progress where the scrub ends / pull begins. */
export const S1 = SCRUB_VH / SCROLLABLE_VH;
/** Fraction where the pull-back completes. */
export const S2 = (SCRUB_VH + PULL_VH) / SCROLLABLE_VH;

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number, a: number, b: number) => {
  if (b <= a) return x >= b ? 1 : 0;
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
