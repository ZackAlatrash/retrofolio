import { useEffect, useState } from "react";
import { SCREENS } from "./screens";

function smoothstep(x: number, a: number, b: number) {
  if (b <= a) return x >= b ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/**
 * Drives the shell:
 * - `reveal` (0..1): the nav fades in near the end of the title scrub.
 * - `morph` (0..1): the centered title menu travels up into the HUD bar as the
 *   title screen exits.
 * - `active`: the current screen, for the level highlight.
 */
export function useGameRoute() {
  const [reveal, setReveal] = useState(0);
  const [morph, setMorph] = useState(0);
  const [active, setActive] = useState<string>("title");

  useEffect(() => {
    let raf = 0;
    const compute = () => {
      const title = document.getElementById("title");
      const vh = window.innerHeight || 1;
      let r = 1;
      let m = 1;
      if (title) {
        const scrubEnd = Math.max(0, title.offsetHeight - vh);
        const y = window.scrollY;
        r = scrubEnd > 0 ? smoothstep(y, scrubEnd * 0.82, scrubEnd) : 1;
        m = smoothstep(y, scrubEnd, scrubEnd + vh * 0.55);
      }
      setReveal((p) => (Math.abs(p - r) > 0.004 ? r : p));
      setMorph((p) => (Math.abs(p - m) > 0.004 ? m : p));
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

  useEffect(() => {
    const els = SCREENS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => !!el,
    );
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
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
