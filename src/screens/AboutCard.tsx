import { useEffect, useState, type CSSProperties } from "react";
import { profile } from "../content/profile";
import { useReducedMotion } from "../motion/useReducedMotion";
import { tween } from "../showcase/bootFlow";
import { PixelPortrait } from "./PixelPortrait";

/**
 * The PLAYER 01 character card itself, independent of where it is shown: as a
 * page section, or resolving inside the handheld's screen in the world camera
 * move. The game framing lives in the visuals; the wording stays professional,
 * and every fact comes from the master resume (via `profile`).
 */

const PORTRAIT = `${import.meta.env.BASE_URL}game/portrait-placeholder.webp`;
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

export function AboutCard({ visible = true, play = true }: { visible?: boolean; play?: boolean }) {
  const reduced = useReducedMotion();

  // Per-section hover accent: sets the --hv custom property the CSS reads.
  const hv = (c: string) => ({ ["--hv"]: c }) as CSSProperties;

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
    <div
      style={{
        position: "relative",
        border: "2px solid rgba(122,162,247,0.35)",
        borderRadius: 16,
        background: "linear-gradient(180deg, rgba(20,26,48,0.9) 0%, rgba(11,15,28,0.92) 100%)",
        boxShadow:
          "0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 60px rgba(122,162,247,0.12)",
        padding: 20,
        overflow: "hidden",
        ...cardEnter,
      }}
    >
      <div className="about-grid" style={{ position: "relative" }}>
        {/* ---- left: portrait + identity ---- */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, ...enter(120) }}>
          <PixelPortrait src={PORTRAIT} alt="Zack Alatrash" />

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
                className="about-hover"
                style={{
                  ...hv("#7aa2f7"),
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
                    // 8px beside an 11.5px value read as a mistake rather than
                    // a hierarchy, and the pixel face needs the size most.
                    fontSize: 9.5,
                    color: "#8a93bd",
                    minWidth: 52,
                    paddingTop: 1,
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

          <Panel
            title="LANGUAGES"
            accent="var(--term-cite)"
            className="about-hover"
            style={hv("var(--term-cite)")}
          >
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
            <Panel title="PROFILE" accent="#8fb6ff" className="about-hover" style={hv("#8fb6ff")}>
              <p className="font-mono" style={{ fontSize: 13, lineHeight: 1.78, color: "#d4d9ee", margin: 0 }}>
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
                className="about-hover about-lift"
                style={{
                  ...hv("#9ece6a"),
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
                    className="about-hover about-lift"
                    style={{
                      ...hv("#8fb6ff"),
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
                    <div className="font-mono" style={{ fontSize: 10.5, color: "#aab2d4", lineHeight: 1.6 }}>
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
                    className="font-mono about-hover about-lift"
                    style={{
                      ...hv("#9ece6a"),
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
  );
}

/** Counts an integer up to `to` when `play` turns true; static otherwise. */
function CountUp({ to, render, play }: { to: number; render: (n: number) => string; play: boolean }) {
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
  className,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
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
