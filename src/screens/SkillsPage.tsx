import { useEffect, useRef, useState } from "react";
import {
  skillBranches,
  languages,
  skillLevel,
  type Skill,
  type SkillBranch,
} from "../content/skills";
import { useReducedMotion } from "../motion/useReducedMotion";
import { skyUrl } from "../showcase/showcaseData";

/**
 * The skill constellations as a night sky on the handheld OS. One component,
 * one dial: `reveal` (0..1).
 *   0    - backdrop: faint twinkling stars behind the About card (centered,
 *          no panning, no chrome)
 *   ->1  - the stars shine, constellation lines draw figure by figure, the
 *          names appear, then the OS chrome stages in
 *
 * Readability model (this is a star chart, so it reads like one):
 *   - the calm default shows only the six constellation NAMES, anchored to
 *     their own figures; individual skill labels stay hidden
 *   - a navigator rail lists the constellations; hovering or clicking one
 *     focuses it: the sky pans to centre it, it brightens, the others dim,
 *     and only its skill labels appear
 *   - a legend explains that a brighter star means more shipped uses
 *   - a SKY/LIST toggle swaps the whole thing for a plain grouped list
 *     (fast to scan, accessible, and what phones get)
 *
 * The sky world is wider than the viewport and pans by drag / trackpad /
 * native horizontal scroll. Vertical page scroll is never hijacked.
 */

const PIXEL = '"Press Start 2P", ui-monospace, monospace';
const smooth = (x: number, a: number, b: number) => {
  if (b <= a) return x >= b ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Proof-panel width, and the space the navigator rail needs on the left. */
const PANEL_W = 316;
const RAIL_CLEAR = 252;

/** The sky world, in SVG units. Wider than a viewport: it pans. */
const SKY_W = 1900;
const SKY_H = 740;

type Anchor = "start" | "middle" | "end";
/** [x, y, labelAnchor, labelDy] per star; label dx derives from the anchor. */
type StarSpec = [number, number, Anchor, number];

interface Figure {
  id: string;
  stars: StarSpec[];
  edges: [number, number][];
}

/**
 * Hand-authored constellation figures (order matches skillBranches, star
 * counts match each branch's skill count), spread across the wide sky.
 */
const FIGURES: Figure[] = [
  {
    // AI · RAG: a long dragon chain across the upper sky
    id: "ai",
    stars: [
      [430, 290, "end", 6],
      [560, 225, "middle", -26],
      [690, 205, "middle", 40],
      [820, 230, "middle", -26],
      [950, 180, "middle", 40],
      [1075, 210, "middle", -26],
      [1200, 165, "middle", -26],
      [1310, 200, "start", 6],
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
  },
  {
    // Architecture: a Cassiopeia W in the upper right
    id: "arch",
    stars: [
      [1450, 330, "end", 6],
      [1530, 255, "end", -18],
      [1610, 330, "middle", 40],
      [1690, 255, "middle", -26],
      [1770, 330, "middle", 40],
      [1840, 268, "end", -26],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ],
  },
  {
    // Testing: a kite (a southern cross) on the right
    id: "testing",
    stars: [
      [1500, 520, "end", 6],
      [1592, 445, "middle", -26],
      [1672, 530, "start", 6],
      [1592, 612, "middle", 40],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [1, 3],
    ],
  },
  {
    // Cloud & DevOps: a low arc in the lower middle
    id: "cloud",
    stars: [
      [960, 618, "end", -18],
      [1062, 664, "middle", 42],
      [1172, 648, "middle", -26],
      [1268, 690, "start", 6],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  },
  {
    // Backend & Data: a serpent winding along the lower left
    id: "backend",
    stars: [
      [180, 560, "middle", -26],
      [292, 606, "middle", 42],
      [402, 580, "middle", -26],
      [512, 622, "middle", 42],
      [616, 600, "middle", -26],
      [716, 646, "middle", 42],
      [820, 624, "start", 6],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
    ],
  },
  {
    // Frontend & Mobile: a crown arc on the left
    id: "frontend",
    stars: [
      [160, 462, "middle", 42],
      [242, 404, "middle", -26],
      [352, 384, "middle", -26],
      [462, 408, "middle", -26],
      [542, 462, "start", 6],
      [584, 522, "start", 6],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ],
  },
];

const POLE = { x: 200, y: 105 };

/** Each figure's box, so titles bind to their own stars and panning centres. */
const BOXES = FIGURES.map((fig) => {
  const xs = fig.stars.map((s) => s[0]);
  const ys = fig.stars.map((s) => s[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  return { cx: (minX + maxX) / 2, top: minY, halfW: (maxX - minX) / 2 };
});

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
const DUST_STARS = Array.from({ length: 34 }, (_, i) => ({
  x: 24 + ((i * 271 + 61) % (SKY_W - 48)),
  y: 14 + ((i * 211 + 97) % (SKY_H - 40)),
  r: 0.6 + (i % 3) * 0.45,
  delay: `${((i * 0.37) % 3.4).toFixed(2)}s`,
}));

export function SkillsPage({ reveal, interactive }: { reveal: number; interactive: boolean }) {
  const reduced = useReducedMotion();
  const [sel, setSel] = useState<StarPos | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [view, setView] = useState<"sky" | "list">("sky");
  // The proof panel flips to whichever side of the sky the star is NOT on.
  const [panelSide, setPanelSide] = useState<"left" | "right">("right");
  const active = interactive ? sel : null;
  const focus = interactive ? focusId : null;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startLeft: number; moved: boolean } | null>(null);
  const [pan, setPan] = useState({ left: false, right: true });

  // Backdrop mode stays centred; the user takes over once it is interactive.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || interactive) return;
    const centre = () => {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    };
    centre();
    window.addEventListener("resize", centre);
    return () => window.removeEventListener("resize", centre);
  }, [interactive]);

  /** Pan the sky so a figure sits in the middle of the view. */
  const panToFigure = (bi: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const scale = el.scrollWidth / SKY_W;
    const target = BOXES[bi].cx * scale - el.clientWidth / 2;
    el.scrollTo({
      left: clamp(target, 0, el.scrollWidth - el.clientWidth),
      behavior: reduced ? "auto" : "smooth",
    });
  };

  const focusBranch = (bi: number, alsoPan: boolean) => {
    setFocusId(skillBranches[bi].id);
    if (alsoPan) panToFigure(bi);
  };

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setPan({ left: el.scrollLeft > 6, right: el.scrollLeft < max - 6 });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive || e.button !== 0) return;
    const el = scrollerRef.current;
    if (!el) return;
    dragRef.current = { startX: e.clientX, startLeft: el.scrollLeft, moved: false };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    const el = scrollerRef.current;
    if (!d || !el) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 6) d.moved = true;
    el.scrollLeft = d.startLeft - dx;
  };
  const endDrag = () => {
    // Cleared next tick so the click that follows a drag is ignored.
    window.setTimeout(() => {
      dragRef.current = null;
    }, 0);
  };
  const wasDrag = () => dragRef.current?.moved ?? false;

  /**
   * Select a star and park the proof panel clear of it: the panel goes to the
   * opposite side of the view, and only flips left when there is room beside
   * the navigator rail.
   */
  const selectStar = (n: StarPos) => {
    setFocusId(n.branch.id);
    setSel(n);
    const el = scrollerRef.current;
    if (!el) return;
    const scale = el.scrollWidth / SKY_W;
    const screenX = n.x * scale - el.scrollLeft;
    const roomForLeft = el.clientWidth > RAIL_CLEAR + PANEL_W + 40;
    setPanelSide(screenX > el.clientWidth * 0.52 && roomForLeft ? "left" : "right");
  };

  const starO = 0.45 + 0.55 * smooth(reveal, 0, 0.35);
  const titleO = smooth(reveal, 0.45, 0.62);
  const labelO = smooth(reveal, 0.55, 0.75);
  const chromeO = smooth(reveal, 0.72, 0.9);

  /** Unfocused constellations recede; nothing dims until something is focused. */
  const dim = (b: SkillBranch) => (focus && focus !== b.id ? 0.52 : 1);
  /** Skill labels belong to the focused constellation only. */
  const labelsOn = (b: SkillBranch) => (focus === b.id ? labelO : 0);


  return (
    <div
      aria-hidden={reveal < 0.7}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        // the art fills the whole screen; the panning sky sits on top of it
        backgroundColor: "#05081a",
        backgroundImage: `linear-gradient(rgba(8,12,32,0.35), rgba(8,12,32,0.35)), url(${skyUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {view === "list" && interactive ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflowY: "auto",
            padding: "78px 0 74px",
            zIndex: 2,
          }}
        >
          <SkillList />
        </div>
      ) : (
        <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
          <div
            ref={scrollerRef}
            onScroll={onScroll}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            style={{
              position: "absolute",
              inset: 0,
              overflowX: interactive ? "auto" : "hidden",
              overflowY: "hidden",
              // keep horizontal scroll inside the sky: without this the
              // trackpad swipe chains to the browser's back/forward gesture
              overscrollBehaviorX: "contain",
              touchAction: "pan-y",
              scrollbarWidth: "none",
              cursor: interactive ? "grab" : "default",
            }}
          >
            <svg
              viewBox={`0 0 ${SKY_W} ${SKY_H}`}
              style={{
                height: "100%",
                minWidth: "100%",
                aspectRatio: `${SKY_W} / ${SKY_H}`,
                display: "block",
              }}
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

              {/* the generated night-sky panorama */}
              <image
                href={skyUrl}
                x={0}
                y={0}
                width={SKY_W}
                height={SKY_H}
                preserveAspectRatio="xMidYMid slice"
                opacity={0.92}
              />

              {/* dust stars */}
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

              {/* P1: the pole star, alone in the upper sky */}
              <g opacity={starO * (focus ? 0.6 : 1)} style={{ transition: "opacity 0.25s ease" }}>
                <circle cx={POLE.x} cy={POLE.y} r={34} fill="url(#halo-pole)" />
                <circle cx={POLE.x} cy={POLE.y} r={3.2} fill="#ffffff" />
                <line
                  x1={POLE.x - 17}
                  x2={POLE.x + 17}
                  y1={POLE.y}
                  y2={POLE.y}
                  stroke="#eef2ff"
                  strokeWidth={0.9}
                  opacity={0.6}
                />
                <line
                  x1={POLE.x}
                  x2={POLE.x}
                  y1={POLE.y - 17}
                  y2={POLE.y + 17}
                  stroke="#eef2ff"
                  strokeWidth={0.9}
                  opacity={0.6}
                />
                <text
                  x={POLE.x}
                  y={POLE.y + 52}
                  textAnchor="middle"
                  style={{ fontFamily: PIXEL, fontSize: 10, fill: "#8fb6ff", opacity: titleO }}
                >
                  P1
                </text>
              </g>

              {/* constellation lines */}
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
                      strokeOpacity={(focus === branch.id ? 0.9 : 0.55) * lineP * dim(branch)}
                      strokeWidth={focus === branch.id ? 1.7 : 1.3}
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={1 - lineP}
                      style={{ transition: "stroke-opacity 0.25s ease, stroke-width 0.25s ease" }}
                    />
                  );
                });
              })}

              {/* constellation names, bound to their own figures */}
              {FIGURES.map((fig, bi) => {
                const branch = skillBranches[bi];
                const box = BOXES[bi];
                const isFocus = focus === branch.id;
                // Clear of the topmost skill label (which sits at box.top - 26).
                const y = box.top - 70;
                const half = Math.min(box.halfW, 210);
                return (
                  <g
                    key={fig.id}
                    style={{
                      cursor: interactive ? "pointer" : "default",
                      pointerEvents: interactive ? "auto" : "none",
                      opacity: titleO * dim(branch),
                      transition: "opacity 0.25s ease",
                    }}
                    onMouseEnter={() => interactive && setFocusId(branch.id)}
                    onClick={() => interactive && !wasDrag() && focusBranch(bi, true)}
                  >
                    {/* a bracket ties the name to its stars */}
                    <path
                      d={`M ${box.cx - half} ${y + 14} v 10 M ${box.cx - half} ${y + 24} H ${box.cx + half} M ${box.cx + half} ${y + 24} v -10`}
                      fill="none"
                      stroke={branch.color}
                      strokeOpacity={isFocus ? 0.6 : 0.28}
                      strokeWidth={1.1}
                    />
                    <text
                      x={box.cx}
                      y={y}
                      textAnchor="middle"
                      style={{
                        fontFamily: PIXEL,
                        fontSize: 13,
                        fill: branch.color,
                        letterSpacing: 1,
                        paintOrder: "stroke",
                        stroke: "#070b1c",
                        strokeWidth: 4,
                      }}
                    >
                      {branch.name}
                    </text>
                    <text
                      x={box.cx}
                      y={y + 16}
                      textAnchor="middle"
                      className="font-mono"
                      style={{ fontSize: 10, fill: "#8a93bd", opacity: isFocus ? 0 : 0.9 }}
                    >
                      {branch.skills.length} abilities
                    </text>
                  </g>
                );
              })}

              {/* the skill stars */}
              {STARS.map((n) => {
                const lv = skillLevel(n.skill);
                const isSel = active?.skill.id === n.skill.id;
                const starReveal = smooth(reveal, 0.05 + n.bi * 0.04, 0.4 + n.bi * 0.04);
                const halo = 12 + lv * 5.6;
                const core = 2.1 + lv * 0.55;
                const flare = lv >= 4 ? 11 + lv * 2.4 : 0;
                const dx = n.anchor === "start" ? 18 : n.anchor === "end" ? -18 : 0;
                const lo = labelsOn(n.branch);
                return (
                  <g
                    key={`${n.branch.id}-${n.skill.id}`}
                    role="listitem"
                    tabIndex={interactive ? 0 : -1}
                    aria-label={`${n.skill.name}, level ${lv}, ${n.branch.name}`}
                    style={{
                      cursor: interactive ? "pointer" : "default",
                      outline: "none",
                      opacity: dim(n.branch),
                      pointerEvents: interactive ? "auto" : "none",
                      transition: "opacity 0.25s ease",
                    }}
                    onMouseEnter={() => interactive && selectStar(n)}
                    onFocus={() => interactive && selectStar(n)}
                    onClick={() => interactive && !wasDrag() && selectStar(n)}
                  >
                    {/* level halo (the glow IS the level) */}
                    <circle
                      className={reduced || isSel ? undefined : "sky-star"}
                      style={{ animationDelay: `${((n.x + n.y) % 3.4).toFixed(2)}s` }}
                      cx={n.x}
                      cy={n.y}
                      r={halo * (0.8 + 0.2 * starReveal) * (isSel ? 1.25 : 1)}
                      fill={`url(#halo-${n.branch.id})`}
                      opacity={(0.5 + 0.13 * lv) * starO * (isSel ? 1.3 : 1)}
                    />
                    {flare > 0 && (
                      <g opacity={0.55 * starO * starReveal}>
                        <line
                          x1={n.x - flare}
                          x2={n.x + flare}
                          y1={n.y}
                          y2={n.y}
                          stroke="#eef2ff"
                          strokeWidth={0.8}
                        />
                        <line
                          x1={n.x}
                          x2={n.x}
                          y1={n.y - flare}
                          y2={n.y + flare}
                          stroke="#eef2ff"
                          strokeWidth={0.8}
                        />
                      </g>
                    )}
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={isSel ? core + 0.8 : core}
                      fill={isSel ? "#ffffff" : "#eef2ff"}
                    />
                    <circle cx={n.x} cy={n.y} r={24} fill="transparent" />
                    {/* the label belongs to the focused constellation */}
                    <text
                      x={n.x + dx}
                      y={n.y + n.dy}
                      textAnchor={n.anchor}
                      className="font-mono"
                      style={{
                        fontSize: 13.5,
                        fill: isSel ? "#f4f4fb" : "#c2c9e6",
                        opacity: lo,
                        pointerEvents: "none",
                        transition: "opacity 0.25s ease",
                        paintOrder: "stroke",
                        stroke: "#070b1c",
                        strokeWidth: 4,
                      }}
                    >
                      {n.skill.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* pan hints */}
          {interactive && (
            <>
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontFamily: PIXEL,
                  fontSize: 15,
                  color: "#8fb6ff",
                  opacity: chromeO * (pan.left ? 0.85 : 0.12),
                  textShadow: "0 0 10px rgba(143,182,255,0.7)",
                  pointerEvents: "none",
                  transition: "opacity 0.25s ease",
                }}
              >
                ◄
              </div>
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontFamily: PIXEL,
                  fontSize: 15,
                  color: "#8fb6ff",
                  opacity: chromeO * (pan.right ? 0.85 : 0.12),
                  textShadow: "0 0 10px rgba(143,182,255,0.7)",
                  pointerEvents: "none",
                  transition: "opacity 0.25s ease",
                }}
              >
                ►
              </div>
            </>
          )}

          {/* navigator rail: the way in */}
          {interactive && (
            <div
              onMouseLeave={() => {
                setFocusId(null);
                setSel(null);
              }}
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                padding: "12px 12px",
                borderRadius: 10,
                border: "1px solid rgba(122,162,247,0.22)",
                background: "rgba(8,13,28,0.82)",
                opacity: chromeO,
                zIndex: 3,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{ fontFamily: PIXEL, fontSize: 7, color: "#68719c", letterSpacing: 1 }}
                >
                  CONSTELLATIONS
                </span>
                <span style={{ display: "flex", gap: 3 }}>
                  {(["sky", "list"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      style={{
                        fontFamily: PIXEL,
                        fontSize: 6.5,
                        padding: "4px 6px",
                        borderRadius: 4,
                        cursor: "pointer",
                        color: view === v ? "#06091a" : "#8fb6ff",
                        background: view === v ? "#8fb6ff" : "rgba(10,16,32,0.7)",
                        border: "1px solid rgba(122,162,247,0.4)",
                      }}
                    >
                      {v.toUpperCase()}
                    </button>
                  ))}
                </span>
              </div>
              {skillBranches.map((b, bi) => {
                const on = focus === b.id;
                return (
                  <button
                    key={b.id}
                    onMouseEnter={() => setFocusId(b.id)}
                    onFocus={() => setFocusId(b.id)}
                    onClick={() => focusBranch(bi, true)}
                    className="font-mono"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: 11,
                      color: on ? "#f4f4fb" : "#aab2d4",
                      background: on ? `${b.color}22` : "transparent",
                      border: `1px solid ${on ? `${b.color}66` : "transparent"}`,
                      transition: "background 0.2s ease, color 0.2s ease",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: b.color,
                        boxShadow: on ? `0 0 8px ${b.color}` : "none",
                        flex: "none",
                      }}
                    />
                    <span style={{ flex: 1, whiteSpace: "nowrap" }}>{b.name}</span>
                    <span style={{ fontSize: 10, color: "#68719c" }}>{b.skills.length}</span>
                  </button>
                );
              })}
              {/* brightness legend */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  marginTop: 8,
                  paddingTop: 9,
                  borderTop: "1px solid rgba(122,162,247,0.16)",
                }}
              >
                {[2, 4, 7].map((r, i) => (
                  <span
                    key={i}
                    style={{
                      width: r * 2,
                      height: r * 2,
                      borderRadius: "50%",
                      background: "#eef2ff",
                      boxShadow: `0 0 ${r * 1.6}px rgba(143,182,255,0.9)`,
                    }}
                  />
                ))}
                <span className="font-mono" style={{ fontSize: 9, color: "#68719c" }}>
                  = more shipped uses
                </span>
              </div>
            </div>
          )}

          {/* proof panel */}
          <div
            style={{
              position: "absolute",
              ...(active
                ? {
                    ...(panelSide === "left" ? { left: RAIL_CLEAR } : { right: 16 }),
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: PANEL_W,
                    minHeight: 240,
                  }
                : { right: 92, bottom: 86, width: 252 }),
              border: "1px solid rgba(122,162,247,0.28)",
              borderRadius: 10,
              background: active ? "rgba(10,16,32,0.9)" : "rgba(10,16,32,0.66)",
              padding: active ? "16px 17px" : "10px 13px",
              opacity: chromeO,
              pointerEvents: interactive && active ? "auto" : "none",
              zIndex: 3,
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
                <Pips skill={active.skill} color={active.branch.color} />
                <p
                  className="font-mono"
                  style={{ fontSize: 11.5, lineHeight: 1.65, color: "#c7cde8", margin: "0 0 12px" }}
                >
                  {active.skill.blurb}
                </p>
                <div style={{ fontFamily: PIXEL, fontSize: 7.5, color: "#8a93bd", marginBottom: 8 }}>
                  PROVEN IN
                </div>
                <Evidence skill={active.skill} color={active.branch.color} />
              </>
            ) : (
              <div
                className="font-mono"
                style={{ fontSize: 10.5, lineHeight: 1.7, color: "#7b83a8", textAlign: "center" }}
              >
                ▸ pick a constellation
                <br />
                every level is backed by
                <br />
                shipped work, not self-rating
              </div>
            )}
          </div>
        </div>
      )}

      {/* languages loadout */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 3,
          background:
            "linear-gradient(to top, rgba(5,8,26,0.9), rgba(5,8,26,0.55) 60%, transparent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 8,
          padding: "26px 20px 20px",
          opacity: chromeO,
          pointerEvents: "none",
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

function Pips({ skill, color }: { skill: Skill; color: string }) {
  const lv = skillLevel(skill);
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 10 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 13,
            height: 9,
            borderRadius: 1,
            background: i < lv ? color : "rgba(255,255,255,0.08)",
            boxShadow: i < lv ? `0 0 6px ${color}88` : "none",
          }}
        />
      ))}
      <span className="font-mono" style={{ fontSize: 10, color: "#68719c", marginLeft: 6 }}>
        LV {lv} · {skill.evidence.length} shipped use{skill.evidence.length > 1 ? "s" : ""}
      </span>
    </div>
  );
}

function Evidence({ skill, color }: { skill: Skill; color: string }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {skill.evidence.map((ev) =>
        ev.projectId ? (
          <a
            key={ev.name}
            href={`#project-${ev.projectId}/detail`}
            className="font-mono"
            style={{
              fontSize: 10.5,
              padding: "5px 10px",
              borderRadius: 6,
              color,
              background: "rgba(122,162,247,0.1)",
              border: `1px solid ${color}55`,
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
  );
}

/** The plain grouped list: same data, fast to scan, what phones get. */
function SkillList() {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        padding: "18px 20px 8px",
        position: "relative",
        zIndex: 2,
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(316px, 1fr))",
          gap: 14,
        }}
      >
        {skillBranches.map((b) => (
          <div
            key={b.id}
            style={{
              border: `1px solid ${b.color}33`,
              borderRadius: 10,
              background: "rgba(10,16,32,0.72)",
              padding: "14px 15px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: b.color,
                  boxShadow: `0 0 8px ${b.color}`,
                }}
              />
              <span style={{ fontFamily: PIXEL, fontSize: 9, color: b.color, letterSpacing: 1 }}>
                {b.name}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {b.skills.map((s) => (
                <div key={s.id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <span className="font-mono" style={{ fontSize: 12, color: "#e2e6f5" }}>
                      {s.name}
                    </span>
                    <span style={{ display: "flex", gap: 3, flex: "none" }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          style={{
                            width: 9,
                            height: 7,
                            borderRadius: 1,
                            background:
                              i < skillLevel(s) ? b.color : "rgba(255,255,255,0.08)",
                          }}
                        />
                      ))}
                    </span>
                  </div>
                  <div
                    className="font-mono"
                    style={{ fontSize: 10.5, color: "#8a93bd", margin: "5px 0 6px", lineHeight: 1.5 }}
                  >
                    {s.blurb}
                  </div>
                  <Evidence skill={s} color={b.color} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
