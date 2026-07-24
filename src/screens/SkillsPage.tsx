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
 * The skill constellation as a night sky on the handheld OS. One component,
 * one dial: `reveal` (0..1).
 *   0    - backdrop: faint twinkling stars behind the About card
 *   ->1  - the stars shine, constellation lines draw branch by branch, the
 *          names appear, then the OS chrome (tabs, proof panel, languages)
 * At reveal 1 it is the interactive SKILLS page: hovering a star focuses its
 * branch and opens the proof panel with deep links to the proving cartridges.
 */

const PIXEL = '"Press Start 2P", ui-monospace, monospace';
const smooth = (x: number, a: number, b: number) => {
  if (b <= a) return x >= b ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const CX = 450;
const CY = 380;
const R0 = 82;
const STEP = 42;
/** Branch angles in degrees; -90 is straight up. Order matches skillBranches. */
const ANGLES = [-90, -34, 34, 90, 146, 214];

interface StarPos {
  branch: SkillBranch;
  bi: number;
  skill: Skill;
  x: number;
  y: number;
  labelAnchor: "start" | "end";
  labelDx: number;
}

function layout() {
  const stars: StarPos[] = [];
  const lines: { branch: SkillBranch; bi: number; pts: string }[] = [];
  skillBranches.forEach((branch, bi) => {
    const a = (ANGLES[bi] * Math.PI) / 180;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const pts: string[] = [`${CX + dx * 34},${CY + dy * 34}`];
    branch.skills.forEach((skill, si) => {
      const r = R0 + si * STEP;
      const x = CX + dx * r;
      const y = CY + dy * r;
      pts.push(`${x},${y}`);
      stars.push({
        branch,
        bi,
        skill,
        x,
        y,
        labelAnchor: Math.abs(dx) < 0.3 || dx > 0 ? "start" : "end",
        labelDx: Math.abs(dx) < 0.3 ? 17 : dx > 0 ? 16 : -16,
      });
    });
    lines.push({ branch, bi, pts: pts.join(" ") });
  });
  return { stars, lines };
}

const { stars: STARS, lines: LINES } = (() => layout())();

/** Fixed decorative dust stars (deterministic pseudo-random spread). */
const DUST_STARS = Array.from({ length: 46 }, (_, i) => ({
  x: 30 + ((i * 167 + 61) % 840),
  y: 16 + ((i * 211 + 97) % 690),
  r: 0.7 + (i % 3) * 0.45,
  delay: `${((i * 0.37) % 3.4).toFixed(2)}s`,
}));

/** A 4-point sparkle star. */
function Sparkle({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  const k = s * 0.28;
  const pts = `${x},${y - s} ${x + k},${y - k} ${x + s},${y} ${x + k},${y + k} ${x},${y + s} ${x - k},${y + k} ${x - s},${y} ${x - k},${y - k}`;
  return <polygon points={pts} fill={fill} />;
}

export function SkillsPage({ reveal, interactive }: { reveal: number; interactive: boolean }) {
  const reduced = useReducedMotion();
  const [sel, setSel] = useState<StarPos | null>(null);
  const active = interactive ? sel : null;

  const starO = 0.42 + 0.58 * smooth(reveal, 0, 0.35);
  const titleO = smooth(reveal, 0.45, 0.62);
  const labelO = smooth(reveal, 0.55, 0.75);
  const chromeO = smooth(reveal, 0.72, 0.9);

  const branchDim = (b: SkillBranch) => (active && active.branch.id !== b.id ? 0.3 : 1);

  return (
    <div
      aria-hidden={reveal < 0.7}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background:
          "radial-gradient(120% 90% at 30% 12%, #131b3a 0%, #0b1128 48%, #06091a 100%)",
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

      {/* the sky + proof panel */}
      <div
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
          aria-label="Skill constellation"
        >
          {/* dust stars: always in the sky */}
          {DUST_STARS.map((d, i) => (
            <circle
              key={i}
              className={reduced ? undefined : "sky-star"}
              cx={d.x}
              cy={d.y}
              r={d.r}
              fill="#cfe0ff"
              opacity={0.32}
              style={{ animationDelay: d.delay }}
            />
          ))}

          {/* constellation lines: draw on with the reveal, branch by branch */}
          {LINES.map(({ branch, bi, pts }) => {
            const lineP = smooth(reveal, 0.14 + bi * 0.05, 0.46 + bi * 0.05);
            return (
              <polyline
                key={branch.id}
                points={pts}
                fill="none"
                stroke={branch.color}
                strokeOpacity={0.42 * lineP * branchDim(branch)}
                strokeWidth={1.4}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - lineP}
              />
            );
          })}

          {/* the player star at the hub */}
          <g opacity={starO}>
            <circle cx={CX} cy={CY} r={16} fill="#8fb6ff" opacity={0.25} />
            <Sparkle x={CX} y={CY} s={13} fill="#f4f4fb" />
            <text
              x={CX}
              y={CY + 34}
              textAnchor="middle"
              style={{ fontFamily: PIXEL, fontSize: 8, fill: "#8fb6ff", opacity: titleO }}
            >
              P1
            </text>
          </g>

          {/* branch names at the constellation tips */}
          {LINES.map(({ branch, bi }) => {
            const a = (ANGLES[bi] * Math.PI) / 180;
            const r = R0 + branch.skills.length * STEP + 6;
            const x = CX + Math.cos(a) * r;
            const y = CY + Math.sin(a) * r;
            return (
              <text
                key={branch.id}
                x={x}
                y={y}
                textAnchor={
                  Math.abs(Math.cos(a)) < 0.3 ? "middle" : Math.cos(a) > 0 ? "start" : "end"
                }
                style={{
                  fontFamily: PIXEL,
                  fontSize: 9.5,
                  fill: branch.color,
                  opacity: titleO * branchDim(branch),
                }}
              >
                {branch.name}
              </text>
            );
          })}

          {/* the skill stars */}
          {STARS.map((n) => {
            const lv = skillLevel(n.skill);
            const s = 4.5 + lv * 1.4;
            const isSel = active?.skill.id === n.skill.id;
            const starReveal = smooth(reveal, 0.05 + n.bi * 0.04, 0.4 + n.bi * 0.04);
            return (
              <g
                key={`${n.branch.id}-${n.skill.id}`}
                role="listitem"
                tabIndex={interactive ? 0 : -1}
                aria-label={`${n.skill.name}, level ${lv}`}
                style={{
                  cursor: interactive ? "pointer" : "default",
                  outline: "none",
                  opacity: branchDim(n.branch),
                  pointerEvents: interactive ? "auto" : "none",
                }}
                onMouseEnter={() => interactive && setSel(n)}
                onFocus={() => interactive && setSel(n)}
                onClick={() => interactive && setSel(n)}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={s + 8}
                  fill={n.branch.color}
                  opacity={(isSel ? 0.45 : 0.1 + lv * 0.04 + 0.1 * starReveal) * starO}
                />
                <g
                  className={reduced || isSel ? undefined : "sky-star"}
                  style={{ animationDelay: `${((n.x + n.y) % 3.4).toFixed(2)}s` }}
                >
                  <Sparkle
                    x={n.x}
                    y={n.y}
                    s={s * (0.72 + 0.28 * starReveal)}
                    fill={isSel ? "#ffffff" : starReveal > 0.5 ? "#eef2ff" : "#aab8e8"}
                  />
                </g>
                <text
                  x={n.x + n.labelDx}
                  y={n.y + 4}
                  textAnchor={n.labelAnchor}
                  className="font-mono"
                  style={{
                    fontSize: 11.5,
                    fill: isSel ? "#f4f4fb" : "#aab2d4",
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
