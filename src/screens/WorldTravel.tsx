import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../motion/useReducedMotion";
import { roomUrl } from "../showcase/showcaseData";

/**
 * PLACEHOLDER PROTOTYPE (?demo=world) for the "camera focuses, moves DOWN, then
 * focuses into an object that holds the card" direction. Vertical scroll drives
 * the camera: framed on the TV -> pans down through the room to a device on the
 * table -> zooms into the device screen until the card fills the viewport (the
 * same measured-rect zoom as the cartridge dive). Real object art + real card
 * replace the placeholder later; this exists to judge the feel.
 * Force a frame with ?wp=<0..1>.
 */

const PIXEL = '"Press Start 2P", ui-monospace, monospace';
const smooth = (k: number) => k * k * (3 - 2 * k);
const clamp01 = (k: number) => Math.min(1, Math.max(0, k));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// Focus points in room fractions: the TV, then the device on the table.
const TV = { fx: 0.5, fy: 0.42 };
const DEVICE = { fx: 0.5, fy: 0.8 };

function frame(p: number) {
  if (p < 0.5) {
    const t = smooth(p / 0.5); // pan down from TV to the device
    return { fx: lerp(TV.fx, DEVICE.fx, t), fy: lerp(TV.fy, DEVICE.fy, t), sc: 1.5 };
  }
  const t = smooth((p - 0.5) / 0.5); // zoom into the device screen
  return { fx: DEVICE.fx, fy: DEVICE.fy, sc: lerp(1.5, 4.8, t) };
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
        <section style={{ minHeight: "100vh", position: "relative" }}>
          <img src={roomUrl} alt="" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.7)" }} />
        </section>
        <PlaceholderCard reduced />
      </div>
    );
  }

  const { fx, fy, sc } = frame(p);
  const tx = (0.5 - fx) * sc * 100;
  const ty = (0.5 - fy) * sc * 100;
  const cardOpacity = smooth(clamp01((p - 0.74) / 0.26));

  return (
    <div ref={containerRef} id="world" style={{ height: "320vh", position: "relative", background: "#05070c" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        {/* the room + device, moved as one by the camera transform */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translate(${tx}vw, ${ty}vh) scale(${sc})`,
            transformOrigin: "center",
            willChange: "transform",
          }}
        >
          <img src={roomUrl} alt="" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.72)" }} />
          {/* placeholder device on the table (whatever holds the card) */}
          <div
            style={{
              position: "absolute",
              left: `${DEVICE.fx * 100}%`,
              top: `${DEVICE.fy * 100}%`,
              transform: "translate(-50%,-50%)",
              width: "21%",
              aspectRatio: "4 / 3",
              borderRadius: "6px",
              background: "linear-gradient(180deg, #3a4160 0%, #232841 100%)",
              border: "2px solid #12151f",
              boxShadow: "0 6px 14px rgba(0,0,0,0.6)",
              padding: "4.5%",
            }}
          >
            <div style={{ width: "100%", height: "100%", borderRadius: 3, background: "radial-gradient(90% 80% at 50% 40%, #16305a, #0a1024)", border: "1px solid #0a0d16", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: PIXEL, fontSize: "0.5vw", color: "#8fb6ff", opacity: cardOpacity < 0.4 ? 1 : 0 }}>PLAYER 01</span>
            </div>
          </div>
        </div>

        {/* the card, resolving as the camera enters the device screen */}
        <div style={{ position: "absolute", inset: 0, opacity: cardOpacity, pointerEvents: cardOpacity > 0.5 ? "auto" : "none" }}>
          <PlaceholderCard />
        </div>

        {/* foreground dust (only while travelling, fades as the card resolves) */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 1 - cardOpacity }}>
          {DUST.map((d, i) => (
            <span key={i} className="dust" style={{ left: d.left, top: d.top, animationDelay: d.delay, animationDuration: d.dur, width: d.size, height: d.size }} />
          ))}
        </div>

        {/* CRT dressing */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "repeating-linear-gradient(rgba(0,0,0,0.16) 0 1px, transparent 1px 3px)", mixBlendMode: "multiply" }} />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(125% 95% at 50% 46%, transparent 58%, rgba(0,0,0,0.6) 100%)" }} />

        <div style={{ position: "absolute", top: 20, left: 0, right: 0, textAlign: "center", fontFamily: PIXEL, fontSize: 9, color: "#8fb6ff", opacity: 1 - cardOpacity }}>
          SCROLL DOWN ↓
        </div>
      </div>
    </div>
  );
}

function PlaceholderCard({ reduced }: { reduced?: boolean }) {
  return (
    <div
      style={{
        position: reduced ? "relative" : "absolute",
        inset: reduced ? undefined : 0,
        minHeight: reduced ? "100vh" : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(120% 90% at 50% 30%, #12162a, #05070c)",
      }}
    >
      <div
        style={{
          width: "min(560px, 82vw)",
          aspectRatio: "16 / 10",
          borderRadius: 14,
          border: "2px solid rgba(122,162,247,0.4)",
          background: "linear-gradient(180deg, rgba(20,26,48,0.92), rgba(11,15,28,0.94))",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 50px rgba(122,162,247,0.18)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <div className="font-mono" style={{ color: "#8fb6ff", fontSize: 12, letterSpacing: 2 }}>{"// PLAYER 01"}</div>
        <div style={{ fontFamily: PIXEL, fontSize: "clamp(16px,2.4vw,26px)", color: "#f4f4fb", textShadow: "2px 2px 0 #4a2f9e" }}>ABOUT</div>
        <div className="font-mono" style={{ color: "#8a93bd", fontSize: 11 }}>your real character card lands here</div>
      </div>
    </div>
  );
}
