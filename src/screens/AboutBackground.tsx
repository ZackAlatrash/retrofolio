import { roomUrl } from "../showcase/showcaseData";

/**
 * The two candidate About backgrounds (Zack is comparing them):
 *  - "room": the Projects room again, darkened + blurred + slow drift, so About
 *    reads as the game paused on the character sheet.
 *  - "grid": a synthwave floor grid scrolling to a horizon + starfield.
 * Both share the site's ambient layer (dust, phosphor glow, CRT scanlines,
 * vignette) and a subtle pointer parallax via the --apx/--apy vars on the
 * section. Purely decorative (aria-hidden); reduced motion drops the animation.
 */

const DUST = [
  { left: "16%", top: "34%", delay: "0s", dur: "12s", size: 3 },
  { left: "28%", top: "62%", delay: "2.4s", dur: "14s", size: 2 },
  { left: "44%", top: "26%", delay: "5s", dur: "11s", size: 2 },
  { left: "58%", top: "58%", delay: "1.2s", dur: "13s", size: 3 },
  { left: "69%", top: "36%", delay: "3.6s", dur: "15s", size: 2 },
  { left: "78%", top: "60%", delay: "6.2s", dur: "12s", size: 3 },
  { left: "86%", top: "44%", delay: "0.8s", dur: "14s", size: 2 },
  { left: "37%", top: "48%", delay: "7.4s", dur: "13s", size: 2 },
];

const STARS = [
  { left: "12%", top: "18%", s: 2, d: "0s" },
  { left: "22%", top: "30%", s: 1.5, d: "1.1s" },
  { left: "33%", top: "12%", s: 2, d: "2.2s" },
  { left: "47%", top: "22%", s: 1.5, d: "0.6s" },
  { left: "58%", top: "14%", s: 2.5, d: "3s" },
  { left: "67%", top: "26%", s: 1.5, d: "1.8s" },
  { left: "76%", top: "16%", s: 2, d: "2.6s" },
  { left: "84%", top: "28%", s: 1.5, d: "0.9s" },
  { left: "90%", top: "20%", s: 2, d: "3.4s" },
  { left: "8%", top: "30%", s: 1.5, d: "2s" },
  { left: "40%", top: "32%", s: 1.5, d: "4s" },
  { left: "52%", top: "34%", s: 2, d: "1.4s" },
];

function Dust() {
  return (
    <>
      {DUST.map((d, i) => (
        <span
          key={i}
          className="dust"
          style={{
            left: d.left,
            top: d.top,
            animationDelay: d.delay,
            animationDuration: d.dur,
            width: d.size,
            height: d.size,
          }}
        />
      ))}
    </>
  );
}

function Crt() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "repeating-linear-gradient(rgba(0,0,0,0.16) 0 1px, transparent 1px 3px)",
          mixBlendMode: "multiply",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(125% 95% at 50% 46%, transparent 58%, rgba(0,0,0,0.62) 100%)",
          pointerEvents: "none",
        }}
      />
    </>
  );
}

export function AboutBackground({ mode }: { mode: "room" | "grid" }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#05070c" }}>
      {mode === "room" ? (
        <>
          {/* parallax wrapper (pointer drift) + inner kenburns drift */}
          <div
            style={{
              position: "absolute",
              inset: "-8%",
              transform: "translate(calc(var(--apx, 0) * 9px), calc(var(--apy, 0) * 9px))",
            }}
          >
            <img
              src={roomUrl}
              alt=""
              className="about-room-img"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "brightness(0.42) blur(9px) saturate(0.85)",
              }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(70% 60% at 50% 44%, rgba(6,8,14,0.35), rgba(4,6,12,0.72) 100%)",
            }}
          />
          {/* phosphor TV glow behind the card */}
          <div
            className="about-glow"
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(48% 42% at 50% 44%, rgba(122,162,247,0.28), transparent 70%)",
            }}
          />
          <Dust />
          <Crt />
        </>
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(110% 80% at 50% 8%, #1a1440 0%, #0c0e22 46%, #05070c 100%)",
            }}
          />
          {/* starfield (subtle pointer parallax) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: "translate(calc(var(--apx, 0) * 6px), calc(var(--apy, 0) * 6px))",
            }}
          >
            {STARS.map((st, i) => (
              <span
                key={i}
                className="about-star"
                style={{ left: st.left, top: st.top, width: st.s, height: st.s, animationDelay: st.d }}
              />
            ))}
          </div>
          {/* horizon glow */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "52%",
              height: 2,
              background: "#a9c6ff",
              filter: "blur(3px)",
              boxShadow: "0 0 24px 6px rgba(122,162,247,0.6), 0 0 60px 12px rgba(187,154,247,0.35)",
            }}
          />
          {/* the receding floor grid */}
          <div
            style={{
              position: "absolute",
              left: "-30%",
              right: "-30%",
              bottom: "-6%",
              height: "60%",
              transform: "perspective(300px) rotateX(62deg)",
              transformOrigin: "bottom center",
            }}
          >
            <div className="about-synthgrid" style={{ position: "absolute", inset: 0 }} />
          </div>
          <Dust />
          <Crt />
        </>
      )}
    </div>
  );
}
