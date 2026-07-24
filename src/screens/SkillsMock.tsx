import { useMemo, useState } from "react";
import {
  skillBranches,
  languages,
  skillLevel,
  type Skill,
  type SkillBranch,
} from "../content/skills";

/**
 * DISPOSABLE MOCKUP for the SKILL TREE (?mock=skills): the handheld OS's next
 * menu page after the About card. A constellation: six branches radiating from
 * a hub, node size and glow derived from evidence, hover/click opens the proof
 * panel with deep-link chips to the proving cartridges. Approved layout gets
 * rebuilt for real with the OS tab transition; mobile/reduced motion will get
 * a flat accordion instead of the graph.
 */

const PIXEL = '"Press Start 2P", ui-monospace, monospace';

const CX = 450;
const CY = 380;
const R0 = 82;
const STEP = 42;
/** Branch angles in degrees; -90 is straight up. Order matches skillBranches. */
const ANGLES = [-90, -34, 34, 90, 146, 214];

interface NodePos {
  branch: SkillBranch;
  skill: Skill;
  x: number;
  y: number;
  labelAnchor: "start" | "end" | "middle";
  labelDx: number;
  labelDy: number;
}

function layout(): { nodes: NodePos[]; lines: { branch: SkillBranch; pts: string }[] } {
  const nodes: NodePos[] = [];
  const lines: { branch: SkillBranch; pts: string }[] = [];
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
      const side = Math.abs(dx) < 0.3 ? "vertical" : dx > 0 ? "right" : "left";
      nodes.push({
        branch,
        skill,
        x,
        y,
        labelAnchor: side === "vertical" ? "start" : side === "right" ? "start" : "end",
        labelDx: side === "vertical" ? 16 : dx > 0 ? 15 : -15,
        labelDy: 4,
      });
    });
    lines.push({ branch, pts: pts.join(" ") });
  });
  return { nodes, lines };
}

export function SkillsMock() {
  const { nodes, lines } = layout();
  const [sel, setSel] = useState<NodePos | null>(null);
  const active = sel;

  const branchDim = (b: SkillBranch) =>
    active && active.branch.id !== b.id ? 0.32 : 1;

  const totalSkills = useMemo(
    () => skillBranches.reduce((n, b) => n + b.skills.length, 0),
    [],
  );

  return (
    <section
      id="skills"
      aria-label="Skills"
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(115% 90% at 50% 30%, #14284c 0%, #0b1226 55%, #070b18 100%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* handheld OS chrome: tab strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          paddingTop: 74,
          position: "relative",
          zIndex: 2,
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
        }}
      >
        {totalSkills} ABILITIES · LEVELS = SHIPPED USES · SELECT A NODE FOR PROOF
      </div>

      {/* constellation + proof panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "stretch",
          justifyContent: "center",
          gap: 8,
          padding: "0 18px 14px",
          position: "relative",
          zIndex: 2,
          minHeight: 0,
        }}
      >
        <svg
          viewBox="0 0 900 740"
          style={{ flex: 1, maxWidth: 950, height: "100%", minHeight: 480 }}
          role="list"
          aria-label="Skill constellation"
        >
          {/* branch lines */}
          {lines.map(({ branch, pts }) => (
            <polyline
              key={branch.id}
              points={pts}
              fill="none"
              stroke={branch.color}
              strokeOpacity={0.34 * branchDim(branch)}
              strokeWidth={1.6}
            />
          ))}

          {/* hub */}
          <g>
            <rect
              x={CX - 9}
              y={CY - 9}
              width={18}
              height={18}
              transform={`rotate(45 ${CX} ${CY})`}
              fill="#f4f4fb"
              opacity={0.9}
            />
            <rect
              x={CX - 15}
              y={CY - 15}
              width={30}
              height={30}
              transform={`rotate(45 ${CX} ${CY})`}
              fill="none"
              stroke="#8fb6ff"
              strokeOpacity={0.5}
            />
            <text
              x={CX}
              y={CY + 34}
              textAnchor="middle"
              style={{ fontFamily: PIXEL, fontSize: 8, fill: "#8fb6ff" }}
            >
              P1
            </text>
          </g>

          {/* branch titles at the tips */}
          {lines.map(({ branch }, bi) => {
            const a = (ANGLES[bi] * Math.PI) / 180;
            const r = R0 + branch.skills.length * STEP + 6;
            const x = CX + Math.cos(a) * r;
            const y = CY + Math.sin(a) * r;
            return (
              <text
                key={branch.id}
                x={x}
                y={y}
                textAnchor={Math.abs(Math.cos(a)) < 0.3 ? "middle" : Math.cos(a) > 0 ? "start" : "end"}
                style={{
                  fontFamily: PIXEL,
                  fontSize: 9.5,
                  fill: branch.color,
                  opacity: branchDim(branch),
                }}
              >
                {branch.name}
              </text>
            );
          })}

          {/* nodes */}
          {nodes.map((n) => {
            const lv = skillLevel(n.skill);
            const rad = 5 + lv * 1.5;
            const isSel = active?.skill.id === n.skill.id;
            return (
              <g
                key={`${n.branch.id}-${n.skill.id}`}
                role="listitem"
                tabIndex={0}
                aria-label={`${n.skill.name}, level ${lv}`}
                style={{ cursor: "pointer", outline: "none", opacity: branchDim(n.branch) }}
                onMouseEnter={() => setSel(n)}
                onFocus={() => setSel(n)}
                onClick={() => setSel(n)}
              >
                {/* glow */}
                <circle cx={n.x} cy={n.y} r={rad + 7} fill={n.branch.color} opacity={isSel ? 0.4 : 0.12 + lv * 0.03} />
                <rect
                  x={n.x - rad}
                  y={n.y - rad}
                  width={rad * 2}
                  height={rad * 2}
                  transform={`rotate(45 ${n.x} ${n.y})`}
                  fill={isSel ? "#f4f4fb" : n.branch.color}
                  stroke="#0b1226"
                  strokeWidth={1.4}
                />
                <text
                  x={n.x + n.labelDx}
                  y={n.y + n.labelDy}
                  textAnchor={n.labelAnchor}
                  className="font-mono"
                  style={{
                    fontSize: 11.5,
                    fill: isSel ? "#f4f4fb" : "#aab2d4",
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
            background: "rgba(10,16,32,0.78)",
            padding: "16px 17px",
            minHeight: 240,
          }}
        >
          {active ? (
            <>
              <div
                style={{
                  fontFamily: PIXEL,
                  fontSize: 8,
                  color: active.branch.color,
                  letterSpacing: 1,
                }}
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
              {/* pips */}
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
              <div
                style={{ fontFamily: PIXEL, fontSize: 7.5, color: "#8a93bd", marginBottom: 8 }}
              >
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
              style={{ fontSize: 11.5, lineHeight: 1.7, color: "#68719c", paddingTop: 44, textAlign: "center" }}
            >
              ▸ hover a node
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
          padding: "0 20px 26px",
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
            "radial-gradient(125% 95% at 50% 45%, transparent 56%, rgba(10,22,48,0.55) 100%)",
        }}
      />
    </section>
  );
}
