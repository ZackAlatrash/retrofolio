import { useEffect, useRef, useState } from "react";
import { useLayoutProfile } from "../game/useLayoutProfile";
import { useReducedMotion } from "../motion/useReducedMotion";

/**
 * The About portrait: a real photo at rest, with a pixelation "lens" that
 * follows the cursor and turns whatever it is over into 8-bit. The pixelation
 * is computed live from the photo (a cached blocky bitmap masked to a soft
 * circle under the pointer), so the only asset needed is the photo itself.
 *
 * A one-time sweep on scroll-in reveals the effect (and covers touch, where
 * there is no hover). Reduced motion shows the crisp photo with no lens.
 */

const PIXEL = '"Press Start 2P", ui-monospace, monospace';
const BLOCK_CSS = 11; // approx css px per pixel block
const LENS_FRAC = 0.34; // lens radius as a fraction of the smaller frame side

export function PixelPortrait({ src, alt }: { src: string; alt: string }) {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { hoverless } = useLayoutProfile();
  const [hinted, setHinted] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pix = document.createElement("canvas");
    const pctx = pix.getContext("2d")!;
    const small = document.createElement("canvas");
    const sctx = small.getContext("2d")!;

    let w = 0, h = 0, dpr = 1, lensR = 0, ready = false;
    let targetX = 0, targetY = 0, lensX = 0, lensY = 0, opacity = 0, tOpacity = 0;
    let hovering = false, sweepStart: number | null = null, raf = 0, running = false;
    let firstMove = true;

    const cover = (iw: number, ih: number, cw: number, ch: number) => {
      const s = Math.max(cw / iw, ch / ih);
      const dw = iw * s, dh = ih * s;
      return [(cw - dw) / 2, (ch - dh) / 2, dw, dh] as const;
    };

    const img = new Image();
    img.decoding = "async";

    const build = () => {
      const r = wrap.getBoundingClientRect();
      if (!r.width || !img.naturalWidth) return;
      w = r.width; h = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      lensR = Math.min(w, h) * LENS_FRAC;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      const cols = Math.max(1, Math.round(w / BLOCK_CSS));
      const rows = Math.max(1, Math.round(h / BLOCK_CSS));
      small.width = cols; small.height = rows;
      sctx.imageSmoothingEnabled = false;
      sctx.clearRect(0, 0, cols, rows);
      const [dx, dy, dw, dh] = cover(img.naturalWidth, img.naturalHeight, cols, rows);
      sctx.drawImage(img, dx, dy, dw, dh);
      pix.width = canvas.width; pix.height = canvas.height;
      pctx.imageSmoothingEnabled = false;
      pctx.clearRect(0, 0, pix.width, pix.height);
      pctx.drawImage(small, 0, 0, pix.width, pix.height);
      ready = true;
    };

    const render = () => {
      if (!ready) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (opacity <= 0.01) return;
      ctx.globalAlpha = opacity;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(pix, 0, 0);
      ctx.globalCompositeOperation = "destination-in";
      ctx.globalAlpha = 1;
      const cx = lensX * dpr, cy = lensY * dpr, r = lensR * dpr;
      const g = ctx.createRadialGradient(cx, cy, r * 0.15, cx, cy, r);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(0.7, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
    };

    const loop = (ts: number) => {
      if (sweepStart !== null) {
        const p = Math.min((ts - sweepStart) / 1300, 1);
        targetX = w * (0.14 + 0.72 * p);
        targetY = h * 0.42;
        tOpacity = p < 0.85 ? 1 : 1 - (p - 0.85) / 0.15;
        if (p >= 1) { sweepStart = null; tOpacity = hovering ? 1 : 0; }
      }
      lensX += (targetX - lensX) * 0.3;
      lensY += (targetY - lensY) * 0.3;
      opacity += (tOpacity - opacity) * 0.18;
      render();
      if (hovering || sweepStart !== null || opacity > 0.01) {
        raf = requestAnimationFrame(loop);
      } else {
        running = false;
      }
    };
    const ensure = () => {
      if (!running) { running = true; raf = requestAnimationFrame(loop); }
    };

    const setTarget = (clientX: number, clientY: number) => {
      const r = wrap.getBoundingClientRect();
      targetX = clientX - r.left;
      targetY = clientY - r.top;
    };
    const onMove = (e: PointerEvent) => {
      hovering = true;
      tOpacity = 1;
      sweepStart = null;
      setTarget(e.clientX, e.clientY);
      if (firstMove) { firstMove = false; setHinted(true); }
      ensure();
    };
    const onLeave = () => { hovering = false; tOpacity = 0; ensure(); };

    img.onload = () => {
      build();
      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            sweepStart = performance.now();
            setHinted(true);
            ensure();
            io.disconnect();
          }
        },
        { rootMargin: "-80px" },
      );
      io.observe(wrap);
    };
    img.src = src;

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerdown", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    wrap.addEventListener("pointerup", onLeave);
    wrap.addEventListener("pointercancel", onLeave);
    window.addEventListener("resize", build);
    return () => {
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerdown", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      wrap.removeEventListener("pointerup", onLeave);
      wrap.removeEventListener("pointercancel", onLeave);
      window.removeEventListener("resize", build);
      cancelAnimationFrame(raf);
    };
  }, [reduced, src]);

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        aspectRatio: "1 / 1",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid rgba(122,162,247,0.3)",
        background: "#0c1020",
        touchAction: "pan-y",
        cursor: reduced ? "default" : "crosshair",
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      {!reduced && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        />
      )}
      {/* scanlines */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "repeating-linear-gradient(rgba(0,0,0,0.16) 0 1px, transparent 1px 3px)",
          pointerEvents: "none",
        }}
      />
      {/* placeholder marker + affordance */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 10,
          bottom: 8,
          fontFamily: PIXEL,
          fontSize: 7,
          color: "#6b76a4",
          pointerEvents: "none",
        }}
      >
        ⌗ PLACEHOLDER PHOTO
      </div>
      {!reduced && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: 10,
            bottom: 8,
            fontFamily: PIXEL,
            fontSize: 7,
            color: "#8fb6ff",
            opacity: hinted ? 0 : 0.9,
            transition: "opacity 0.4s ease",
            pointerEvents: "none",
          }}
        >
          {/* The effect runs off pointermove, which a finger produces too, so
              only the word is wrong on touch. */}
          {hoverless ? "◨ DRAG" : "◨ HOVER"}
        </div>
      )}
    </div>
  );
}
