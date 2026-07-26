import { useEffect, useState } from "react";
import { SCREENS } from "./screens";
import {
  S1,
  S2,
  S3,
  S4,
  clamp01,
  smooth,
  aboutRitual,
  skillsReveal,
} from "../showcase/sequence";
import { useReducedMotion } from "../motion/useReducedMotion";

/**
 * Drives the shell around the pinned Title -> Projects -> About -> Skills
 * sequence:
 * - `reveal` (0..1): the nav items fade in near the end of the title scrub.
 * - `morph` (0..1): the centered title menu travels up into the HUD bar during
 *   the camera pull-back.
 * - `active`: the current screen for the level highlight.
 *
 * The highlight is derived from the SAME scroll progress the screens animate
 * on (the S1..S4 phase boundaries), so it cannot drift out of sync with what
 * is actually on screen. An IntersectionObserver cannot do this job: inside
 * the pinned sequence, `#about` and `#skills` are one-pixel anchors, not
 * sections, so they never meaningfully intersect.
 */
export function useGameRoute() {
  const reduced = useReducedMotion();
  const [reveal, setReveal] = useState(0);
  const [morph, setMorph] = useState(0);
  const [active, setActive] = useState<string>("title");
  /**
   * True while the current screen has finished animating and is there to be
   * explored. Inside a pinned sequence scrolling produces animation rather
   * than movement, so without this the visitor cannot tell a transition from
   * a finished screen.
   */
  const [settled, setSettled] = useState(false);
  /** Nothing left below: the cue must not say "scroll for more". */
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    let raf = 0;

    /** Under reduced motion every screen is a normal section: use geometry. */
    const activeByGeometry = (vh: number) => {
      let current = SCREENS[0].id;
      for (const s of SCREENS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= vh * 0.5) current = s.id;
      }
      return current;
    };

    const compute = () => {
      const container = document.getElementById("title");
      const vh = window.innerHeight || 1;
      let r = 1;
      let m = 1;
      let p = 1;
      if (container) {
        const total = container.offsetHeight - vh;
        const top = container.getBoundingClientRect().top;
        p = total > 0 ? clamp01(-top / total) : 1;
        r = smooth(p, 0.82 * S1, S1);
        m = smooth(p, S1 + 0.02, S2);
      }
      setReveal((prev) => (Math.abs(prev - r) > 0.004 ? r : prev));
      setMorph((prev) => (Math.abs(prev - m) > 0.004 ? m : prev));

      let next: string;
      if (reduced) {
        next = activeByGeometry(vh);
      } else {
        // Same boundaries the sequence animates on.
        if (p < S1) next = "title";
        else if (p < S3) next = "projects"; // pull-back + station rest
        else if (p < S4) next = "about"; // tilt to the lap, boot, the card
        else next = "skills"; // the card lifts, the constellation reveals
        // The credits are a real section after the pinned sequence.
        const contact = document.getElementById("contact");
        if (contact && contact.getBoundingClientRect().top <= vh * 0.5) {
          next = "contact";
        }
      }
      setActive((prev) => (prev === next ? prev : next));

      // Nothing left below: the cue must not promise more scrolling.
      const docRange = document.documentElement.scrollHeight - vh;
      setAtEnd(docRange > 0 && window.scrollY >= docRange - 4);

      // ---- has the current screen finished animating? ----
      let isSettled = false;
      if (!reduced) {
        if (p >= S2 && p < S3) {
          isSettled = true; // the station holds, cartridges are clickable
        } else if (p >= S3 && p < S4) {
          // the ritual is over and the card is holding
          isSettled = aboutRitual(clamp01((p - S3) / (S4 - S3))) >= 0.99;
        } else if (p >= S4) {
          // the constellation is fully out and holding
          isSettled = skillsReveal(clamp01((p - S4) / (1 - S4))) >= 0.99;
        }
        // The credits are their own scroll; settled once the roll has finished.
        const credits = document.getElementById("contact");
        if (credits) {
          const rect = credits.getBoundingClientRect();
          if (rect.top <= 0) {
            const range = Math.max(1, credits.offsetHeight - vh);
            isSettled = clamp01(-rect.top / range) >= 0.8;
          }
        }
      }
      setSettled((prev) => (prev === isSettled ? prev : isSettled));
    };

    const onScroll = () => {
      // rAF stalls in a hidden tab; compute straight away so the HUD is never
      // left showing a stale screen (and so it stays testable headlessly).
      if (typeof document !== "undefined" && document.hidden) {
        compute();
        return;
      }
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (id && document.getElementById(id)) {
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({ block: "start" }),
      );
    }
  }, []);

  return { reveal, morph, active, settled, atEnd };
}
