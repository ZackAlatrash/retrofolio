import { useEffect, useState } from "react";
import { SCREENS } from "./screens";
import { S1, S2, clamp01, smooth } from "../showcase/sequence";

/**
 * Drives the shell around the fused Title/Library sequence:
 * - `reveal` (0..1): the nav items fade in near the end of the title scrub.
 * - `morph` (0..1): the centered title menu travels up into the HUD bar during
 *   the camera pull-back.
 * - `active`: current screen for the level highlight ('title' / 'projects'
 *   derive from sequence progress; later screens via IntersectionObserver).
 */
export function useGameRoute() {
  const [reveal, setReveal] = useState(0);
  const [morph, setMorph] = useState(0);
  const [active, setActive] = useState<string>("title");
  const [, setIoActive] = useState<string | null>(null);

  useEffect(() => {
    let raf = 0;
    const compute = () => {
      const container = document.getElementById("title");
      const vh = window.innerHeight || 1;
      let r = 1;
      let m = 1;
      let inSequence = false;
      let p = 1;
      if (container) {
        const total = container.offsetHeight - vh;
        const top = container.getBoundingClientRect().top;
        p = total > 0 ? clamp01(-top / total) : 1;
        inSequence = top > -(container.offsetHeight - vh * 1.2);
        r = smooth(p, 0.82 * S1, S1);
        m = smooth(p, S1 + 0.02, S2);
      }
      setReveal((prev) => (Math.abs(prev - r) > 0.004 ? r : prev));
      setMorph((prev) => (Math.abs(prev - m) > 0.004 ? m : prev));
      if (inSequence) {
        setActive(p < S1 * 0.97 ? "title" : "projects");
      } else {
        setIoActive((cur) => {
          if (cur) setActive(cur);
          return cur;
        });
      }
    };
    const onScroll = () => {
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
  }, []);

  // IntersectionObserver for the in-flow screens after the fused sequence.
  useEffect(() => {
    const els = SCREENS.filter((s) => s.id !== "title" && s.id !== "projects")
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setIoActive(visible.target.id);
          setActive(visible.target.id);
        }
      },
      { threshold: [0.35, 0.6], rootMargin: "-15% 0px -40% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (id && document.getElementById(id)) {
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({ block: "start" }),
      );
    }
  }, []);

  return { reveal, morph, active };
}
