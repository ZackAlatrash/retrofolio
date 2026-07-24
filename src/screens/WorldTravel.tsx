import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../motion/useReducedMotion";
import { HANDHELD_SCREEN, handheldUrl, roomUrl } from "../showcase/showcaseData";
import { AboutCard } from "./AboutCard";

/**
 * The About beat as a camera move through the room (?demo=world): scroll takes
 * the camera from the TV, DOWN to the handheld sitting on the table, then INTO
 * its screen until the character card resolves. Same measured-rect zoom idea as
 * the cartridge dive. Reduced motion falls back to the room plus the card.
 * Force a frame with ?wp=<0..1>.
 */

const PIXEL = '"Press Start 2P", ui-monospace, monospace';
const smooth = (k: number) => k * k * (3 - 2 * k);
const clamp01 = (k: number) => Math.min(1, Math.max(0, k));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Handheld width as a fraction of the room, and where it sits. */
const DEVICE_W = 0.17;
const DEVICE = { fx: 0.5, fy: 0.76 };
/** The screen centre sits a touch above the device centre. */
const SCREEN_FY = 0.752;
/** Zoom that makes the screen fill the viewport width. */
const SC_END = 1 / (DEVICE_W * (HANDHELD_SCREEN.width / 100));

const PHASE = 0.55; // scroll split: descend, then dive

function frame(p: number) {
  if (p < PHASE) {
    const t = smooth(p / PHASE); // descend from the TV to the handheld
    return { fx: 0.5, fy: lerp(0.42, SCREEN_FY, t), sc: lerp(1.5, 2.6, t) };
  }
  const t = smooth((p - PHASE) / (1 - PHASE)); // dive into the screen
  return { fx: 0.5, fy: SCREEN_FY, sc: lerp(2.6, SC_END, t) };
}

const DUST = Array.from({ length: 8 }, (_, i) => ({
  left: `${(i * 41) % 100}%`,
  top: `${(i * 57) % 90}%`,
  delay: `${(i * 1.6) % 8}s`,
  dur: `${11 + (i % 5)}s`,
  size: 2 + (i % 2),
}));

export function WorldTravel() {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const forced = params.get("wp");
  const [p, setP] = useState(forced != null ? parseFloat(forced) : 0);

  useEffect(() => {
    if (reduced || forced != null) return;
    const el = containerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const total = el.offsetHeight - window.innerHeight;
        const top = el.getBoundingClientRect().top;
        setP(total > 0 ? clamp01(-top / total) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced, forced]);

  if (reduced) {
    return (
      <div style={{ background: "#05070c" }}>
        <section style={{ minHeight: "60vh", position: "relative" }}>
          <img
            src={roomUrl}
            alt=""
            aria-hidden="true"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.7)" }}
          />
        </section>
        <div style={{ padding: "56px 20px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: "min(1060px, 100%)" }}>
            <AboutCard />
          </div>
        </div>
      </div>
    );
  }

  const { fx, fy, sc } = frame(p);
  const tx = (0.5 - fx) * sc * 100;
  const ty = (0.5 - fy) * sc * 100;
  const cardOpacity = smooth(clamp01((p - 0.72) / 0.24));
  const glow = smooth(clamp01((p - 0.2) / 0.4));
  const travelUi = 1 - cardOpacity;

  return (
    <div ref={containerRef} id="world" style={{ height: "360vh", position: "relative", background: "#05070c" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        {/* the room + the handheld, moved as one by the camera */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translate(${tx}vw, ${ty}vh) scale(${sc})`,
            transformOrigin: "center",
            willChange: "transform",
          }}
        >
          <img
            src={roomUrl}
            alt=""
            aria-hidden="true"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.7)" }}
          />

          {/* the handheld on the table */}
          <div
            style={{
              position: "absolute",
              left: `${DEVICE.fx * 100}%`,
              top: `${DEVICE.fy * 100}%`,
              width: `${DEVICE_W * 100}%`,
              transform: "translate(-50%,-50%)",
            }}
          >
            {/* contact shadow so it sits on the surface */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "6%",
                right: "6%",
                bottom: "-4%",
                height: "12%",
                borderRadius: "50%",
                background: "radial-gradient(50% 50% at 50% 50%, rgba(0,0,0,0.6), transparent 75%)",
                filter: "blur(2px)",
              }}
            />
            <img
              src={handheldUrl}
              alt=""
              aria-hidden="true"
              style={{ width: "100%", display: "block", imageRendering: "pixelated" }}
            />
            {/* the blank screen, lit up */}
            <div
              style={{
                position: "absolute",
                left: `${HANDHELD_SCREEN.left}%`,
                top: `${HANDHELD_SCREEN.top}%`,
                width: `${HANDHELD_SCREEN.width}%`,
                height: `${HANDHELD_SCREEN.height}%`,
                overflow: "hidden",
                background: `radial-gradient(90% 80% at 50% 40%, rgba(30,64,110,${0.35 + 0.5 * glow}), rgba(8,14,28,0.95))`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                className="press-blink"
                style={{
                  fontFamily: PIXEL,
                  fontSize: "0.7vw",
                  color: "#8fb6ff",
                  opacity: glow * travelUi,
                  textShadow: "0 0 6px rgba(143,182,255,0.8)",
                }}
              >
                PLAYER 01
              </span>
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "repeating-linear-gradient(rgba(0,0,0,0.22) 0 1px, transparent 1px 2px)",
                }}
              />
            </div>
            {/* screen bloom spilling onto the case */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: "-8%",
                pointerEvents: "none",
                background: "radial-gradient(42% 38% at 50% 45%, rgba(122,162,247,0.35), transparent 70%)",
                opacity: glow,
              }}
            />
          </div>
        </div>

        {/* the card, resolving as the camera enters the screen */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: cardOpacity,
            pointerEvents: cardOpacity > 0.5 ? "auto" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "72px 20px 56px",
            background: "radial-gradient(120% 90% at 50% 35%, #101733 0%, #070a16 60%, #05070c 100%)",
            overflowY: cardOpacity > 0.5 ? "auto" : "hidden",
          }}
        >
          <div style={{ width: "min(1060px, 100%)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div className="font-mono" style={{ fontSize: 11, letterSpacing: 2, color: "var(--term-green)" }}>
                {"// PLAYER 01 · ABOUT"}
              </div>
              <div style={{ fontFamily: PIXEL, fontSize: 9, color: "#8fb6ff", display: "flex", alignItems: "center", gap: 8 }}>
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
            <AboutCard visible={cardOpacity > 0.35} play={cardOpacity > 0.35} />
          </div>
        </div>

        {/* we are still inside the little screen: keep its glow at the edges */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: cardOpacity,
            background: "radial-gradient(120% 95% at 50% 45%, transparent 55%, rgba(20,44,90,0.5) 100%)",
          }}
        />

        {/* foreground dust while travelling */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: travelUi }}>
          {DUST.map((d, i) => (
            <span
              key={i}
              className="dust"
              style={{ left: d.left, top: d.top, animationDelay: d.delay, animationDuration: d.dur, width: d.size, height: d.size }}
            />
          ))}
        </div>

        {/* CRT dressing */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: "repeating-linear-gradient(rgba(0,0,0,0.16) 0 1px, transparent 1px 3px)",
            mixBlendMode: "multiply",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: "radial-gradient(125% 95% at 50% 46%, transparent 58%, rgba(0,0,0,0.6) 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 20,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: PIXEL,
            fontSize: 9,
            color: "#8fb6ff",
            opacity: travelUi,
          }}
        >
          SCROLL DOWN ↓
        </div>
      </div>
    </div>
  );
}
