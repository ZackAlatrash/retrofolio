import { useEffect, useState } from "react";
import { SCREENS } from "./screens";

/**
 * Drives the shell: the HUD reveal progress (as the title screen exits, the
 * menu hands off into the global HUD), and the currently-active screen for
 * highlighting the level-select. Also honors a deep-link hash on load.
 */
export function useGameRoute() {
  const [hudProgress, setHudProgress] = useState(0);
  const [active, setActive] = useState<string>("title");

  // HUD reveal: 0 while the title screen owns the viewport, ramps to 1 as it
  // scrolls out, so the title menu appears to lift into the top bar.
  useEffect(() => {
    let raf = 0;
    const compute = () => {
      const title = document.getElementById("title");
      const vh = window.innerHeight || 1;
      let progress = 1;
      if (title) {
        const bottom = title.getBoundingClientRect().bottom;
        // bottom = vh*1.6 -> 0 (below), vh*0.4 -> 1 (title nearly gone)
        progress = Math.max(0, Math.min(1, (1.6 * vh - bottom) / (1.2 * vh)));
      }
      setHudProgress((prev) => (Math.abs(prev - progress) > 0.01 ? progress : prev));
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

  // Active screen via IntersectionObserver on each screen anchor.
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
      { threshold: [0.35, 0.6], rootMargin: "-20% 0px -40% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Deep-link: if the URL has a screen hash, jump to it once mounted.
  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (id && document.getElementById(id)) {
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({ block: "start" }),
      );
    }
  }, []);

  return { hudProgress, active };
}
