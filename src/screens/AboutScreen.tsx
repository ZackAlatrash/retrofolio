import { useEffect, useRef, useState, type CSSProperties } from "react";
import { profile } from "../content/profile";
import { useReducedMotion } from "../motion/useReducedMotion";
import { tween } from "../showcase/bootFlow";

/**
 * Screen 2 - PLAYER 01 (About). A senior-engineer character card: the game
 * framing lives in the visuals, the wording stays professional. Every fact is
 * from the master resume (bio + pillars + metrics + languages via profile).
 *
 * Motion is hand-rolled to match the rest of the app (rAF + CSS, no framer):
 * a scroll-triggered staggered entrance, a count-up on the track-record numbers
 * (via the shared tween, so it also settles instantly in a hidden tab), and a
 * subtle holographic tilt/sheen. All gated behind reduced-motion, and the tilt
 * additionally behind a hover-capable pointer (never on touch).
 */

const PIXEL = '"Press Start 2P", ui-monospace, monospace';

const TRACK: { to: number; render: (n: number) => string; label: string }[] = [
  { to: 3, render: (n) => `${n}`, label: "PRODUCTION RAG SYSTEMS" },
  { to: 65, render: (n) => `${n}K+`, label: "LINES SHIPPED" },
  { to: 1300, render: (n) => `${n.toLocaleString()}+`, label: "TESTS WRITTEN" },
  { to: 9, render: (n) => `${n}/10`, label: "INTERNSHIP GRADE" },
];

const LANGUAGES = [
  { lang: "Arabic", level: "Native", fill: 5 },
  { lang: "English", level: "Fluent (C1)", fill: 4 },
  { lang: "Dutch", level: "B1, improving", fill: 3 },
];

const CERTS = ["AWS Certified AI Practitioner", "AWS CloudFormation", "CS50 · HarvardX"];

const FACTS = [
  { k: "ROLE", v: "AI/LLM Systems Engineer" },
  { k: "BASE", v: "Haarlem, Netherlands" },
  { k: "STUDY", v: "BSc Information Technology · Inholland" },
  { k: "PERMIT", v: "Dutch work permit ✓" },
];

const MAX_TILT = 4; // degrees; small so tilting never fights readability

export function AboutScreen() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(reduced);
  const [play, setPlay] = useState(reduced);

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

  // Holographic tilt only on a hover-capable, fine pointer (never on touch).
  const [canTilt] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );
  const tilt = canTilt && !reduced;
  const tiltRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    if (!tilt || !tiltRef.current) return;
    const r = tiltRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    tiltRef.current.style.transform = `perspective(1200px) rotateY(${px * MAX_TILT * 2}deg) rotateX(${-py * MAX_TILT * 2}deg)`;
    if (sheenRef.current) {
      sheenRef.current.style.background = `radial-gradient(circle at ${(px + 0.5) * 100}% ${(py + 0.5) * 100}%, rgba(143,182,255,0.16), transparent 55%)`;
      sheenRef.current.style.opacity = "1";
    }
  };
  const onLeave = () => {
    if (tiltRef.current) tiltRef.current.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg)";
    if (sheenRef.current) sheenRef.current.style.opacity = "0";
  };

  // Staggered entrance: opacity + translateY per block, CSS-transitioned.
  const enter = (delay: number): CSSProperties =>
    reduced
      ? {}
      : {
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(14px)",
          transition: `opacity 0.5s var(--ease-out) ${delay}ms, transform 0.5s var(--ease-out) ${delay}ms`,
        };

  const cardEnter: CSSProperties = reduced
    ? {}
    : {
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(18px) scale(0.985)",
        transition: "opacity 0.55s var(--ease-out), transform 0.55s var(--ease-out)",
      };

  return (
    <section
      id="about"
      aria-label="About"
      ref={ref}
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "84px 20px 56px",
        scrollMarginTop: 52,
        background:
          "radial-gradient(120% 90% at 50% 0%, #12162a 0%, #0a0d18 60%, #05070c 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* faint grid floor */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(122,162,247,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(122,162,247,0.05) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(80% 60% at 50% 42%, #000 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(80% 60% at 50% 42%, #000 30%, transparent 75%)",
        }}
      />

      <div style={{ width: "min(1060px, 100%)", position: "relative" }}>
        {/* level strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
            ...enter(0),
          }}
        >
          <div
            className="font-mono"
            style={{ fontSize: 11, letterSpacing: 2, color: "var(--term-green)" }}
          >
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

        {/* tilt wrapper (separate element so the 3D transform never fights the card entrance) */}
        <div
          ref={tiltRef}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          style={{ transition: "transform 150ms var(--ease-out)", willChange: "transform" }}
        >
          {/* the card */}
          <div
            style={{
              position: "relative",
              border: "2px solid rgba(122,162,247,0.35)",
              borderRadius: 16,
              background:
                "linear-gradient(180deg, rgba(20,26,48,0.9) 0%, rgba(11,15,28,0.92) 100%)",
              boxShadow:
                "0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 60px rgba(122,162,247,0.12)",
              padding: 20,
              overflow: "hidden",
              ...cardEnter,
            }}
          >
            {/* holographic sheen (follows the cursor, fades on hover) */}
            <div
              ref={sheenRef}
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                pointerEvents: "none",
                mixBlendMode: "screen",
                borderRadius: 16,
                transition: "opacity 200ms var(--ease-out)",
              }}
            />

            <div className="about-grid" style={{ position: "relative" }}>
              {/* ---- left: portrait + identity ---- */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, ...enter(120) }}>
                <div
                  style={{
                    position: "relative",
                    aspectRatio: "1 / 1",
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1px solid rgba(122,162,247,0.3)",
                    background: "radial-gradient(90% 80% at 50% 30%, #1c2340 0%, #0c1020 75%)",
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 88,
                        height: 88,
                        borderRadius: "50%",
                        background: "linear-gradient(180deg, #2a3358 0%, #171d34 100%)",
                        border: "3px solid rgba(143,182,255,0.35)",
                      }}
                    />
                    <div
                      style={{
                        width: 128,
                        height: 44,
                        borderRadius: "60px 60px 0 0",
                        background: "linear-gradient(180deg, #2a3358 0%, #171d34 100%)",
                        border: "3px solid rgba(143,182,255,0.35)",
                        borderBottom: "none",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: 10,
                      bottom: 8,
                      fontFamily: PIXEL,
                      fontSize: 7,
                      color: "#6b76a4",
                    }}
                  >
                    ⌗ PORTRAIT ASSET
                  </div>
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "repeating-linear-gradient(rgba(0,0,0,0.16) 0 1px, transparent 1px 3px)",
                      pointerEvents: "none",
                    }}
                  />
                </div>

                <div>
                  <div
                    style={{
                      fontFamily: PIXEL,
                      fontSize: 16,
                      color: "#f4f4fb",
                      textShadow: "2px 2px 0 #4a2f9e",
                      lineHeight: 1.4,
                    }}
                  >
                    ZACK
                    <br />
                    ALATRASH
                  </div>
                  <div className="font-mono" style={{ fontSize: 11, color: "#7b83a8", marginTop: 8 }}>
                    {profile.name}
                  </div>
                </div>

                {/* identity facts */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {FACTS.map((f) => (
                    <div
                      key={f.k}
                      style={{
                        display: "flex",
                        gap: 10,
                        padding: "8px 11px",
                        borderRadius: 7,
                        background: "rgba(10,14,26,0.55)",
                        border: "1px solid rgba(122,162,247,0.12)",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: PIXEL,
                          fontSize: 8,
                          color: "#8a93bd",
                          minWidth: 46,
                          paddingTop: 2,
                        }}
                      >
                        {f.k}
                      </span>
                      <span className="font-mono" style={{ fontSize: 11.5, color: "#d4d9ee", lineHeight: 1.5 }}>
                        {f.v}
                      </span>
                    </div>
                  ))}
                </div>

                <Panel title="LANGUAGES" accent="var(--term-cite)">
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {LANGUAGES.map((v) => (
                      <div key={v.lang}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            marginBottom: 6,
                          }}
                        >
                          <span className="font-mono" style={{ fontSize: 11.5, color: "#d4d9ee" }}>
                            {v.lang}
                          </span>
                          <span className="font-mono" style={{ fontSize: 10, color: "var(--term-cite)" }}>
                            {v.level}
                          </span>
                        </div>
                        <Segments fill={v.fill} color="var(--term-cite)" />
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>

              {/* ---- right: substance ---- */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={enter(180)}>
                  <Panel title="PROFILE" accent="#8fb6ff">
                    <p
                      className="font-mono"
                      style={{ fontSize: 13, lineHeight: 1.78, color: "#d4d9ee", margin: 0 }}
                    >
                      {profile.bio}
                    </p>
                  </Panel>
                </div>

                {/* track record: real numbers, count up on entry */}
                <div className="about-track" style={enter(240)}>
                  {TRACK.map((s) => (
                    <div
                      key={s.label}
                      aria-label={`${s.render(s.to)} ${s.label}`}
                      style={{
                        border: "1px solid rgba(122,162,247,0.16)",
                        borderRadius: 10,
                        background: "rgba(16,20,36,0.62)",
                        padding: "15px 12px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        aria-hidden="true"
                        style={{
                          fontFamily: PIXEL,
                          fontSize: 18,
                          color: "var(--term-green)",
                          textShadow: "0 0 14px rgba(158,206,106,0.4)",
                        }}
                      >
                        <CountUp to={s.to} render={s.render} play={play} />
                      </div>
                      <div
                        className="font-mono"
                        style={{ fontSize: 9.5, color: "#8a93bd", marginTop: 9, letterSpacing: 0.4, lineHeight: 1.45 }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={enter(300)}>
                  <Panel title="WHAT SETS ME APART" accent="var(--term-amber)">
                    <div className="about-traits">
                      {profile.pillars.map((tr) => (
                        <div
                          key={tr.title}
                          style={{
                            border: "1px solid rgba(122,162,247,0.14)",
                            borderRadius: 8,
                            padding: "12px 13px",
                            background: "rgba(10,14,26,0.5)",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: PIXEL,
                              fontSize: 9,
                              color: "#f4f4fb",
                              lineHeight: 1.5,
                              marginBottom: 9,
                            }}
                          >
                            {tr.title}
                          </div>
                          <div
                            className="font-mono"
                            style={{ fontSize: 10.5, color: "#aab2d4", lineHeight: 1.6 }}
                          >
                            {tr.body}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>

                <div style={enter(360)}>
                  <Panel title="CERTIFICATIONS & COURSES" accent="var(--term-green)">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {CERTS.map((t) => (
                        <span
                          key={t}
                          className="font-mono"
                          style={{
                            fontSize: 10.5,
                            padding: "6px 11px",
                            borderRadius: 6,
                            color: "#b8e394",
                            background: "rgba(158,206,106,0.1)",
                            border: "1px solid rgba(158,206,106,0.22)",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </Panel>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Counts an integer up to `to` when `play` turns true; static otherwise. */
function CountUp({
  to,
  render,
  play,
}: {
  to: number;
  render: (n: number) => string;
  play: boolean;
}) {
  const [n, setN] = useState(play ? 0 : to);
  useEffect(() => {
    if (!play) {
      setN(to);
      return;
    }
    // Shared tween: eased, and completes instantly in a hidden tab.
    return tween(1100, (e) => setN(Math.round(to * e)));
  }, [play, to]);
  return <>{render(n)}</>;
}

function Segments({ fill, of = 5, color }: { fill: number; of?: number; color: string }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: of }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 13,
            height: 9,
            borderRadius: 1,
            background: i < fill ? color : "rgba(255,255,255,0.07)",
            boxShadow: i < fill ? `0 0 6px ${color}88` : "none",
          }}
        />
      ))}
    </div>
  );
}

function Panel({
  title,
  accent,
  children,
  style,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(122,162,247,0.16)",
        borderRadius: 10,
        background: "rgba(16,20,36,0.62)",
        padding: "14px 16px",
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: PIXEL,
          fontSize: 9,
          letterSpacing: 1,
          color: accent,
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
