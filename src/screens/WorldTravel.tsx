import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../motion/useReducedMotion";
import { roomUrl } from "../showcase/showcaseData";

/**
 * PLACEHOLDER PROTOTYPE (?demo=world) for the "camera travels one world"
 * direction. Vertical scroll drives a horizontal camera pan across a wide room,
 * with parallax depth, settling on each station. Real art + real section
 * content replace the placeholder panels later; this exists to judge the feel.
 * Force a pan frame with ?wp=<0..1>.
 */

const PIXEL = '"Press Start 2P", ui-monospace, monospace';

const STATIONS = [
  { key: "projects", tag: "// STAGE 02", title: "GAME LIBRARY", tint: "#7aa2f7" },
  { key: "about", tag: "// PLAYER 01", title: "ABOUT", tint: "#8fb6ff" },
  { key: "skills", tag: "// STAGE 03", title: "SKILL TREE", tint: "#9ece6a" },
  { key: "contact", tag: "// CREDITS", title: "CONTACT", tint: "#bb9af7" },
];

const DUST = Array.from({ length: 10 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${(i * 53) % 90}%`,
  delay: `${(i * 1.3) % 8}s`,
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
        setP(total > 0 ? Math.min(1, Math.max(0, -top / total)) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced, forced]);

  const N = STATIONS.length;
  // Camera pans across (N-1) screen-widths; layers move at different rates.
  const pan = p * (N - 1); // 0 .. N-1 (in screen widths)
  const layer = (rate: number) => `translateX(${-pan * rate * 100}vw)`;
  const activeIdx = Math.round(pan);

  if (reduced) {
    return (
      <div style={{ background: "#05070c" }}>
        {STATIONS.map((s) => (
          <section
            key={s.key}
            style={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              borderTop: "1px solid rgba(122,162,247,0.2)",
            }}
          >
            <div className="font-mono" style={{ color: s.tint, fontSize: 12, letterSpacing: 2 }}>{s.tag}</div>
            <div style={{ fontFamily: PIXEL, fontSize: 22, color: "#f4f4fb" }}>{s.title}</div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} id="world" style={{ height: `${N * 100}vh`, position: "relative", background: "#05070c" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        {/* far parallax: night sky + horizon glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: `${N * 100}vw`,
            transform: layer(0.35),
            background: "radial-gradient(120% 90% at 20% 10%, #171a3a 0%, #0a0d1c 55%, #05070c 100%)",
          }}
        />

        {/* mid parallax: the room + station zones */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${N * 100}vw`,
            display: "flex",
            transform: layer(1),
          }}
        >
          {STATIONS.map((s, i) => (
            <div key={s.key} style={{ width: "100vw", height: "100%", position: "relative", overflow: "hidden" }}>
              {i === 0 ? (
                <img
                  src={roomUrl}
                  alt=""
                  aria-hidden="true"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.75)" }}
                />
              ) : (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(80% 70% at 50% 45%, ${s.tint}22, transparent 70%)`,
                  }}
                />
              )}
              {/* placeholder "object" the section content will anchor to */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%,-50%)",
                  width: "min(520px, 74vw)",
                  aspectRatio: "16/10",
                  borderRadius: 14,
                  border: `2px solid ${s.tint}66`,
                  background: "linear-gradient(180deg, rgba(20,26,48,0.82), rgba(11,15,28,0.88))",
                  boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 50px ${s.tint}22`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 14,
                }}
              >
                <div className="font-mono" style={{ color: s.tint, fontSize: 12, letterSpacing: 2 }}>{s.tag}</div>
                <div style={{ fontFamily: PIXEL, fontSize: "clamp(16px,2.4vw,26px)", color: "#f4f4fb", textShadow: "2px 2px 0 #4a2f9e" }}>{s.title}</div>
                <div className="font-mono" style={{ color: "#8a93bd", fontSize: 11 }}>{i === 0 ? "(already built)" : "section content lands here"}</div>
              </div>
            </div>
          ))}
        </div>

        {/* foreground parallax: dust drifting fast */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, width: `${N * 100}vw`, transform: layer(1.28), pointerEvents: "none" }}>
          {DUST.map((d, i) => (
            <span key={i} className="dust" style={{ left: d.left, top: d.top, animationDelay: d.delay, animationDuration: d.dur, width: d.size, height: d.size }} />
          ))}
        </div>

        {/* CRT dressing */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "repeating-linear-gradient(rgba(0,0,0,0.16) 0 1px, transparent 1px 3px)", mixBlendMode: "multiply" }} />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(125% 95% at 50% 46%, transparent 58%, rgba(0,0,0,0.62) 100%)" }} />

        {/* station progress dots */}
        <div style={{ position: "absolute", bottom: 26, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 10 }}>
          {STATIONS.map((s, i) => (
            <div
              key={s.key}
              style={{
                width: activeIdx === i ? 22 : 8,
                height: 8,
                borderRadius: 4,
                background: activeIdx === i ? s.tint : "rgba(255,255,255,0.25)",
                transition: "width 0.25s ease, background 0.25s ease",
              }}
            />
          ))}
        </div>
        <div style={{ position: "absolute", top: 20, left: 0, right: 0, textAlign: "center", fontFamily: PIXEL, fontSize: 9, color: "#8fb6ff" }}>
          SCROLL TO TRAVEL THE ROOM →
        </div>
      </div>
    </div>
  );
}
