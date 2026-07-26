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
export const PULL_VH = 130;
export const REST_VH = 70;
/**
 * about: the view tilts down to the player's lap, where the handheld is held
 * in both hands; it boots up, the camera pushes into its screen, and the
 * character card resolves over a faint night sky. Then it HOLDS: a screen that
 * never rests cannot be read, and gives the visitor no "this is finished" beat
 * to stop on.
 */
export const ABOUT_RITUAL_VH = 340;
export const ABOUT_HOLD_VH = 95;
export const ABOUT_VH = ABOUT_RITUAL_VH + ABOUT_HOLD_VH;
/**
 * skills: the card lifts away and the stars behind it shine, revealing that
 * the sky was the skill constellation all along, then holds so it can actually
 * be explored.
 */
export const SKILLS_REVEAL_VH = 230;
export const SKILLS_HOLD_VH = 85;
export const SKILLS_VH = SKILLS_REVEAL_VH + SKILLS_HOLD_VH;

export const SCROLLABLE_VH = SCRUB_VH + PULL_VH + REST_VH + ABOUT_VH + SKILLS_VH;
/** Total container height (sticky viewport included). */
export const CONTAINER_VH = SCROLLABLE_VH + 100;

/** Fraction of scrollable progress where the scrub ends / pull begins. */
export const S1 = SCRUB_VH / SCROLLABLE_VH;
/** Fraction where the pull-back completes. */
export const S2 = (SCRUB_VH + PULL_VH) / SCROLLABLE_VH;
/** Fraction where the station rest ends and the About camera begins. */
export const S3 = (SCRUB_VH + PULL_VH + REST_VH) / SCROLLABLE_VH;
/** Fraction where About ends and the constellation reveal begins. */
export const S4 = (SCRUB_VH + PULL_VH + REST_VH + ABOUT_VH) / SCROLLABLE_VH;

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/**
 * Rescale a phase's progress so its animation plays out over exactly the same
 * scroll distance as before and then sits at 1 for the hold. Pacing per pixel
 * scrolled is unchanged; the hold is pure extra room.
 */
export const aboutRitual = (aboutP: number) =>
  clamp01(aboutP * (ABOUT_VH / ABOUT_RITUAL_VH));
export const skillsReveal = (skillsP: number) =>
  clamp01(skillsP * (SKILLS_VH / SKILLS_REVEAL_VH));
export const smooth = (x: number, a: number, b: number) => {
  if (b <= a) return x >= b ? 1 : 0;
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
