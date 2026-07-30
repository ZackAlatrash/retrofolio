import { useEffect, useRef, useState } from "react";
import {
  skillBranches,
  languages,
  skillLevel,
  type Skill,
  type SkillBranch,
} from "../content/skills";
import { useReducedMotion } from "../motion/useReducedMotion";
import { useLayoutProfile } from "../game/useLayoutProfile";
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
 * The chrome never fights the sky. The rail and the proof panel hold fixed
 * lanes on either side, and everything that positions itself aims at the band
 * of sky between them (`safeBox`): focusing centres a figure inside it,
 * committing to a star brings that star inside it, and every skill label picks
 * the side of its dot that keeps the text within it. So the constellation you
 * are reading is never parked under a box, and no label is ever cut off by one
 * or by the edge of the screen.
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

/** Proof-panel width: it holds a permanent lane on the right of the sky. */
const PANEL_W = 316;
/** Breathing room between the chrome and the nearest star or label. */
const CHROME_GAP = 22;
/** Skill-label metrics in sky units: the mono face renders 0.602em per char. */
const LABEL_SIZE = 13.5;
const LABEL_CHAR_W = LABEL_SIZE * 0.602;
/** How far a beside-the-star label sits off its dot. */
const LABEL_DX = 18;
/** Constellation-name metrics in sky units: the pixel face plus its tracking. */
const TITLE_CHAR_W = 14;
/** How far above its figure a constellation name sits. */
const TITLE_RISE = 70;
/** Height of the sky chart's track (the whole sky, in miniature). */
const CHART_H = 22;
/** The sky chart sits in the panel's lane, level with the SKY/LIST toggle. */
const CHART_TOP = 68;

/**
 * The sky world, in SVG units. Wider than a viewport: it pans.
 *
 * The figures reach x 1731, and the rest is deliberate margin. The last figure
 * used to sit hard against the world's edge, so at maximum pan its name still
 * fell inside the proof panel's lane and no amount of panning could free it.
 * The scale is set by the viewport's height, not this, so the extra width buys
 * travel room without changing the size or position of anything.
 */
const SKY_W = 2040;
const SKY_H = 740;

type Anchor = "start" | "middle" | "end";

interface RealStar {
  /** The star's own name, so the edges below read like a star atlas. */
  name: string;
  /** Right ascension in hours and declination in degrees (J2000). */
  ra: number;
  dec: number;
  anchor: Anchor;
  dy: number;
}

interface Figure {
  id: string;
  /** The real constellation this branch is drawn as. */
  sky: string;
  /** Ordered brightest-first, so the flagship skill lands on the lead star. */
  stars: RealStar[];
  edges: [string, string][];
  /** Where it sits in the sky world, and the scale of its projection. */
  place: { x: number; y: number; kx: number; ky: number };
}

/**
 * Real constellations, plotted from actual star coordinates: each star's
 * position comes from its right ascension and declination, projected with
 * x running east-to-west (as the sky is drawn) and y with declination. The
 * shapes are therefore the genuine patterns, not decorative approximations.
 * Leo leads, because that is Zack's sign.
 */
const FIGURES: Figure[] = [
  {
    id: "ai",
    sky: "LEO",
    stars: [
      { name: "Regulus", ra: 10.139, dec: 11.967, anchor: "middle", dy: 42 },
      { name: "Algieba", ra: 10.333, dec: 19.841, anchor: "start", dy: 6 },
      { name: "Denebola", ra: 11.818, dec: 14.572, anchor: "end", dy: 6 },
      { name: "Zosma", ra: 11.235, dec: 20.524, anchor: "middle", dy: -26 },
      { name: "Epsilon", ra: 9.764, dec: 23.774, anchor: "start", dy: 6 },
      { name: "Chertan", ra: 11.237, dec: 15.43, anchor: "middle", dy: 42 },
      { name: "Zeta", ra: 10.278, dec: 23.417, anchor: "middle", dy: -26 },
      { name: "Mu", ra: 9.879, dec: 26.007, anchor: "middle", dy: -26 },
    ],
    // the sickle (the lion's head), then the triangle of its hindquarters
    edges: [
      ["Epsilon", "Mu"],
      ["Mu", "Zeta"],
      ["Zeta", "Algieba"],
      ["Algieba", "Regulus"],
      ["Regulus", "Chertan"],
      ["Chertan", "Denebola"],
      ["Denebola", "Zosma"],
      ["Zosma", "Chertan"],
      ["Zosma", "Algieba"],
    ],
    place: { x: 120, y: 170, kx: 280, ky: 20 },
  },
  {
    id: "arch",
    sky: "LYRA",
    stars: [
      { name: "Vega", ra: 18.615, dec: 38.784, anchor: "start", dy: 6 },
      { name: "Sulafat", ra: 18.982, dec: 32.69, anchor: "end", dy: 6 },
      { name: "Sheliak", ra: 18.834, dec: 33.363, anchor: "middle", dy: 42 },
      { name: "Delta", ra: 18.898, dec: 36.899, anchor: "end", dy: 6 },
      { name: "Zeta", ra: 18.746, dec: 37.605, anchor: "start", dy: 6 },
      { name: "Epsilon", ra: 18.739, dec: 39.67, anchor: "middle", dy: -26 },
    ],
    // Vega above the little parallelogram of the harp
    edges: [
      ["Vega", "Epsilon"],
      ["Vega", "Zeta"],
      ["Zeta", "Delta"],
      ["Delta", "Sulafat"],
      ["Sulafat", "Sheliak"],
      ["Sheliak", "Zeta"],
    ],
    place: { x: 900, y: 160, kx: 339, ky: 28 },
  },
  {
    id: "testing",
    sky: "CRUX",
    stars: [
      { name: "Acrux", ra: 12.443, dec: -63.099, anchor: "middle", dy: 42 },
      { name: "Mimosa", ra: 12.795, dec: -59.689, anchor: "end", dy: 6 },
      { name: "Gacrux", ra: 12.519, dec: -57.113, anchor: "middle", dy: -26 },
      { name: "Delta", ra: 12.253, dec: -58.749, anchor: "start", dy: 6 },
    ],
    // the two crossing arms of the Southern Cross
    edges: [
      ["Gacrux", "Acrux"],
      ["Mimosa", "Delta"],
    ],
    place: { x: 1330, y: 170, kx: 264, ky: 35 },
  },
  {
    id: "cloud",
    sky: "CORVUS",
    stars: [
      { name: "Gienah", ra: 12.263, dec: -17.542, anchor: "start", dy: 6 },
      { name: "Kraz", ra: 12.573, dec: -23.397, anchor: "end", dy: 6 },
      { name: "Algorab", ra: 12.498, dec: -16.515, anchor: "middle", dy: -26 },
      { name: "Minkar", ra: 12.168, dec: -22.62, anchor: "start", dy: 6 },
    ],
    // the crow's quadrilateral sail
    edges: [
      ["Algorab", "Gienah"],
      ["Gienah", "Minkar"],
      ["Minkar", "Kraz"],
      ["Kraz", "Algorab"],
    ],
    place: { x: 1050, y: 480, kx: 352, ky: 25 },
  },
  {
    id: "backend",
    sky: "URSA MAJOR",
    stars: [
      { name: "Alioth", ra: 12.9, dec: 55.96, anchor: "end", dy: 6 },
      { name: "Dubhe", ra: 11.062, dec: 61.751, anchor: "middle", dy: -26 },
      { name: "Alkaid", ra: 13.792, dec: 49.313, anchor: "end", dy: 6 },
      { name: "Mizar", ra: 13.399, dec: 54.925, anchor: "middle", dy: 42 },
      { name: "Merak", ra: 11.031, dec: 56.382, anchor: "start", dy: 6 },
      { name: "Phecda", ra: 11.897, dec: 53.695, anchor: "middle", dy: 42 },
      { name: "Megrez", ra: 12.257, dec: 57.033, anchor: "middle", dy: -26 },
    ],
    // the Plough: the bowl, then the handle
    edges: [
      ["Dubhe", "Merak"],
      ["Merak", "Phecda"],
      ["Phecda", "Megrez"],
      ["Megrez", "Dubhe"],
      ["Megrez", "Alioth"],
      ["Alioth", "Mizar"],
      ["Mizar", "Alkaid"],
    ],
    place: { x: 280, y: 540, kx: 103, ky: 12 },
  },
  {
    id: "frontend",
    sky: "CANCER",
    stars: [
      { name: "Altarf", ra: 8.275, dec: 9.186, anchor: "middle", dy: 42 },
      { name: "Delta", ra: 8.745, dec: 18.154, anchor: "end", dy: 6 },
      { name: "Iota", ra: 8.777, dec: 28.76, anchor: "middle", dy: -26 },
      { name: "Acubens", ra: 8.975, dec: 11.858, anchor: "end", dy: 6 },
      { name: "Gamma", ra: 8.721, dec: 21.469, anchor: "start", dy: 6 },
      { name: "Zeta", ra: 8.204, dec: 17.648, anchor: "middle", dy: -26 },
    ],
    // the crab: the inverted Y, with the two Asses either side of the Manger
    edges: [
      ["Iota", "Gamma"],
      ["Gamma", "Delta"],
      ["Delta", "Acubens"],
      ["Delta", "Altarf"],
      ["Delta", "Zeta"],
    ],
    place: { x: 1500, y: 400, kx: 300, ky: 13 },
  },
];

/** Project a figure's stars from sky coordinates into the sky world. */
const PLOTTED = FIGURES.map((fig) => {
  const maxRa = Math.max(...fig.stars.map((s) => s.ra));
  const maxDec = Math.max(...fig.stars.map((s) => s.dec));
  const at = new Map<string, { x: number; y: number }>();
  const points = fig.stars.map((s) => {
    const p = {
      x: fig.place.x + (maxRa - s.ra) * fig.place.kx,
      y: fig.place.y + (maxDec - s.dec) * fig.place.ky,
    };
    at.set(s.name, p);
    return { ...s, ...p };
  });
  const lines = fig.edges.map(([a, b]) => ({ a: at.get(a)!, b: at.get(b)! }));
  return { fig, points, lines };
});

const POLE = { x: 200, y: 105 };

/** Each figure's box, so titles bind to their own stars and panning centres. */
const BOXES = PLOTTED.map(({ points }) => {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
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
  /** The real star this skill sits on. */
  star: string;
}

const STARS: StarPos[] = [];
skillBranches.forEach((branch, bi) => {
  const { points } = PLOTTED[bi];
  branch.skills.forEach((skill, si) => {
    const p = points[si] ?? points[points.length - 1];
    STARS.push({ branch, bi, skill, x: p.x, y: p.y, anchor: p.anchor, dy: p.dy, star: p.name });
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
  const [chosenView, setView] = useState<"sky" | "list">("sky");
  const { portrait } = useLayoutProfile();
  /**
   * A phone gets the list and nothing else.
   *
   * The sky is scaled to the frame height, so on a tall narrow viewport it
   * renders about six screens wide: legible only because it is enormous, and
   * enormous means hunting across it to read a skill. Shrinking it to two
   * screens of travel puts the labels at roughly 4px. There is no scale that is
   * both readable and traversable at this width, so the sky stays as the thing
   * the constellation reveal shows, and the list carries the content.
   */
  const listOnly = portrait;
  const view = listOnly ? "list" : chosenView;
  const active = interactive ? sel : null;
  const focus = interactive ? focusId : null;

  // ---- panning ----
  // Deliberately NOT a native scroll container: a scrollable element lets the
  // trackpad's horizontal gesture reach the browser and fire back/forward
  // navigation (overscroll-behavior does not reliably stop it). The sky is a
  // plain transformed layer instead, so the browser has nothing to hijack; we
  // handle wheel, drag and keys ourselves and let vertical wheel fall through
  // to the page.
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartDragRef = useRef(false);
  const panRef = useRef(0);
  const maxPanRef = useRef(0);
  const dragRef = useRef<{ startX: number; startPan: number; moved: boolean } | null>(null);
  const [skyW, setSkyW] = useState(0);
  const [pan, setPan] = useState({ left: false, right: true });
  /** Mirrors panRef for rendering: label sides are chosen from screen position. */
  const [panX, setPanX] = useState(0);
  /** Measured, because the rail is only as wide as the longest branch name. */
  const [railW, setRailW] = useState(0);
  /** The visible slice of sky, for the chart's window. */
  const [vpW, setVpW] = useState(0);

  /** Move the sky. Clamped to its own bounds, so it can never overscroll. */
  const applyPan = (x: number, animate = false) => {
    const world = worldRef.current;
    if (!world) return;
    const next = clamp(x, 0, maxPanRef.current);
    panRef.current = next;
    world.style.transition =
      animate && !reduced ? "transform 0.55s cubic-bezier(0.23,1,0.32,1)" : "none";
    world.style.transform = `translateX(${-next}px)`;
    setPan({ left: next > 6, right: next < maxPanRef.current - 6 });
    setPanX(next);
  };

  /**
   * The band of sky that no chrome covers: the navigator rail holds a lane on
   * the left, the proof panel one on the right. Focusing, selecting and label
   * placement all aim inside this band, so the constellation you are reading
   * never comes to rest under a box and no label runs off the screen.
   */
  const safeBox = () => {
    const w = viewportRef.current?.clientWidth ?? 0;
    const full = { left: 0, right: w };
    if (!interactive || !w) return full;
    const box = { left: 16 + railW + CHROME_GAP, right: w - (16 + PANEL_W + CHROME_GAP) };
    if (box.right - box.left >= w * 0.42) return box;
    // Too narrow for both lanes. Give the rail's back first: it sits high and
    // out of the way, while the panel is the box that lands over the middle of
    // the sky. Below even that, keep the full width rather than squeezing the
    // sky into a slot; the mobile pass gives the chrome a different home.
    const panelOnly = { left: 0, right: box.right };
    return panelOnly.right >= w * 0.42 ? panelOnly : full;
  };

  /**
   * Which side of its star a label sits on. The side it was designed with wins
   * whenever it fits; otherwise the label flips rather than sliding under the
   * chrome or off the edge of the screen.
   */
  const anchorFor = (n: StarPos, scale: number, safe: { left: number; right: number }): Anchor => {
    if (!scale) return n.anchor;
    const sx = n.x * scale - panX;
    const w = n.skill.name.length * LABEL_CHAR_W * scale;
    const off = LABEL_DX * scale;
    const fits: Record<Anchor, boolean> = {
      start: sx + off + w <= safe.right,
      end: sx - off - w >= safe.left,
      middle: sx - w / 2 >= safe.left && sx + w / 2 <= safe.right,
    };
    if (fits[n.anchor]) return n.anchor;
    const order: Anchor[] =
      n.anchor === "start"
        ? ["end", "middle"]
        : n.anchor === "end"
          ? ["start", "middle"]
          : sx > (safe.left + safe.right) / 2
            ? ["end", "start"]
            : ["start", "end"];
    return order.find((a) => fits[a]) ?? n.anchor;
  };

  /** A star's horizontal reach, halo plus label, in world pixels. */
  const extentOf = (n: StarPos, scale: number, anchor: Anchor) => {
    const cx = n.x * scale;
    const halo = (12 + skillLevel(n.skill) * 5.6) * scale;
    const w = n.skill.name.length * LABEL_CHAR_W * scale;
    const off = LABEL_DX * scale;
    const label =
      anchor === "start"
        ? { left: cx + off, right: cx + off + w }
        : anchor === "end"
          ? { left: cx - off - w, right: cx - off }
          : { left: cx - w / 2, right: cx + w / 2 };
    return { left: Math.min(cx - halo, label.left), right: Math.max(cx + halo, label.right) };
  };

  /** Size the sky to the frame height and keep the pan inside its bounds. */
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const measure = () => {
      const w = Math.max(vp.clientWidth, vp.clientHeight * (SKY_W / SKY_H));
      setSkyW(w);
      setVpW(vp.clientWidth);
      setRailW(railRef.current?.offsetWidth ?? 0);
      maxPanRef.current = Math.max(0, w - vp.clientWidth);
      applyPan(interactive ? panRef.current : maxPanRef.current / 2);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, view]);

  /** Trackpad / wheel: horizontal pans the sky, vertical scrolls the page. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !interactive) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // let the page have it
      e.preventDefault(); // and never let the browser read it as back/forward
      applyPan(panRef.current + e.deltaX);
    };
    // On the root, so a horizontal swipe anywhere on this screen (over the
    // rail or the proof panel too) is consumed rather than reaching the browser.
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  /**
   * The boxes the chrome occupies, in viewport pixels. Not full-height
   * columns: there is usable sky above and below each one.
   */
  const chromeRects = () => {
    const vp = viewportRef.current;
    if (!vp || !interactive) return [];
    const w = vp.clientWidth;
    const h = vp.clientHeight;
    const midY = h / 2;
    const rects = [
      // The panel's height follows its skill, so reserve a typical card rather
      // than measuring whichever one happens to be open.
      { left: w - 16 - PANEL_W, right: w - 16, top: midY - 190, bottom: midY + 190 },
      // The sky chart shares the panel's lane, above it.
      { left: w - 16 - PANEL_W, right: w - 16, top: CHART_TOP, bottom: CHART_TOP + 62 },
      // The two travel arrows.
      { left: 10, right: 44, top: h * 0.78 - 23, bottom: h * 0.78 + 23 },
      { left: w - 44, right: w - 10, top: h * 0.78 - 23, bottom: h * 0.78 + 23 },
    ];
    const rail = railRef.current;
    if (rail) {
      const base = vp.getBoundingClientRect();
      const r = rail.getBoundingClientRect();
      rects.push({
        left: r.left - base.left,
        right: r.right - base.left,
        top: r.top - base.top,
        bottom: r.bottom - base.top,
      });
    }
    return rects;
  };

  /**
   * How many of a figure's stars a given pan would leave unreachable: behind a
   * box, or pushed off the screen. One is no better than the other, so both
   * count.
   */
  const starLost = (
    n: StarPos,
    pan: number,
    scale: number,
    rects: { left: number; right: number; top: number; bottom: number }[],
    vw: number,
  ) => {
    const x = n.x * scale - clamp(pan, 0, maxPanRef.current);
    const y = n.y * scale;
    if (x < 34 || x > vw - 34) return true;
    return rects.some(
      (r) => x >= r.left - 16 && x <= r.right + 16 && y >= r.top - 16 && y <= r.bottom + 16,
    );
  };

  const lostFor = (bi: number, pan: number, scale: number) => {
    const rects = chromeRects();
    const vw = viewportRef.current?.clientWidth ?? 0;
    const stars = STARS.filter((n) => n.bi === bi && starLost(n, pan, scale, rects, vw)).length;
    // The figure's name is part of the figure. It is wide and it sits high, so
    // it is the piece most likely to slide under the sky chart.
    const box = BOXES[bi];
    const half = ((skillBranches[bi].name.length * TITLE_CHAR_W) / 2) * scale;
    const cx = box.cx * scale - clamp(pan, 0, maxPanRef.current);
    const ty = (box.top - TITLE_RISE) * scale;
    const nameHidden = rects.some(
      (r) =>
        cx + half >= r.left - 8 &&
        cx - half <= r.right + 8 &&
        ty >= r.top - 18 &&
        ty <= r.bottom + 6,
    );
    return stars + (nameHidden ? 1 : 0);
  };

  /**
   * Pan the sky so a figure sits in the middle of the uncovered band.
   *
   * A figure wider than that band cannot fit inside it, so on paper a star has
   * to pass behind the chrome. In practice it usually does not have to: the
   * boxes leave sky above and below them, so nudging the sky a little drops
   * the overhanging star into a gap. Try a few offsets around the centred
   * position and keep whichever leaves the fewest stars covered, preferring
   * the centred one when they tie.
   */
  const panToFigure = (bi: number) => {
    if (!skyW) return;
    const scale = skyW / SKY_W;
    const safe = safeBox();
    const base = BOXES[bi].cx * scale - (safe.left + safe.right) / 2;
    let best = base;
    let bestScore = lostFor(bi, base, scale);
    // Small steps: the gap that clears every star can be only a few dozen
    // pixels wide, and a coarse search steps straight over it.
    for (let off = 20; off <= 300 && bestScore > 0; off += 20) {
      for (const candidate of [base - off, base + off]) {
        const score = lostFor(bi, candidate, scale);
        if (score < bestScore) {
          bestScore = score;
          best = candidate;
        }
      }
    }
    applyPan(best, true);
  };

  const focusBranch = (bi: number, alsoPan: boolean) => {
    const id = skillBranches[bi].id;
    setFocusId(id);
    // Moving to another constellation makes the open card a leftover from a
    // figure that is no longer on screen, contradicting the focus.
    if (sel && sel.branch.id !== id) setSel(null);
    if (alsoPan) panToFigure(bi);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive || e.button !== 0) return;
    dragRef.current = { startX: e.clientX, startPan: panRef.current, moved: false };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 6) d.moved = true;
    applyPan(d.startPan - dx);
  };
  const endDrag = () => {
    // Cleared next tick so the click that follows a drag is ignored.
    window.setTimeout(() => {
      dragRef.current = null;
    }, 0);
  };
  const wasDrag = () => dragRef.current?.moved ?? false;

  /** Travel to wherever the chart was touched, centring that slice of sky. */
  const chartTo = (clientX: number, animate: boolean) => {
    const el = chartRef.current;
    if (!el || !skyW) return;
    const r = el.getBoundingClientRect();
    const frac = clamp((clientX - r.left) / r.width, 0, 1);
    applyPan(frac * skyW - vpW / 2, animate);
  };

  const onChartDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    chartDragRef.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    chartTo(e.clientX, true);
  };
  const onChartMove = (e: React.PointerEvent) => {
    if (chartDragRef.current) chartTo(e.clientX, false);
  };
  const endChartDrag = () => {
    chartDragRef.current = false;
  };

  /** One press of an edge arrow travels most of a screen. */
  const stepSky = (dir: -1 | 1) => applyPan(panRef.current + dir * vpW * 0.72, true);

  /** Arrow keys nudge the sky when it has focus. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!interactive) return;
    const step = viewportRef.current ? viewportRef.current.clientWidth * 0.6 : 400;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      applyPan(panRef.current + step, true);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      applyPan(panRef.current - step, true);
    }
  };

  /**
   * Select a star. Committing to one (a click, or arriving by keyboard) also
   * brings it inside the uncovered band, so the star being described is never
   * behind the panel that describes it. Hovering deliberately does not pan:
   * the sky sliding under a moving cursor is disorienting, and a star you can
   * hover is a star you can already see.
   */
  const selectStar = (n: StarPos, alsoPan = false) => {
    setFocusId(n.branch.id);
    setSel(n);
    if (!alsoPan || !skyW) return;
    const scale = skyW / SKY_W;
    const safe = safeBox();
    const ext = extentOf(n, scale, anchorFor(n, scale, safe));
    const room = safe.right - safe.left;
    let next = panRef.current;
    if (ext.right - ext.left > room) {
      // A label longer than the band cannot fit whole: keep the dot itself
      // comfortably inside and let the text run past the edge of the band.
      const cx = n.x * scale;
      next = clamp(next, cx - safe.right + 40, cx - safe.left - 40);
    } else if (ext.left - next < safe.left) {
      next = ext.left - safe.left;
    } else if (ext.right - next > safe.right) {
      next = ext.right - safe.right;
    }
    // Pulling one star into the band can push its neighbours behind the
    // chrome. Nudge a little further when that frees more of the figure, so
    // long as the star being described stays inside the band itself.
    const rects = chromeRects();
    const vw = viewportRef.current?.clientWidth ?? 0;
    let best = next;
    let bestLost = lostFor(n.bi, next, scale);
    for (let step = 20; step <= 140 && bestLost > 0; step += 20) {
      for (const candidate of [next + step, next - step]) {
        // The star being described has to stay reachable itself. Test that the
        // same way everything else is tested: comparing its centre against the
        // band's edge would turn on a rounding error, since `next` was derived
        // from the star's outer extent rather than its centre.
        if (starLost(n, candidate, scale, rects, vw)) continue;
        const score = lostFor(n.bi, candidate, scale);
        if (score < bestLost) {
          bestLost = score;
          best = candidate;
        }
      }
    }
    if (Math.abs(best - panRef.current) > 1) applyPan(best, true);
  };

  /** Sky units to screen pixels, and the band the chrome leaves uncovered. */
  const scale = skyW ? skyW / SKY_W : 0;
  const safe = safeBox();

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
      ref={rootRef}
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
      {/* a soft scrim so the badge (and the HUD above it) stay readable
          wherever the milky way happens to sit */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 150,
          zIndex: 3,
          pointerEvents: "none",
          background:
            "linear-gradient(to bottom, rgba(5,8,26,0.88), rgba(5,8,26,0.5) 55%, transparent)",
          opacity: chromeO,
        }}
      />

      {/* what screen this is: the same stage badge the library screen wears.
          On a phone it scrolls with the list instead of floating over it: the
          subtitle wraps to three lines at that width, which both collides with
          the list and spends height a phone does not have. */}
      {!listOnly && (
        <div
          style={{
            position: "absolute",
            top: 66,
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 4,
            opacity: chromeO,
            pointerEvents: "none",
          }}
        >
          <StageBadge />
        </div>
      )}

      {/* view switch: outside both views, so there is always a way back.
          Nothing to switch to on a phone, where the sky is not offered. */}
      {interactive && !listOnly && (
        <div
          style={{
            position: "absolute",
            top: 68,
            left: 16,
            zIndex: 5,
            display: "flex",
            gap: 4,
            padding: 5,
            borderRadius: 8,
            border: "1px solid rgba(122,162,247,0.22)",
            background: "rgba(8,13,28,0.82)",
            opacity: chromeO,
          }}
        >
          {(["sky", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              style={{
                fontFamily: PIXEL,
                fontSize: 7.5,
                padding: "6px 9px",
                borderRadius: 5,
                cursor: "pointer",
                color: view === v ? "#06091a" : "#8fb6ff",
                background: view === v ? "#8fb6ff" : "transparent",
                border: "1px solid rgba(122,162,247,0.35)",
              }}
            >
              {v === "sky" ? "◈ SKY" : "☰ LIST"}
            </button>
          ))}
        </div>
      )}

      {view === "list" && interactive ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflowY: "auto",
            // With the badge and the languages in the flow there is nothing
            // floating to leave room for. The old bottom inset was sized for a
            // 74px languages bar, which is 145px tall on a phone.
            padding: listOnly ? "16px 0 28px" : "78px 0 74px",
            zIndex: 2,
          }}
        >
          {listOnly && (
            <div style={{ textAlign: "center", padding: "0 18px 14px" }}>
              <StageBadge />
            </div>
          )}
          <SkillList />
          {listOnly && <LanguagesRow flow />}
        </div>
      ) : (
        <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
          <div
            ref={viewportRef}
            tabIndex={interactive ? 0 : -1}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              // vertical gestures still belong to the page
              touchAction: "pan-y",
              outline: "none",
              cursor: interactive ? "grab" : "default",
            }}
          >
            <div
              ref={worldRef}
              style={{ height: "100%", width: skyW || "100%", willChange: "transform" }}
            >
            <svg
              viewBox={`0 0 ${SKY_W} ${SKY_H}`}
              style={{ height: "100%", width: "100%", display: "block" }}
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
              {PLOTTED.map(({ fig, lines }, bi) => {
                const branch = skillBranches[bi];
                return lines.map((ln, ei) => {
                  const lineP = smooth(
                    reveal,
                    0.14 + bi * 0.05 + ei * 0.03,
                    0.42 + bi * 0.05 + ei * 0.03,
                  );
                  return (
                    <line
                      key={`${fig.id}-${ei}`}
                      x1={ln.a.x}
                      y1={ln.a.y}
                      x2={ln.b.x}
                      y2={ln.b.y}
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
                      {fig.sky} · {branch.skills.length} abilities
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
                const anchor = anchorFor(n, scale, safe);
                const dx = anchor === "start" ? LABEL_DX : anchor === "end" ? -LABEL_DX : 0;
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
                    onFocus={() => interactive && selectStar(n, true)}
                    onClick={() => interactive && !wasDrag() && selectStar(n, true)}
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
                      textAnchor={anchor}
                      className="font-mono"
                      style={{
                        fontSize: LABEL_SIZE,
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
          </div>

          {/*
            Travel controls. Less than half the sky fits on screen at once, so
            without these a visitor has no way of knowing that four of the six
            constellations are simply out of frame.

            Both are aria-hidden on purpose: they are a mouse convenience, and
            the accessible route to the same places already exists in the
            navigator rail (which pans to a figure) and the arrow keys.
          */}
          {interactive &&
            ([
              ["left", pan.left],
              ["right", pan.right],
            ] as const).map(([side, on]) => (
              <button
                key={side}
                aria-hidden="true"
                tabIndex={-1}
                onClick={() => stepSky(side === "left" ? -1 : 1)}
                className={reduced ? undefined : `pan-arrow-${side}`}
                style={{
                  position: "absolute",
                  [side]: 10,
                  // Below the proof panel, which owns the vertical middle of
                  // this edge, and above the languages row.
                  top: "78%",
                  // The bob animation carries this too; it is here so the
                  // reduced-motion arrow (which has no animation) still sits
                  // centred on its anchor.
                  transform: "translateY(-50%)",
                  width: 34,
                  height: 46,
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: PIXEL,
                  fontSize: 13,
                  color: "#bcd2ff",
                  border: "1px solid rgba(122,162,247,0.3)",
                  background: "rgba(8,13,28,0.62)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  cursor: "pointer",
                  opacity: chromeO * (on ? 1 : 0),
                  pointerEvents: on ? "auto" : "none",
                  transition: "opacity 0.25s ease",
                  zIndex: 3,
                }}
              >
                {side === "left" ? "◄" : "►"}
              </button>
            ))}

          {/* the sky chart: the whole sky, and where in it you are */}
          {interactive && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                right: 16,
                top: CHART_TOP,
                width: PANEL_W,
                padding: "8px 10px 9px",
                borderRadius: 9,
                border: "1px solid rgba(122,162,247,0.22)",
                background: "rgba(8,13,28,0.72)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                opacity: chromeO,
                zIndex: 3,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontFamily: PIXEL, fontSize: 7, color: "#68719c", letterSpacing: 1 }}>
                  SKY CHART
                </span>
                <span className="font-mono" style={{ fontSize: 9, color: "#8fb6ff" }}>
                  ◄ drag to explore ►
                </span>
              </div>
              <div
                ref={chartRef}
                onPointerDown={onChartDown}
                onPointerMove={onChartMove}
                onPointerUp={endChartDrag}
                onPointerCancel={endChartDrag}
                style={{
                  position: "relative",
                  height: CHART_H,
                  borderRadius: 5,
                  background: "rgba(143,182,255,0.07)",
                  border: "1px solid rgba(122,162,247,0.18)",
                  cursor: "pointer",
                  touchAction: "none",
                  overflow: "hidden",
                }}
              >
                {BOXES.map((b, i) => (
                  <span
                    key={skillBranches[i].id}
                    style={{
                      position: "absolute",
                      left: `${(b.cx / SKY_W) * 100}%`,
                      top: "50%",
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: skillBranches[i].color,
                      boxShadow: `0 0 6px ${skillBranches[i].color}`,
                      opacity: focus === skillBranches[i].id ? 1 : 0.72,
                      transform: "translate(-50%, -50%)",
                      transition: "opacity 0.25s ease",
                    }}
                  />
                ))}
                {/* where you are looking */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: skyW ? `${(panX / skyW) * 100}%` : 0,
                    width: skyW ? `${(vpW / skyW) * 100}%` : "100%",
                    borderRadius: 3,
                    border: "1px solid rgba(238,242,255,0.7)",
                    background: "rgba(238,242,255,0.1)",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
          )}

          {/* navigator rail: the way in */}
          {interactive && (
            <div
              ref={railRef}
              onMouseLeave={() => {
                setFocusId(null);
                setSel(null);
              }}
              style={{
                position: "absolute",
                left: 16,
                // Tucked under the SKY/LIST toggle rather than centred. Centred
                // put it exactly where the constellations live, and the widest
                // figure has nowhere to go that clears a box in the middle of
                // the left edge; up here every figure has a clean resting spot,
                // and the two controls read as one group.
                top: 118,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                padding: "12px 12px",
                borderRadius: 10,
                border: "1px solid rgba(122,162,247,0.22)",
                // Frosted, not opaque: a figure too wide for the uncovered
                // band still reads as sky behind the chrome instead of ending
                // at a hard edge.
                background: "rgba(8,13,28,0.72)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                opacity: chromeO,
                zIndex: 3,
              }}
            >
              <div
                style={{
                  fontFamily: PIXEL,
                  fontSize: 7,
                  color: "#68719c",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                CONSTELLATIONS
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
              // Always the same lane, never flipped: a card that jumps sides
              // as you browse is harder to read than one you can look back to.
              ...(active
                ? {
                    right: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: PANEL_W,
                    minHeight: 240,
                  }
                : { right: 92, bottom: 86, width: 252 }),
              border: "1px solid rgba(122,162,247,0.28)",
              borderRadius: 10,
              background: active ? "rgba(10,16,32,0.82)" : "rgba(10,16,32,0.6)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              padding: active ? "16px 17px" : "10px 13px",
              opacity: chromeO * (active || !focus ? 1 : 0),
              pointerEvents: interactive && active ? "auto" : "none",
              transition: "opacity 0.2s ease",
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
                    margin: "10px 0 6px",
                    lineHeight: 1.5,
                  }}
                >
                  {active.skill.name}
                </div>
                <div
                  className="font-mono"
                  style={{ fontSize: 9.5, color: "#68719c", marginBottom: 9 }}
                >
                  ✦ {active.star}
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

      {/* languages loadout. It is content, not chrome, so on a phone it goes in
          the list's flow: as a fixed bottom bar it grew from 74px to 145px and
          printed straight over the skills it was meant to sit beneath. */}
      {!listOnly && <LanguagesRow opacity={chromeO} />}

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
/** The stage badge, so it can float over the sky or sit in the list's flow. */
function StageBadge() {
  return (
    <>
      <div
        className="font-mono"
        style={{ fontSize: 10.5, letterSpacing: 2, color: "var(--term-green)" }}
      >
        {"// STAGE 03 · SKILL CONSTELLATIONS"}
      </div>
      <div
        className="font-mono"
        style={{ fontSize: 10, letterSpacing: 0.6, color: "#9ba4ca", marginTop: 4 }}
      >
        every star is a skill · the brighter it burns, the more I have shipped with it
      </div>
    </>
  );
}

/** Same two ways round: a bar across the bottom of the sky, or the end of the list. */
function LanguagesRow({ opacity, flow }: { opacity?: number; flow?: boolean }) {
  return (
    <div
      style={{
        ...(flow
          ? { margin: "16px auto 0", maxWidth: 1080 }
          : {
              position: "absolute" as const,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 3,
              background:
                "linear-gradient(to top, rgba(5,8,26,0.9), rgba(5,8,26,0.55) 60%, transparent)",
              opacity,
              pointerEvents: "none" as const,
            }),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 8,
        padding: flow ? "0 20px" : "26px 20px 20px",
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
  );
}

function SkillList() {
  return (
    <div
      style={{
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
          // min() or the 316px floor overflows a 320px phone by 36px.
          gridTemplateColumns: "repeat(auto-fit, minmax(min(316px, 100%), 1fr))",
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
