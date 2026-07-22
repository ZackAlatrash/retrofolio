import { useEffect, useState, type CSSProperties } from "react";
import { useReducedMotion } from "../motion/useReducedMotion";
import { useHeroScrub, posterUrl } from "../hero/useHeroScrub";
import { DecodeText } from "../hero/DecodeText";
import { useSettings, pick } from "../game/settings";

const TAGLINE = {
  en: "Grounded AI, shipped to production.",
  nl: "Gefundeerde AI, in productie gebracht.",
};
const FOOTER = {
  en: "© 2026 · HAARLEM, NL · AVAILABLE SUMMER 2026",
  nl: "© 2026 · HAARLEM · BESCHIKBAAR VANAF ZOMER 2026",
};

function smooth(x: number, a: number, b: number) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const PIXEL = `"Press Start 2P", ui-monospace, monospace`;

export function TitleScreen() {
  const { lang } = useSettings();
  const prefersReduced = useReducedMotion();
  const forceMotion =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("motion");
  const reduced = prefersReduced && !forceMotion;
  const scrub = !reduced;

  const { containerRef, canvasRef, progress } = useHeroScrub(scrub);
  const p = reduced ? 1 : progress;

  // The opening frame is just a code vortex, so cue the scroll after a beat.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!scrub) return;
    const id = window.setTimeout(() => setArmed(true), 900);
    return () => window.clearTimeout(id);
  }, [scrub]);

  const overlay = (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 6vw",
        pointerEvents: "none",
      }}
    >
      {/* legibility scrim, rises with progress so early code stays unobstructed */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(70% 55% at 50% 46%, rgba(8,11,18,0.72), transparent 70%)",
          opacity: reduced ? 0.9 : smooth(p, 0.35, 0.62),
        }}
      />
      <div style={{ position: "relative", pointerEvents: "auto" }}>
        <h1
          style={{
            ...pixelTitle,
            opacity: reduced ? 1 : smooth(p, 0.36, 0.5),
          }}
        >
          <DecodeText
            text="ZACK ALATRASH"
            progress={p}
            start={0.4}
            end={0.62}
            reduced={reduced}
          />
        </h1>

        <p
          style={{
            ...tagline,
            opacity: reduced ? 1 : smooth(p, 0.62, 0.76),
          }}
        >
          {pick(lang, TAGLINE)}
        </p>

        <button
          onClick={() => scrollToId("projects")}
          style={{
            ...pressStart,
            marginTop: 30,
            opacity: reduced ? 1 : smooth(p, 0.86, 0.97),
          }}
          className={!reduced && p > 0.9 ? "press-blink" : undefined}
        >
          {"▸"} PRESS START
        </button>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "4vh",
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: reduced ? 0.8 : smooth(p, 0.9, 1),
        }}
        className="font-mono"
      >
        <span style={{ fontSize: 11, color: "var(--term-dim)", letterSpacing: 1 }}>
          {pick(lang, FOOTER)}
        </span>
      </div>
    </div>
  );

  if (reduced) {
    return (
      <section
        id="title"
        aria-label="Title screen"
        style={{
          position: "relative",
          minHeight: "100vh",
          backgroundImage: `url(${posterUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {overlay}
      </section>
    );
  }

  return (
    <div ref={containerRef} id="title" style={{ height: "320vh", position: "relative" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          background: "#080b12",
        }}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
        {overlay}
        {armed && (
          <div
            className="scroll-cue"
            aria-hidden="true"
            style={{ opacity: p < 0.04 ? 1 : 0 }}
          >
            <span className="cue-chev">▼</span>
            <span className="cue-txt">SCROLL TO POWER ON</span>
          </div>
        )}
      </div>
    </div>
  );
}

const pixelTitle: CSSProperties = {
  fontFamily: PIXEL,
  fontWeight: 400,
  fontSize: "clamp(20px, 5.2vw, 58px)",
  lineHeight: 1.2,
  color: "#f4f4fb",
  textShadow: "3px 3px 0 #4a2f9e",
  letterSpacing: 1,
  margin: 0,
};

const tagline: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "clamp(12px, 1.9vw, 17px)",
  color: "var(--term-green)",
  marginTop: 20,
  letterSpacing: 0.4,
};

const pressStart: CSSProperties = {
  fontFamily: PIXEL,
  fontSize: "clamp(9px, 1.4vw, 12px)",
  color: "#fff",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  marginTop: 28,
  letterSpacing: 1,
};
