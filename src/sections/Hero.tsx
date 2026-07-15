import { useEffect, useRef, useState } from "react";
import { profile } from "../content/profile";
import { useReducedMotion } from "../motion/useReducedMotion";
import { isBrowser } from "../motion/gsap";

/** Types `text` out one character at a time; instant under reduced motion. */
function useTypewriter(text: string, enabled: boolean, speed = 95): string {
  const [out, setOut] = useState(() => (enabled ? "" : text));
  useEffect(() => {
    if (!enabled) {
      setOut(text);
      return;
    }
    setOut("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, enabled, speed]);
  return out;
}

/**
 * A restrained embedding-field: slow-drifting points with faint links between
 * near neighbours (§7). Paused (drawn once) under reduced motion, and a no-op
 * where 2D canvas is unavailable (jsdom). Purely decorative, aria-hidden.
 */
function HeroBackground({ reduced }: { reduced: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Skip entirely outside a real browser (jsdom has no 2D canvas).
    if (!isBrowser) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const root = getComputedStyle(document.documentElement);
    const accent = root.getPropertyValue("--term-accent").trim() || "#7aa2f7";
    const cite = root.getPropertyValue("--term-cite").trim() || "#bb9af7";

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    const COUNT = 44;
    const points = Array.from({ length: COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00028,
      vy: (Math.random() - 0.5) * 0.00028,
      c: Math.random() > 0.72 ? cite : accent,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      // faint links first
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const a = points[i];
          const b = points[j];
          const dx = (a.x - b.x) * width;
          const dy = (a.y - b.y) * height;
          const dist = Math.hypot(dx, dy);
          if (dist < 130) {
            ctx.strokeStyle = accent;
            ctx.globalAlpha = 0.06 * (1 - dist / 130);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x * width, a.y * height);
            ctx.lineTo(b.x * width, b.y * height);
            ctx.stroke();
          }
        }
      }
      // points
      for (const p of points) {
        ctx.fillStyle = p.c;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    resize();

    if (reduced) {
      draw();
      window.addEventListener("resize", resize);
      return () => window.removeEventListener("resize", resize);
    }

    let raf = 0;
    const tick = () => {
      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
      }
      draw();
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        // gentle vignette so the field never competes with the text
        maskImage:
          "radial-gradient(120% 90% at 50% 40%, #000 30%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(120% 90% at 50% 40%, #000 30%, transparent 100%)",
        opacity: 0.9,
      }}
    />
  );
}

export function Hero({ id = "hero" }: { id?: string }) {
  const reduced = useReducedMotion();
  const typed = useTypewriter("whoami", !reduced);
  const showCaret = typed.length < "whoami".length || reduced;

  return (
    <section
      id={id}
      aria-label="Introduction"
      style={{
        position: "relative",
        minHeight: "92vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        borderBottom: "1px solid color-mix(in srgb, var(--term-dim) 40%, transparent)",
      }}
    >
      <HeroBackground reduced={reduced} />

      <div
        style={{
          position: "relative",
          maxWidth: 900,
          width: "100%",
          margin: "0 auto",
          padding: "96px 24px 72px",
        }}
      >
        <div
          className="font-mono"
          style={{
            fontSize: 14,
            color: "var(--term-green)",
            marginBottom: 20,
            letterSpacing: 0.2,
          }}
        >
          <span style={{ color: "var(--term-dim)" }}>~/portfolio</span>{" "}
          <span style={{ color: "var(--term-green)" }}>$</span>{" "}
          <span style={{ color: "var(--term-fg)" }}>{typed}</span>
          <span
            aria-hidden="true"
            className={reduced ? undefined : "hero-caret"}
            style={{
              display: "inline-block",
              width: 9,
              height: 17,
              marginLeft: 2,
              transform: "translateY(3px)",
              background: "var(--term-green)",
              opacity: showCaret ? 1 : 0,
            }}
          />
        </div>

        <h1
          style={{
            fontSize: "clamp(34px, 6vw, 58px)",
            lineHeight: 1.05,
            margin: "0 0 6px",
            fontWeight: 600,
            letterSpacing: -0.5,
            color: "var(--term-fg)",
          }}
        >
          {profile.name}{" "}
          <span
            className="font-mono"
            style={{ color: "var(--term-dim)", fontSize: "0.4em", fontWeight: 400 }}
          >
            ({profile.goesBy})
          </span>
        </h1>

        <p
          style={{
            fontSize: "clamp(17px, 2.4vw, 22px)",
            lineHeight: 1.5,
            maxWidth: 620,
            margin: "18px 0 0",
            color: "var(--term-fg)",
          }}
        >
          {profile.positioning}
        </p>

        <div
          className="font-mono"
          style={{
            fontSize: 13,
            color: "var(--term-dim)",
            marginTop: 16,
            display: "flex",
            flexWrap: "wrap",
            gap: "6px 16px",
          }}
        >
          <span>{profile.location}</span>
          <span aria-hidden="true">·</span>
          <span>{profile.seeking}</span>
        </div>

        {/* Docked ask affordance: opens the grounded chatbot. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 40,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            aria-label="Ask about my work"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("zk:ask", { detail: {} }))
            }
            className="hero-ask"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 300,
              padding: "12px 14px",
              borderRadius: 12,
              cursor: "pointer",
              textAlign: "left",
              background: "color-mix(in srgb, var(--term-fg) 5%, var(--term-bg))",
              border: "1px solid var(--term-dim)",
              color: "var(--term-dim)",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            <span
              className="font-mono"
              style={{ color: "var(--term-green)", fontSize: 14 }}
            >
              ask
            </span>
            <span style={{ fontSize: 14, flex: 1 }}>
              anything about these projects
            </span>
            <span
              className="font-mono"
              aria-hidden="true"
              style={{ color: "var(--term-accent)", fontSize: 15 }}
            >
              ▸
            </span>
          </button>

          <button
            type="button"
            aria-label="Open the command palette"
            onClick={() => window.dispatchEvent(new CustomEvent("zk:palette"))}
            className="font-mono"
            style={{
              fontSize: 12.5,
              color: "var(--term-dim)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            or press
            <kbd
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                padding: "2px 7px",
                borderRadius: 6,
                border: "1px solid var(--term-dim)",
                color: "var(--term-fg)",
                background: "color-mix(in srgb, var(--term-fg) 6%, transparent)",
              }}
            >
              ⌘K
            </kbd>
          </button>
        </div>
      </div>

      {!reduced && (
        <style>{`
          @keyframes heroCaretBlink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
          .hero-caret { animation: heroCaretBlink 1.05s steps(1) infinite; }
          .hero-ask:hover, .hero-ask:focus-visible {
            border-color: var(--term-accent);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--term-accent) 16%, transparent);
            outline: none;
          }
        `}</style>
      )}
    </section>
  );
}
