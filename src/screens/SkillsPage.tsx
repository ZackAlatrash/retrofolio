import { useState } from "react";
import {
  skillBranches,
  languages,
  skillLevel,
  type Skill,
  type SkillBranch,
} from "../content/skills";
import { useReducedMotion } from "../motion/useReducedMotion";

/**
 * The skill constellations as a night sky on the handheld OS. One component,
 * one dial: `reveal` (0..1).
 *   0    - backdrop: faint twinkling stars behind the About card
 *   ->1  - the stars shine, constellation lines draw figure by figure, the
 *          names appear, then the OS chrome (tabs, proof panel, languages)
 *
 * The sky reads like a real star chart: each branch is a hand-drawn irregular
 * figure (a dragon chain, a W, a kite, an arc, a serpent, a crown) scattered
 * across the sky, stars are point cores with level-sized halos, and P1 burns
 * alone at the top as the pole star. Nothing is highlighted until a star is
 * hovered; leaving the sky clears the focus again.
 */

const PIXEL = '"Press Start 2P", ui-monospace, monospace';
const smooth = (x: number, a: number, b: number) => {
  if (b <= a) return x >= b ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

type Anchor = "start" | "middle" | "end";
/** [x, y, labelAnchor, labelDy] per star; label dx derives from the anchor. */
type StarSpec = [number, number, Anchor, number];

interface Figure {
  id: string;
  stars: StarSpec[];
  edges: [number, number][];
  title: [number, number, Anchor];
}

/**
 * Hand-authored constellation figures (order matches skillBranches, star
 * counts match each branch's skill count).
 */
const FIGURES: Figure[] = [
  {
    // AI · RAG: a long dragon chain across the upper sky
    id: "ai",
    stars: [
      [252, 190, "middle", 30],
      [324, 148, "middle", -20],
      [396, 136, "middle", 30],
      [468, 152, "middle", -20],
      [536, 120, "middle", 30],
      [604, 140, "middle", -20],
      [668, 110, "middle", -20],
      [724, 134, "start", 5],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
    ],
    title: [488, 76, "middle"],
  },
  {
    // Architecture: a Cassiopeia W in the upper right
    id: "arch",
    stars: [
      [596, 300, "end", 5],
      [652, 254, "end", 5],
      [708, 300, "middle", 26],
      [764, 254, "middle", -16],
      [820, 300, "middle", 26],
      [866, 262, "end", -16],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ],
    title: [762, 218, "middle"],
  },
  {
    // Testing: a kite (a southern cross) on the right
    id: "testing",
    stars: [
      [700, 452, "end", 5],
      [748, 408, "middle", -16],
      [794, 464, "start", 5],
      [748, 516, "middle", 26],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [1, 3],
    ],
    title: [748, 372, "middle"],
  },
  {
    // Cloud & DevOps: a low arc in the lower middle
    id: "cloud",
    stars: [
      [508, 610, "end", 5],
      [562, 646, "middle", 27],
      [620, 634, "middle", -16],
      [670, 670, "start", 5],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
    title: [586, 588, "middle"],
  },
  {
    // Backend & Data: a serpent winding along the lower left
    id: "backend",
    stars: [
      [120, 500, "middle", -16],
      [178, 534, "middle", 27],
      [236, 514, "middle", -16],
      [292, 548, "middle", 27],
      [346, 532, "middle", -16],
      [396, 572, "middle", 27],
      [448, 556, "start", 5],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
    ],
    title: [284, 468, "middle"],
  },
  {
    // Frontend & Mobile: a crown arc on the left
    id: "frontend",
    stars: [
      [138, 336, "middle", 27],
      [182, 294, "middle", -16],
      [238, 280, "middle", -16],
      [294, 298, "middle", -16],
      [338, 334, "start", 5],
      [362, 382, "start", 5],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ],
    title: [250, 244, "middle"],
  },
];

const POLE = { x: 140, y: 90 };

interface StarPos {
  branch: SkillBranch;
  bi: number;
  skill: Skill;
  x: number;
  y: number;
  anchor: Anchor;
  dy: number;
}

const STARS: StarPos[] = [];
skillBranches.forEach((branch, bi) => {
  const fig = FIGURES[bi];
  branch.skills.forEach((skill, si) => {
    const spec = fig.stars[si] ?? fig.stars[fig.stars.length - 1];
    STARS.push({ branch, bi, skill, x: spec[0], y: spec[1], anchor: spec[2], dy: spec[3] });
  });
});

/** Fixed decorative dust stars (deterministic pseudo-random spread). */
const DUST_STARS = Array.from({ length: 54 }, (_, i) => ({
  x: 24 + ((i * 167 + 61) % 852),
  y: 14 + ((i * 211 + 97) % 700),
  r: 0.6 + (i % 3) * 0.4,
  delay: `${((i * 0.37) % 3.4).toFixed(2)}s`,
}));

export function SkillsPage({ reveal, interactive }: { reveal: number; interactive: boolean }) {
  const reduced = useReducedMotion();
  const [sel, setSel] = useState<StarPos | null>(null);
  const active = interactive ? sel : null;

  const starO = 0.45 + 0.55 * smooth(reveal, 0, 0.35);
  const titleO = smooth(reveal, 0.45, 0.62);
  const labelO = smooth(reveal, 0.55, 0.75);
  const chromeO = smooth(reveal, 0.72, 0.9);

  /** Only dim while a star is actually hovered/focused. */
  const dim = (b: SkillBranch) => (active && active.branch.id !== b.id ? 0.3 : 1);

  return (
    <div
      aria-hidden={reveal < 0.7}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background:
          "radial-gradient(120% 90% at 30% 12%, #10173a 0%, #0a1028 48%, #05081a 100%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* faint nebulae */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(42% 34% at 72% 26%, rgba(187,154,247,0.10), transparent 70%), radial-gradient(36% 30% at 22% 68%, rgba(122,162,247,0.09), transparent 70%)",
        }}
      />

      {/* OS chrome: tab strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          paddingTop: 72,
          position: "relative",
          zIndex: 2,
          opacity: chromeO,
        }}
      >
        {["STATUS", "SKILLS", "LOG", "CONTACT"].map((t) => (
          <span
            key={t}
            style={{
              fontFamily: PIXEL,
              fontSize: t === "SKILLS" ? 12 : 9,
              color: t === "SKILLS" ? "#f4f4fb" : "#5b6690",
              textShadow: t === "SKILLS" ? "0 0 12px rgba(143,182,255,0.6)" : "none",
              letterSpacing: 1,
            }}
          >
            {t === "SKILLS" ? "▸ SKILLS" : t}
          </span>
        ))}
      </div>
      <div
        className="font-mono"
        style={{
          textAlign: "center",
          marginTop: 10,
          fontSize: 10.5,
          letterSpacing: 1.5,
          color: "#68719c",
          position: "relative",
          zIndex: 2,
          opacity: chromeO,
        }}
      >
        {STARS.length} ABILITIES · LEVELS = SHIPPED USES · SELECT A STAR FOR PROOF
      </div>

      {/* the sky + proof panel; leaving it clears the focus */}
      <div
        onMouseLeave={() => setSel(null)}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "stretch",
          justifyContent: "center",
          gap: 8,
          padding: "0 18px 10px",
          position: "relative",
          zIndex: 2,
          minHeight: 0,
        }}
      >
        <svg
          viewBox="0 0 900 740"
          style={{ flex: 1, maxWidth: 950, height: "100%", minHeight: 460 }}
          role="list"
          aria-label="Skill constellations"
        >
          <defs>
            {skillBranches.map((b) => (
              <radialGradient key={b.id} id={`halo-${b.id}`}>
                <stop offset="0%" stopColor={b.color} stopOpacity={0.85} />
                <stop offset="45%" stopColor={b.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={b.color} stopOpacity={0} />
              </radialGradient>
            ))}
            <radialGradient id="halo-pole">
              <stop offset="0%" stopColor="#f4f4fb" stopOpacity={0.9} />
              <stop offset="45%" stopColor="#8fb6ff" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#8fb6ff" stopOpacity={0} />
            </radialGradient>
          </defs>

          {/* dust stars: always in the sky */}
          {DUST_STARS.map((d, i) => (
            <circle
              key={i}
              className={reduced ? undefined : "sky-star"}
              cx={d.x}
              cy={d.y}
              r={d.r}
              fill="#cfe0ff"
              opacity={0.3}
              style={{ animationDelay: d.delay }}
            />
          ))}

          {/* P1: the pole star, alone at the top of the sky */}
          <g opacity={starO}>
            <circle cx={POLE.x} cy={POLE.y} r={26} fill="url(#halo-pole)" />
            <circle cx={POLE.x} cy={POLE.y} r={2.6} fill="#ffffff" />
            <line
              x1={POLE.x - 13}
              x2={POLE.x + 13}
              y1={POLE.y}
              y2={POLE.y}
              stroke="#eef2ff"
              strokeWidth={0.8}
              opacity={0.6}
            />
            <line
              x1={POLE.x}
              x2={POLE.x}
              y1={POLE.y - 13}
              y2={POLE.y + 13}
              stroke="#eef2ff"
              strokeWidth={0.8}
              opacity={0.6}
            />
            <text
              x={POLE.x}
              y={POLE.y + 40}
              textAnchor="middle"
              style={{ fontFamily: PIXEL, fontSize: 8, fill: "#8fb6ff", opacity: titleO }}
            >
              P1
            </text>
          </g>

          {/* constellation lines: draw on figure by figure */}
          {FIGURES.map((fig, bi) => {
            const branch = skillBranches[bi];
            return fig.edges.map(([a, b], ei) => {
              const lineP = smooth(
                reveal,
                0.14 + bi * 0.05 + ei * 0.03,
                0.42 + bi * 0.05 + ei * 0.03,
              );
              const [x1, y1] = fig.stars[a];
              const [x2, y2] = fig.stars[b];
              return (
                <line
                  key={`${fig.id}-${ei}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={branch.color}
                  strokeOpacity={0.4 * lineP * dim(branch)}
                  strokeWidth={1.1}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - lineP}
                />
              );
            });
          })}

          {/* constellation names */}
          {FIGURES.map((fig, bi) => {
            const branch = skillBranches[bi];
            return (
              <text
                key={fig.id}
                x={fig.title[0]}
                y={fig.title[1]}
                textAnchor={fig.title[2]}
                style={{
                  fontFamily: PIXEL,
                  fontSize: 9.5,
                  fill: branch.color,
                  opacity: titleO * dim(branch),
                  letterSpacing: 1,
                }}
              >
                {branch.name}
              </text>
            );
          })}

          {/* the skill stars: point cores with level-sized halos */}
          {STARS.map((n) => {
            const lv = skillLevel(n.skill);
            const isSel = active?.skill.id === n.skill.id;
            const starReveal = smooth(reveal, 0.05 + n.bi * 0.04, 0.4 + n.bi * 0.04);
            const halo = 9 + lv * 4.6;
            const core = 1.7 + lv * 0.45;
            const flare = lv >= 4 ? 8 + lv * 2 : 0;
            const dx = n.anchor === "start" ? 14 : n.anchor === "end" ? -14 : 0;
            return (
              <g
                key={`${n.branch.id}-${n.skill.id}`}
                role="listitem"
                tabIndex={interactive ? 0 : -1}
                aria-label={`${n.skill.name}, level ${lv}`}
                style={{
                  cursor: interactive ? "pointer" : "default",
                  outline: "none",
                  opacity: dim(n.branch),
                  pointerEvents: interactive ? "auto" : "none",
                }}
                onMouseEnter={() => interactive && setSel(n)}
                onFocus={() => interactive && setSel(n)}
                onBlur={() => interactive && setSel(null)}
                onClick={() => interactive && setSel(n)}
              >
                {/* level halo (the glow IS the level) */}
                <circle
                  className={reduced || isSel ? undefined : "sky-star"}
                  style={{ animationDelay: `${((n.x + n.y) % 3.4).toFixed(2)}s` }}
                  cx={n.x}
                  cy={n.y}
                  r={halo * (0.8 + 0.2 * starReveal) * (isSel ? 1.25 : 1)}
                  fill={`url(#halo-${n.branch.id})`}
                  opacity={(0.4 + 0.12 * lv) * starO * (isSel ? 1.3 : 1)}
                />
                {/* diffraction flare on the brightest stars */}
                {flare > 0 && (
                  <g opacity={0.55 * starO * starReveal}>
                    <line
                      x1={n.x - flare}
                      x2={n.x + flare}
                      y1={n.y}
                      y2={n.y}
                      stroke="#eef2ff"
                      strokeWidth={0.7}
                    />
                    <line
                      x1={n.x}
                      x2={n.x}
                      y1={n.y - flare}
                      y2={n.y + flare}
                      stroke="#eef2ff"
                      strokeWidth={0.7}
                    />
                  </g>
                )}
                {/* the star itself */}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={isSel ? core + 0.7 : core}
                  fill={isSel ? "#ffffff" : "#eef2ff"}
                />
                {/* generous invisible hit area */}
                <circle cx={n.x} cy={n.y} r={17} fill="transparent" />
                <text
                  x={n.x + dx}
                  y={n.y + n.dy}
                  textAnchor={n.anchor}
                  className="font-mono"
                  style={{
                    fontSize: 10.5,
                    fill: isSel ? "#f4f4fb" : "#a6aed0",
                    opacity: labelO,
                    paintOrder: "stroke",
                    stroke: "#0a0f21",
                    strokeWidth: 3,
                  }}
                >
                  {n.skill.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* proof panel */}
        <div
          style={{
            width: 316,
            alignSelf: "center",
            border: "1px solid rgba(122,162,247,0.28)",
            borderRadius: 10,
            background: "rgba(10,16,32,0.82)",
            padding: "16px 17px",
            minHeight: 240,
            opacity: chromeO,
            pointerEvents: interactive ? "auto" : "none",
          }}
        >
          {active ? (
            <>
              <div
                style={{ fontFamily: PIXEL, fontSize: 8, color: active.branch.color, letterSpacing: 1 }}
              >
                {active.branch.name}
              </div>
              <div
                style={{
                  fontFamily: PIXEL,
                  fontSize: 12,
                  color: "#f4f4fb",
                  margin: "10px 0 8px",
                  lineHeight: 1.5,
                }}
              >
                {active.skill.name}
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 10 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      width: 13,
                      height: 9,
                      borderRadius: 1,
                      background:
                        i < skillLevel(active.skill)
                          ? active.branch.color
                          : "rgba(255,255,255,0.08)",
                      boxShadow:
                        i < skillLevel(active.skill)
                          ? `0 0 6px ${active.branch.color}88`
                          : "none",
                    }}
                  />
                ))}
                <span className="font-mono" style={{ fontSize: 10, color: "#68719c", marginLeft: 6 }}>
                  LV {skillLevel(active.skill)} · {active.skill.evidence.length} shipped use
                  {active.skill.evidence.length > 1 ? "s" : ""}
                </span>
              </div>
              <p
                className="font-mono"
                style={{ fontSize: 11.5, lineHeight: 1.65, color: "#c7cde8", margin: "0 0 12px" }}
              >
                {active.skill.blurb}
              </p>
              <div style={{ fontFamily: PIXEL, fontSize: 7.5, color: "#8a93bd", marginBottom: 8 }}>
                PROVEN IN
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {active.skill.evidence.map((ev) =>
                  ev.projectId ? (
                    <a
                      key={ev.name}
                      href={`#project-${ev.projectId}/detail`}
                      className="font-mono"
                      style={{
                        fontSize: 10.5,
                        padding: "5px 10px",
                        borderRadius: 6,
                        color: active.branch.color,
                        background: "rgba(122,162,247,0.1)",
                        border: `1px solid ${active.branch.color}55`,
                        textDecoration: "none",
                      }}
                    >
                      ▸ {ev.name}
                    </a>
                  ) : (
                    <span
                      key={ev.name}
                      className="font-mono"
                      style={{
                        fontSize: 10.5,
                        padding: "5px 10px",
                        borderRadius: 6,
                        color: "#8a93bd",
                        border: "1px solid rgba(138,147,189,0.3)",
                      }}
                    >
                      {ev.name}
                    </span>
                  ),
                )}
              </div>
            </>
          ) : (
            <div
              className="font-mono"
              style={{
                fontSize: 11.5,
                lineHeight: 1.7,
                color: "#68719c",
                paddingTop: 44,
                textAlign: "center",
              }}
            >
              ▸ hover a star
              <br />
              every level is backed by
              <br />
              shipped work, not self-rating
            </div>
          )}
        </div>
      </div>

      {/* languages loadout */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 8,
          padding: "0 20px 24px",
          opacity: chromeO,
        }}
      >
        <span style={{ fontFamily: PIXEL, fontSize: 7.5, color: "#8a93bd", marginRight: 6 }}>
          LANGUAGES
        </span>
        {languages.map((l) => (
          <span
            key={l}
            className="font-mono"
            style={{
              fontSize: 10.5,
              padding: "5px 11px",
              borderRadius: 6,
              color: "#c7cde8",
              background: "rgba(16,24,46,0.7)",
              border: "1px solid rgba(122,162,247,0.2)",
            }}
          >
            {l}
          </span>
        ))}
      </div>

      {/* LCD dressing */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "repeating-linear-gradient(rgba(0,0,0,0.18) 0 1px, transparent 1px 3px)",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(125% 95% at 50% 45%, transparent 56%, rgba(8,14,34,0.6) 100%)",
        }}
      />
    </div>
  );
}
