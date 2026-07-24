import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../motion/useReducedMotion";
import { AboutBackground } from "./AboutBackground";
import { AboutCard } from "./AboutCard";

const PIXEL = '"Press Start 2P", ui-monospace, monospace';

type BgMode = "room" | "grid";
const INITIAL_BG: BgMode =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("aboutbg") === "grid"
    ? "grid"
    : "room";

/**
 * Screen 2 - PLAYER 01 (About) as a standalone page section. Superseded by the
 * world camera move (the card resolves inside the handheld) once that lands;
 * kept for now as the reduced-motion / fallback presentation of the same card.
 */
export function AboutScreen() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(reduced);
  const [play, setPlay] = useState(reduced);
  const [bg, setBg] = useState<BgMode>(INITIAL_BG);

  // Reveal on scroll into view (once).
  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          setPlay(true);
          io.disconnect();
        }
      },
      { rootMargin: "-100px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  // Subtle pointer parallax on the background (via --apx/--apy on the section).
  const onParallax = (e: React.MouseEvent) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--apx", String((e.clientX - r.left) / r.width - 0.5));
    el.style.setProperty("--apy", String((e.clientY - r.top) / r.height - 0.5));
  };

  return (
    <section
      id="about"
      aria-label="About"
      ref={ref}
      onMouseMove={onParallax}
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "84px 20px 56px",
        scrollMarginTop: 52,
        background: "#05070c",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <AboutBackground mode={bg} />

      {/* temporary compare toggle */}
      <div style={{ position: "absolute", top: 88, right: 22, zIndex: 6, display: "flex", gap: 6 }}>
        {(["room", "grid"] as BgMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setBg(m)}
            style={{
              fontFamily: PIXEL,
              fontSize: 8,
              padding: "6px 9px",
              borderRadius: 6,
              cursor: "pointer",
              color: bg === m ? "#0a0d18" : "#8fb6ff",
              background: bg === m ? "#8fb6ff" : "rgba(10,14,26,0.7)",
              border: "1px solid rgba(122,162,247,0.4)",
            }}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ width: "min(1060px, 100%)", position: "relative", zIndex: 1 }}>
        {/* level strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
            opacity: reduced || visible ? 1 : 0,
            transition: "opacity 0.5s var(--ease-out)",
          }}
        >
          <div className="font-mono" style={{ fontSize: 11, letterSpacing: 2, color: "var(--term-green)" }}>
            {"// PLAYER 01 · ABOUT"}
          </div>
          <div
            style={{
              fontFamily: PIXEL,
              fontSize: 9,
              color: "#8fb6ff",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--term-green)",
                boxShadow: "0 0 8px var(--term-green)",
                display: "inline-block",
              }}
            />
            AVAILABLE FROM SUMMER 2026
          </div>
        </div>

        <AboutCard visible={visible} play={play} />
      </div>
    </section>
  );
}
