import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useReducedMotion } from "../motion/useReducedMotion";
import { FRAME_COUNT, frameUrl, posterUrl } from "../hero/useHeroScrub";
import { DecodeText } from "../hero/DecodeText";
import { useSettings, pick, type Lang } from "../game/settings";
import { Cartridge } from "../showcase/Cartridge";
import {
  showcase,
  labelUrl,
  tvUrl,
  consoleUrl,
  roomUrl,
  lapUrl,
  LAP_SCREEN,
} from "../showcase/showcaseData";
import {
  CONTAINER_VH,
  SCRUB_VH,
  PULL_VH,
  REST_VH,
  ABOUT_VH,
  S1,
  S2,
  S3,
  S4,
  clamp01,
  smooth,
} from "../showcase/sequence";
import { AboutCard } from "./AboutCard";
import { SkillsPage } from "./SkillsPage";
import { DetailOverlay, SplashCard } from "../showcase/DetailOverlay";
import {
  IDLE_FLOW,
  SEAT,
  SLOT,
  easePop,
  tween,
  type FlowState,
} from "../showcase/bootFlow";
import { shellUrl, type ShowcaseEntry } from "../showcase/showcaseData";

const PIXEL = '"Press Start 2P", ui-monospace, monospace';

/** Cartridge aspect (shell sources are 716x592). */
const CART_AR = 592 / 716;

/** Shell + label markup shared by the flight clones and the seated cart. */
const cartMarkup = (e: ShowcaseEntry) =>
  `<img src="${shellUrl(e.shell)}" style="position:absolute;inset:0;width:100%;height:100%;" alt=""/>` +
  `<img src="${labelUrl(e.id)}" style="position:absolute;left:16.2%;top:23.7%;width:63.9%;height:46%;object-fit:cover;border-radius:2px;" alt=""/>`;

// --- the pixel television (public/game/tv.webp, 734x598 source) ---
const TV_AR = 598 / 734; // height / width
const GLASS = { left: 8.72, top: 10.2, width: 82.15, height: 75.08 };

const TAGLINE = {
  en: "Grounded AI, shipped to production.",
  nl: "Gefundeerde AI, in productie gebracht.",
};
const FOOTER = {
  en: "© 2026 · HAARLEM, NL · AVAILABLE SUMMER 2026",
  nl: "© 2026 · HAARLEM · BESCHIKBAAR VANAF ZOMER 2026",
};
const SUBTITLE = {
  en: "every cartridge is a real project I built and shipped",
  nl: "elke cartridge is een echt project dat ik heb gebouwd en opgeleverd",
};

function useViewport() {
  const [size, setSize] = useState(() => ({
    w: typeof window === "undefined" ? 1280 : window.innerWidth,
    h: typeof window === "undefined" ? 720 : window.innerHeight,
  }));
  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return size;
}

/**
 * The fused Title -> Game Library sequence with a full CRT power-cycle
 * transition (option A):
 *   scrub - the approved full-screen hero video, untouched
 *   pull  - the picture dies like a real CRT (vertical collapse into a blazing
 *           scanline -> the line shrinks to a dot -> phosphor ember), the room
 *           emerges in darkness with the TV on standby, then the room TV powers
 *           ON (dot -> line -> the picture opens, flash, a breath of static)
 *           into the library boot card while the station settles in
 *   rest  - the station holds for browsing
 */
export function TitleLibrary() {
  const { lang } = useSettings();
  const prefersReduced = useReducedMotion();
  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const forceMotion = params.has("motion");
  const forcedSeq = params.get("seq");
  const reduced = prefersReduced && !forceMotion;

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [p, setP] = useState(forcedSeq != null ? parseFloat(forcedSeq) : 0);
  const { w: W, h: H } = useViewport();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const entry = selectedId
    ? showcase.find((e) => e.id === selectedId) ?? null
    : null;

  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (reduced) return;
    const id = window.setTimeout(() => setArmed(true), 900);
    return () => window.clearTimeout(id);
  }, [reduced]);

  // ---- cartridge boot flow (insert -> splash -> dive -> detail -> eject) ----
  const [flow, setFlow] = useState<FlowState>(IDLE_FLOW);
  // While a cartridge is in, it stays visibly seated in the console slot.
  const [seated, setSeated] = useState(false);
  const seatCloneRef = useRef<HTMLElement | null>(null);
  const visitedRef = useRef<Set<string>>(new Set());
  const worldRef = useRef<HTMLDivElement>(null);
  // The lap scene (handheld in hands) and its screen: the About camera tilts
  // down to the lap layer, then pushes into this exact screen rect.
  const lapLayerRef = useRef<HTMLDivElement>(null);
  const lapScreenRef = useRef<HTMLDivElement>(null);
  const aboutBaseRef = useRef<{
    key: string;
    cx: number;
    cy: number;
    scale: number;
  } | null>(null);
  // Bumped when the handheld art loads, so the camera re-measures its screen
  // (a first measurement before load would size it at zero).
  const [assetTick, setAssetTick] = useState(0);
  // The card is shown inside a pinned viewport, so scale it to always fit.
  const cardWrapRef = useRef<HTMLDivElement>(null);
  const [cardScale, setCardScale] = useState(1);
  useEffect(() => {
    const el = cardWrapRef.current;
    if (!el) return;
    const fit = () => {
      const avail = window.innerHeight - 96;
      const h = el.scrollHeight;
      setCardScale(h > avail ? Math.max(0.55, avail / h) : 1);
    };
    fit();
    const id = window.setTimeout(fit, 600); // after webfonts settle
    window.addEventListener("resize", fit);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", fit);
    };
  }, []);
  const stageRef = useRef<HTMLDivElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const consoleBoxRef = useRef<HTMLDivElement>(null);
  const slotGlowRef = useRef<HTMLDivElement>(null);
  const greenLedRef = useRef<HTMLDivElement>(null);
  const lastCartRef = useRef<HTMLElement | null>(null);
  const flowRef = useRef<FlowState>(IDLE_FLOW);
  flowRef.current = flow;
  // Phase transitions go through this so the guard ref updates synchronously
  // (two clicks in one tick must not both pass the shelf check).
  const applyFlow = (f: FlowState) => {
    flowRef.current = f;
    setFlow(f);
  };
  const bootEntry = flow.bootId
    ? showcase.find((e) => e.id === flow.bootId) ?? null
    : null;

  const lockScroll = (on: boolean) => {
    document.documentElement.style.overflow = on ? "hidden" : "";
  };
  useEffect(() => () => lockScroll(false), []);

  // Once the seated cart has rendered, the insertion clone can leave.
  useEffect(() => {
    if (seated && seatCloneRef.current) {
      seatCloneRef.current.remove();
      seatCloneRef.current = null;
    }
  }, [seated]);

  const pulseGlow = () => {
    const g = slotGlowRef.current;
    if (!g) return;
    tween(320, (e) => {
      g.style.opacity = String(e < 0.4 ? e / 0.4 : 1 - (e - 0.4) / 0.6);
    });
  };

  // The console gives a little under the press, and back.
  const nudgeConsole = (px: number) => {
    const k = consoleBoxRef.current;
    if (!k) return;
    tween(
      150,
      (e) => {
        k.style.transform = `translateY(${px * Math.sin(e * Math.PI)}px)`;
      },
      () => {
        k.style.transform = "";
      },
    );
  };

  const boot = (id: string) => {
    if (flowRef.current.phase !== "shelf") return;
    setSelectedId(id);
    // Only boot once the station is settled; earlier clicks just preview.
    const container = containerRef.current;
    if (container && forcedSeq == null) {
      const total = container.offsetHeight - window.innerHeight;
      const top = container.getBoundingClientRect().top;
      const pr = total > 0 ? clamp01(-top / total) : 0;
      const tt = clamp01((pr - S1) / (S2 - S1));
      if (tt < 0.9) return;
      // Once the About camera has engaged the shelf is no longer the subject.
      if (pr > S3 + 0.01) return;
    }
    const fast = visitedRef.current.has(id);
    visitedRef.current.add(id);
    const entryNow = showcase.find((e) => e.id === id);
    const cartEl = stageRef.current?.querySelector<HTMLElement>(
      `[data-cart-id="${id}"]`,
    );
    const consoleBox = consoleBoxRef.current;
    const flyLayer = flyRef.current;
    if (!entryNow || !cartEl || !consoleBox || !flyLayer) {
      openDetail(id, fast);
      return;
    }
    lastCartRef.current = cartEl;
    lockScroll(true);
    applyFlow({ phase: "inserting", bootId: id, fast });
    history.replaceState(null, "", `#project-${id}/detail`);

    // --- slot geometry ---
    const cR = cartEl.getBoundingClientRect();
    const kR = consoleBox.getBoundingClientRect();
    const targetW = kR.width * SLOT.width;
    const cartH = targetW * CART_AR;
    const slotX = kR.left + kR.width * (SLOT.cx - SLOT.width / 2);
    const slotY = kR.top + kR.height * SLOT.top;
    const hoverY = slotY - cartH - targetW * SEAT.hover;
    const seatY = slotY - cartH * SEAT.stick;

    const cart = document.createElement("div");
    cart.style.cssText = `position:fixed;left:${cR.left}px;top:${cR.top}px;width:${cR.width}px;height:${cR.width * CART_AR}px;z-index:45;pointer-events:none;will-change:transform;filter:drop-shadow(0 10px 16px rgba(0,0,0,0.6));`;
    cart.innerHTML = cartMarkup(entryNow);
    flyLayer.appendChild(cart);
    cartEl.style.opacity = "0.25";

    // --- the flight: arc up to hover just above the slot mouth ---
    // Moves by center so the landing stays exact under center scaling.
    const dx = slotX + targetW / 2 - (cR.left + cR.width / 2);
    const dy = hoverY + cartH / 2 - (cR.top + (cR.width * CART_AR) / 2);
    const scaleEnd = targetW / cR.width;
    const arcH = Math.min(150, Math.abs(dy) * 0.45 + 50);
    tween(
      fast ? 400 : 820,
      (e) => {
        const x = dx * e;
        const y = dy * e - Math.sin(e * Math.PI) * arcH;
        const sc = 1 + (scaleEnd - 1) * e;
        const rot = -7 * (1 - e);
        cart.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${sc})`;
      },
      () => {
        // Rebase onto the hover rect so the insertion runs in clean coordinates.
        cart.style.transform = "";
        cart.style.left = `${slotX}px`;
        cart.style.top = `${hoverY}px`;
        cart.style.width = `${targetW}px`;
        cart.style.height = `${cartH}px`;
        // --- the insertion: push down, clipped exactly at the slot line ---
        const drop = seatY - hoverY;
        tween(
          fast ? 200 : 360,
          (e) => {
            const top = hoverY + drop * e;
            cart.style.transform = `translateY(${drop * e}px)`;
            const visible = clamp01((slotY - top) / cartH);
            cart.style.clipPath = `inset(0 0 ${(1 - visible) * 100}% 0)`;
          },
          () => {
            // The cart stays seated in the slot; the React element takes over.
            seatCloneRef.current?.remove();
            seatCloneRef.current = cart;
            setSeated(true);
            pulseGlow();
            nudgeConsole(2);
            if (greenLedRef.current) greenLedRef.current.style.opacity = "1";
            applyFlow({ phase: "splash", bootId: id, fast });
            window.setTimeout(() => dive(id, fast), fast ? 420 : 900);
          },
        );
      },
    );
  };

  const dive = (id: string, fast: boolean) => {
    applyFlow({ phase: "diving", bootId: id, fast });
    const world = worldRef.current;
    const glass = glassRef.current;
    if (!world || !glass) {
      openDetail(id, fast);
      return;
    }
    const g = glass.getBoundingClientRect();
    const cx = g.left + g.width / 2;
    const cy = g.top + g.height / 2;
    const scale =
      Math.max(window.innerWidth / g.width, window.innerHeight / g.height) * 1.04;
    world.style.transformOrigin = `${cx}px ${cy}px`;
    world.style.willChange = "transform, opacity";
    tween(
      fast ? 460 : 760,
      (e) => {
        world.style.transform = `scale(${1 + (scale - 1) * e})`;
        world.style.opacity = String(1 - Math.max(0, (e - 0.72) / 0.28) * 0.9);
      },
      () => openDetail(id, fast),
    );
  };

  const openDetail = (id: string, fast: boolean) => {
    lockScroll(true);
    setSeated(true);
    applyFlow({ phase: "detail", bootId: id, fast });
  };

  const finishEject = () => {
    if (lastCartRef.current) {
      lastCartRef.current.style.opacity = "1";
      lastCartRef.current.querySelector("button")?.focus();
    }
    lockScroll(false);
    setSeated(false);
    applyFlow(IDLE_FLOW);
  };

  // The cartridge springs up out of the slot, then arcs home to its shelf spot.
  const popOut = (id: string | null) => {
    const consoleBox = consoleBoxRef.current;
    const flyLayer = flyRef.current;
    const entryNow = id ? showcase.find((e) => e.id === id) : null;
    const cartEl = id
      ? stageRef.current?.querySelector<HTMLElement>(`[data-cart-id="${id}"]`)
      : null;
    if (!consoleBox || !flyLayer || !entryNow || !cartEl) {
      finishEject();
      return;
    }
    const kR = consoleBox.getBoundingClientRect();
    const targetW = kR.width * SLOT.width;
    const cartH = targetW * CART_AR;
    const slotX = kR.left + kR.width * (SLOT.cx - SLOT.width / 2);
    const slotY = kR.top + kR.height * SLOT.top;
    const hoverY = slotY - cartH - targetW * SEAT.hover;
    const seatY = slotY - cartH * SEAT.stick;

    // A clone takes over at the exact seated position...
    const cart = document.createElement("div");
    cart.style.cssText = `position:fixed;left:${slotX}px;top:${seatY}px;width:${targetW}px;height:${cartH}px;z-index:45;pointer-events:none;will-change:transform;clip-path:inset(0 0 ${(1 - SEAT.stick) * 100}% 0);filter:drop-shadow(0 10px 16px rgba(0,0,0,0.6));`;
    cart.innerHTML = cartMarkup(entryNow);
    flyLayer.appendChild(cart);
    // ...and the seated element + splash screen let go (the TV flicks back
    // to the library preview, the LED drops back to standby).
    setSeated(false);
    applyFlow({ phase: "ejecting", bootId: null, fast: false });
    if (greenLedRef.current) greenLedRef.current.style.opacity = "0";
    pulseGlow();
    nudgeConsole(-1.5);

    // --- the pop: spring up out of the slot, overshoot, settle at hover ---
    const rise = hoverY - seatY;
    tween(
      260,
      (e) => {
        const top = seatY + rise * e;
        cart.style.transform = `translateY(${rise * e}px)`;
        const visible = clamp01((slotY - top) / cartH);
        cart.style.clipPath = `inset(0 0 ${(1 - visible) * 100}% 0)`;
      },
      () => {
        // Rebase at the hover rect, then arc home.
        cart.style.transform = "";
        cart.style.top = `${hoverY}px`;
        cart.style.clipPath = "";
        const cR = cartEl.getBoundingClientRect();
        const dx = cR.left + cR.width / 2 - (slotX + targetW / 2);
        const dy = cR.top + (cR.width * CART_AR) / 2 - (hoverY + cartH / 2);
        const scaleEnd = cR.width / targetW;
        const arcH = Math.min(120, Math.abs(dy) * 0.35 + 40);
        tween(
          460,
          (e) => {
            const x = dx * e;
            const y = dy * e - Math.sin(e * Math.PI) * arcH;
            const sc = 1 + (scaleEnd - 1) * e;
            const rot = -6 * Math.sin(e * Math.PI);
            cart.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${sc})`;
          },
          () => {
            cart.remove();
            finishEject();
          },
        );
      },
      easePop,
    );
  };

  const eject = () => {
    if (flowRef.current.phase !== "detail") return;
    const id = flowRef.current.bootId;
    applyFlow({ phase: "ejecting", bootId: id, fast: false });
    history.replaceState(null, "", "#projects");
    const world = worldRef.current;
    if (!world) {
      finishEject();
      return;
    }
    const from = parseFloat((world.style.transform.match(/scale\(([\d.]+)\)/) || [])[1] || "5");
    tween(
      520,
      (e) => {
        world.style.transform = `scale(${from + (1 - from) * e})`;
        world.style.opacity = String(0.1 + 0.9 * e);
      },
      () => {
        world.style.transform = "";
        world.style.opacity = "";
        world.style.willChange = "";
        popOut(id);
      },
    );
  };

  const step = (dir: 1 | -1) => {
    const id = flowRef.current.bootId;
    if (!id) return;
    const idx = showcase.findIndex((e) => e.id === id);
    const next = showcase[(idx + dir + showcase.length) % showcase.length];
    visitedRef.current.add(next.id);
    setSelectedId(next.id);
    // The seated cart swaps too, so the right one flies home on eject.
    const nextEl = stageRef.current?.querySelector<HTMLElement>(
      `[data-cart-id="${next.id}"]`,
    );
    if (lastCartRef.current) lastCartRef.current.style.opacity = "1";
    if (nextEl) {
      nextEl.style.opacity = "0.25";
      lastCartRef.current = nextEl;
    }
    applyFlow({ phase: "detail", bootId: next.id, fast: true });
    history.replaceState(null, "", `#project-${next.id}/detail`);
  };

  // Marks the shelf spot a cartridge left from (the faint ghost slot).
  const ghostShelf = (id: string) => {
    const el = stageRef.current?.querySelector<HTMLElement>(
      `[data-cart-id="${id}"]`,
    );
    if (el) {
      el.style.opacity = "0.25";
      lastCartRef.current = el;
    }
    if (greenLedRef.current) greenLedRef.current.style.opacity = "1";
  };

  // Deep link: #project-<id>/detail opens the booted detail directly.
  useEffect(() => {
    if (reduced) return;
    const m = window.location.hash.match(/^#project-([a-z0-9-]+)\/detail$/);
    if (!m) return;
    const id = m[1];
    if (!showcase.some((e) => e.id === id)) return;
    visitedRef.current.add(id);
    setSelectedId(id);
    requestAnimationFrame(() => {
      document.getElementById("projects")?.scrollIntoView();
      ghostShelf(id);
      openDetail(id, true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  // Debug: ?seat=<id> (with ?seq=1) renders the seated splash state statically.
  useEffect(() => {
    if (reduced) return;
    const id = params.get("seat");
    if (!id || !showcase.some((e) => e.id === id)) return;
    setSelectedId(id);
    setSeated(true);
    applyFlow({ phase: "splash", bootId: id, fast: false });
    requestAnimationFrame(() => ghostShelf(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Preload scrub frames.
  useEffect(() => {
    if (reduced) return;
    const imgs: HTMLImageElement[] = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = frameUrl(i);
      imgs[i] = img;
    }
    imagesRef.current = imgs;
  }, [reduced]);

  // Scroll -> progress + imperative full-frame canvas draw (the approved hero).
  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;

    const progress = () => {
      if (forcedSeq != null) return clamp01(parseFloat(forcedSeq));
      const total = container.offsetHeight - window.innerHeight;
      const top = container.getBoundingClientRect().top;
      return total > 0 ? clamp01(-top / total) : 0;
    };

    const pickImage = (idx: number): HTMLImageElement | null => {
      const imgs = imagesRef.current;
      const ok = (im?: HTMLImageElement) =>
        !!im && im.complete && im.naturalWidth > 0;
      if (ok(imgs[idx])) return imgs[idx];
      for (let d = 1; d < FRAME_COUNT; d++) {
        if (ok(imgs[idx - d])) return imgs[idx - d];
        if (ok(imgs[idx + d])) return imgs[idx + d];
      }
      return null;
    };

    const draw = () => {
      const pr = progress();
      const scrub = clamp01(pr / S1);
      const idx = Math.round(scrub * (FRAME_COUNT - 1));
      const img = pickImage(idx);
      const cw = canvas.width;
      const ch = canvas.height;
      ctx.clearRect(0, 0, cw, ch);
      if (!img) return;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      draw();
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        draw();
        const pr = progress();
        setP((prev) => (Math.abs(pr - prev) > 0.003 ? pr : prev));
      });
    };

    resize();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
    const warm = window.setInterval(draw, 150);
    window.setTimeout(() => window.clearInterval(warm), 5000);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
      window.clearInterval(warm);
    };
  }, [reduced, forcedSeq]);

  // ---- the About camera ----
  // Past the station rest the view tilts down to the lap (the room slides up
  // while the lap scene rises in), then pushes into the handheld's measured
  // screen rect until it fills the frame. Driven straight off scroll progress
  // so the whole move is scrubbable in both directions.
  useEffect(() => {
    if (reduced) return;
    const world = worldRef.current;
    const lap = lapLayerRef.current;
    if (!world || !lap) return;
    const aP = clamp01((p - S3) / (S4 - S3));
    // Never fight the cartridge dive.
    if (flowRef.current.phase !== "shelf") return;
    if (aP <= 0.001) {
      if (world.dataset.aboutCam === "1") {
        world.style.transform = "";
        world.style.transformOrigin = "";
        world.dataset.aboutCam = "0";
      }
      lap.style.transform = "translateY(102vh)";
      return;
    }
    const screen = lapScreenRef.current;
    if (!screen) return;
    const key = `${window.innerWidth}x${window.innerHeight}`;
    let base = aboutBaseRef.current;
    if (!base || base.key !== key) {
      const prev = lap.style.transform;
      lap.style.transform = "";
      const r = screen.getBoundingClientRect();
      lap.style.transform = prev;
      // Layout not settled yet (fonts/art still loading): retry next frame
      // rather than caching a collapsed rect.
      if (!r.width || !r.height) {
        const again = requestAnimationFrame(() => setAssetTick((n) => n + 1));
        return () => cancelAnimationFrame(again);
      }
      base = {
        key,
        cx: r.left + r.width / 2,
        cy: r.top + r.height / 2,
        scale: Math.max(window.innerWidth / r.width, window.innerHeight / r.height) * 1.02,
      };
      aboutBaseRef.current = base;
    }
    // The tilt: the room slides up and away as the lap rises into place.
    const tiltE = smooth(aP, 0, 0.34);
    world.style.transformOrigin = "50% 100%";
    world.style.transform = `translateY(${(-62 * tiltE).toFixed(2)}vh)`;
    world.dataset.aboutCam = "1";
    // The push: into the screen once the lap has settled.
    const zoomE = smooth(aP, 0.38, 0.76);
    lap.style.transformOrigin = `${base.cx}px ${base.cy}px`;
    lap.style.transform = `translateY(${(102 * (1 - tiltE)).toFixed(2)}vh) scale(${(1 + (base.scale - 1) * zoomE).toFixed(4)})`;
  }, [p, reduced, assetTick, W, H]);

  if (reduced) return <ReducedTitleLibrary lang={lang} />;

  const scrubP = clamp01(p / S1);
  // Raw pull progress 0..1 drives the power-cycle phases.
  const t = clamp01((p - S1) / (S2 - S1));

  // ---- the About beat: tilt down -> handheld boots -> dive -> the card ----
  const aboutP = clamp01((p - S3) / (S4 - S3));
  const tiltE = smooth(aboutP, 0, 0.34);
  // Mid-tilt only: the veil breathes, the lap's top edge feathers into the
  // room, and the lap is graded toward the room's tone, so the two arts
  // cross-blend instead of one sliding over the other as a hard rectangle.
  const tiltBump = Math.sin(tiltE * Math.PI);
  const tiltDim = tiltBump * 0.5; // veil mid-tilt
  const backlight = smooth(aboutP, 0.34, 0.42); // the screen wakes
  const bootBurst =
    smooth(aboutP, 0.38, 0.43) * (1 - smooth(aboutP, 0.45, 0.52)); // static pop
  const logoP = smooth(aboutP, 0.46, 0.6); // logo drops, Game Boy style
  const logoOver = 1 + 1.7 * Math.pow(logoP - 1, 3) + 0.7 * Math.pow(logoP - 1, 2);
  const loadP = smooth(aboutP, 0.63, 0.75); // loading bar fills
  const cardIn = smooth(aboutP, 0.78, 0.95); // the card resolves

  // ---- the constellation reveal: the card lifts, the stars shine ----
  const skillsP = clamp01((p - S4) / (1 - S4));
  const cardExit = smooth(skillsP, 0, 0.22);

  // ---- the CRT death (on the full-screen picture) ----
  const collapse = smooth(t, 0, 0.2); // vertical squeeze into a line
  const lineP = smooth(t, 0.2, 0.3); // the line shrinks to a dot
  const dotFade = smooth(t, 0.3, 0.36); // the dot dies
  const ember = smooth(t, 0.32, 0.38) * (1 - smooth(t, 0.42, 0.52));
  const jitter = Math.sin(t * 140) * 4 * collapse * (1 - collapse);

  // ---- the room + station emerge in darkness ----
  const roomIn = smooth(t, 0.3, 0.55);
  const roomLit = 0.55 + 0.45 * smooth(t, 0.6, 0.8); // brightens on power-on
  const stationIn = smooth(t, 0.4, 0.6);

  // ---- the room TV powers ON ----
  const onDot = smooth(t, 0.46, 0.52);
  const onLine = smooth(t, 0.52, 0.6);
  const onOpen = smooth(t, 0.6, 0.7);
  const flash = smooth(t, 0.68, 0.72) * (1 - smooth(t, 0.72, 0.8));
  const burst = smooth(t, 0.7, 0.74) * (1 - smooth(t, 0.76, 0.85));
  const bootIn = smooth(t, 0.78, 0.9);

  const titleOpacity = 1 - smooth(t, 0, 0.09);

  // ---- station geometry (fixed; it does not fly) ----
  const endTop = Math.max(40, 0.05 * H);
  const endW = Math.min(0.56 * W, Math.max(320, (H - endTop - 14) / 1.44));
  const tvW = endW;
  const tvH = tvW * TV_AR;
  const tvTop = endTop;
  const cabW = Math.min(tvW * 1.5, W * 0.96);
  const cabTop = tvTop + tvH - 8;
  const stationRise = (1 - stationIn) * 26;

  const powerPlaneOpacity = onDot * (1 - smooth(t, 0.74, 0.82));

  return (
    <div
      ref={containerRef}
      id="title"
      style={{ height: `${CONTAINER_VH}vh`, position: "relative" }}
    >
      {/* deep-link anchor: lands where the station is fully revealed */}
      <div
        id="projects"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: `${SCRUB_VH + PULL_VH}vh`,
          height: 1,
          width: 1,
        }}
      />
      {/* deep-link anchor: lands once the card has resolved in the handheld */}
      <div
        id="about"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: `${SCRUB_VH + PULL_VH + REST_VH + 330}vh`,
          height: 1,
          width: 1,
        }}
      />
      {/* deep-link anchor: lands with the constellation revealed */}
      <div
        id="skills"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: `${SCRUB_VH + PULL_VH + REST_VH + ABOUT_VH + 223}vh`,
          height: 1,
          width: 1,
        }}
      />

      <div
        ref={stageRef}
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          background: "#05070c",
        }}
      >
        <div ref={worldRef} style={{ position: "absolute", inset: 0 }}>
        {/* the room, emerging in darkness and brightening with the TV */}
        <Room opacity={roomIn} lit={roomLit} />

        {/* stage label + subtitle */}
        <div
          aria-hidden={stationIn < 0.5}
          style={{
            position: "absolute",
            top: Math.max(12, endTop - 34),
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: stationIn * smooth(t, 0.62, 0.8),
            zIndex: 4,
          }}
        >
          <div
            className="font-mono"
            style={{ fontSize: 10.5, letterSpacing: 2, color: "var(--term-green)" }}
          >
            {"// STAGE 02 · GAME LIBRARY"}
          </div>
          <div
            className="font-mono"
            style={{ fontSize: 10, letterSpacing: 0.6, color: "#8a93bd", marginTop: 4 }}
          >
            {pick(lang, SUBTITLE)}
          </div>
        </div>

        {/* ==== the station (fixed geometry, settles in during the dark beat) ==== */}
        <div
          aria-hidden={stationIn < 0.05}
          style={{
            opacity: stationIn,
            transform: `translateY(${stationRise}px)`,
          }}
        >
          {/* TV */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: tvTop,
              width: tvW,
              height: tvH,
              transform: "translateX(-50%)",
              zIndex: 3,
            }}
          >
            {/* phosphor halo, only once the screen is on */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: "-14% -10%",
                background:
                  "radial-gradient(60% 58% at 50% 46%, rgba(122,162,247,0.32), transparent 72%)",
                pointerEvents: "none",
                opacity: onOpen,
              }}
            />
            <img
              src={tvUrl}
              alt=""
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                filter: "drop-shadow(0 24px 40px rgba(0,0,0,0.55))",
              }}
            />
            {/* standby LED, dies as the screen opens */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                right: "10.5%",
                bottom: "6.5%",
                width: Math.max(4, tvW * 0.011),
                height: Math.max(4, tvW * 0.011),
                borderRadius: "50%",
                background: "#e2574f",
                boxShadow: "0 0 8px #e2574f, 0 0 14px rgba(226,87,79,0.6)",
                opacity: stationIn * (1 - onOpen),
              }}
            />
            {/* the glass */}
            <div
              ref={glassRef}
              style={{
                position: "absolute",
                left: `${GLASS.left}%`,
                top: `${GLASS.top}%`,
                width: `${GLASS.width}%`,
                height: `${GLASS.height}%`,
                borderRadius: "3.4% / 4.6%",
                overflow: "hidden",
                background: "#0a0d18",
              }}
            >
              {/* a booting cartridge owns the screen */}
              {flow.phase !== "shelf" && bootEntry ? (
                <SplashCard entry={bootEntry} />
              ) : entry ? (
                <div
                  key={entry.id}
                  className="crt-flicker"
                  style={{ position: "absolute", inset: 0, opacity: bootIn }}
                >
                  <img
                    src={labelUrl(entry.id)}
                    alt=""
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <ScreenChrome entry={entry} show={1} />
                </div>
              ) : (
                <BootCard show={bootIn} />
              )}
              {/* power-on: dot -> line -> the picture plane opens */}
              {powerPlaneOpacity > 0.001 && (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: powerPlaneOpacity,
                  }}
                >
                  <div
                    style={{
                      width: "96%",
                      height: "94%",
                      borderRadius: 6,
                      transform: `scaleX(${0.006 + 0.994 * onLine}) scaleY(${0.006 + 0.994 * onOpen})`,
                      background:
                        "radial-gradient(60% 80% at 50% 50%, #eef4ff 0%, #a9c6ff 55%, #5b82d6 100%)",
                      boxShadow:
                        "0 0 26px rgba(170,200,255,0.9), 0 0 70px rgba(122,162,247,0.55)",
                    }}
                  />
                </div>
              )}
              {/* white flash as the tube catches */}
              {flash > 0.001 && (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "#fff",
                    opacity: flash * 0.85,
                  }}
                />
              )}
              {/* a breath of static before the picture settles */}
              {burst > 0.001 && (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: burst,
                    background:
                      "repeating-linear-gradient(0deg, rgba(255,255,255,0.24) 0 1px, rgba(10,10,18,0.55) 1px 3px)",
                    mixBlendMode: "screen",
                  }}
                />
              )}
              <GlassFX />
            </div>
          </div>

          {/* cabinet */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: cabTop,
              width: cabW,
              transform: "translateX(-50%)",
              zIndex: 2,
              borderRadius: 10,
              border: "2px solid #0b0c14",
              background:
                "linear-gradient(180deg, #282a3b 0%, #1d1f2c 55%, #171925 100%)",
              boxShadow:
                "0 34px 70px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.06)",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "8%",
                right: "8%",
                top: -6,
                height: 40,
                background:
                  "radial-gradient(50% 100% at 50% 0%, rgba(122,162,247,0.12), transparent 75%)",
                pointerEvents: "none",
                opacity: onOpen,
              }}
            />
            <div
              aria-hidden="true"
              style={{
                height: 10,
                borderRadius: "8px 8px 0 0",
                background: "linear-gradient(180deg, #383b52 0%, #272939 100%)",
                borderBottom: "1px solid #0d0e18",
              }}
            />

            {/* console bay */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end",
                padding: "8px 24px 0",
              }}
            >
              <div aria-hidden="true" style={ventStyle} />
              <div
                ref={consoleBoxRef}
                style={{ position: "relative", width: "38%", marginBottom: -3 }}
              >
                <img
                  src={consoleUrl}
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: "100%",
                    display: "block",
                    filter: "drop-shadow(0 14px 18px rgba(0,0,0,0.6))",
                  }}
                />
                {/* the booted cartridge stays seated in the slot, top sticking out */}
                {seated && bootEntry && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: `${(SLOT.cx - SLOT.width / 2) * 100}%`,
                      top: `${SLOT.top * 100}%`,
                      width: `${SLOT.width * 100}%`,
                      aspectRatio: "716 / 592",
                      transform: `translateY(-${SEAT.stick * 100}%)`,
                      clipPath: `inset(0 0 ${(1 - SEAT.stick) * 100}% 0)`,
                      pointerEvents: "none",
                      filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.45))",
                    }}
                    dangerouslySetInnerHTML={{ __html: cartMarkup(bootEntry) }}
                  />
                )}
                {/* slot glow on insert */}
                <div
                  ref={slotGlowRef}
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "28%",
                    top: "9%",
                    width: "44%",
                    height: "16%",
                    borderRadius: 4,
                    background:
                      "radial-gradient(60% 100% at 50% 50%, rgba(170,200,255,0.85), transparent 75%)",
                    opacity: 0,
                    pointerEvents: "none",
                  }}
                />
                {/* power LED goes green while a cartridge is in */}
                <div
                  ref={greenLedRef}
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "49.4%",
                    top: "45%",
                    width: "2.6%",
                    aspectRatio: "1",
                    borderRadius: "50%",
                    background: "#8fe08a",
                    boxShadow: "0 0 8px #8fe08a, 0 0 14px rgba(143,224,138,0.6)",
                    opacity: 0,
                    transition: "opacity 0.25s ease",
                    pointerEvents: "none",
                  }}
                />
              </div>
              <div aria-hidden="true" style={ventStyle} />
            </div>
            {/* ledge */}
            <div
              aria-hidden="true"
              style={{
                height: 10,
                margin: "0 10px",
                borderRadius: 3,
                background: "linear-gradient(180deg, #333650 0%, #20222f 100%)",
                border: "1px solid #0c0d17",
                boxShadow: "0 3px 6px rgba(0,0,0,0.4)",
              }}
            />
            {/* open shelf: the cartridges settle with a slight stagger */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${showcase.length}, 1fr)`,
                gap: Math.max(8, cabW * 0.016),
                padding: `14px ${Math.max(14, cabW * 0.03)}px 12px`,
              }}
            >
              {showcase.map((e, i) => {
                const settle = smooth(t, 0.5 + i * 0.02, 0.7 + i * 0.02);
                return (
                  <div
                    key={e.id}
                    data-cart-id={e.id}
                    style={{
                      width: "100%",
                      opacity: settle,
                      transform: `translateY(${(1 - settle) * 16}px)`,
                    }}
                  >
                    <Cartridge
                      entry={e}
                      selected={e.id === selectedId}
                      onSelect={setSelectedId}
                      onOpen={boot}
                    />
                  </div>
                );
              })}
            </div>
            <div
              className="font-mono"
              style={{
                textAlign: "center",
                paddingBottom: 10,
                fontSize: 9.5,
                letterSpacing: 1,
                color: "#565f89",
              }}
            >
              HOVER A CARTRIDGE · CLICK TO LOAD
            </div>
          </div>
        </div>

        {/* ==== phase 1: the approved full-screen hero video, dying like a CRT ==== */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            transformOrigin: "center",
            transform: `translateX(${jitter}px) scaleX(${1 - lineP * 0.9965}) scaleY(${1 - collapse * 0.9955})`,
            filter: `brightness(${1 + collapse * 4.5 + lineP * 3}) saturate(${1 - collapse * 0.55})`,
            opacity: 1 - dotFade,
            visibility: t < 0.36 ? "visible" : "hidden",
            zIndex: 5,
          }}
        />
        {/* the blazing scanline */}
        {collapse > 0.55 && dotFade < 1 && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: `${(1 - lineP) * 96 + 0.5}%`,
              height: 3,
              borderRadius: 2,
              background: "#eef4ff",
              boxShadow:
                "0 0 10px rgba(238,244,255,0.95), 0 0 30px rgba(170,200,255,0.8), 0 0 70px rgba(122,162,247,0.5)",
              opacity: smooth(collapse, 0.55, 1) * (1 - dotFade),
              zIndex: 6,
            }}
          />
        )}
        {/* the dying dot */}
        {lineP > 0.85 && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 10,
              height: 8,
              borderRadius: "50%",
              background: "#f4f8ff",
              boxShadow:
                "0 0 12px rgba(238,244,255,1), 0 0 34px rgba(170,200,255,0.9), 0 0 80px rgba(122,162,247,0.6)",
              opacity: smooth(lineP, 0.85, 1) * (1 - dotFade),
              zIndex: 6,
            }}
          />
        )}
        {/* phosphor afterglow ember */}
        {ember > 0.001 && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 5,
              height: 4,
              borderRadius: "50%",
              background: "#b8e394",
              filter: "blur(0.5px)",
              boxShadow: "0 0 10px rgba(158,206,106,0.8)",
              opacity: ember * 0.9,
              zIndex: 6,
            }}
          />
        )}

        {/* title overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 6vw",
            pointerEvents: titleOpacity > 0.4 ? "auto" : "none",
            opacity: titleOpacity,
            zIndex: 7,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(70% 55% at 50% 46%, rgba(8,11,18,0.72), transparent 70%)",
              opacity: smooth(scrubP, 0.35, 0.62) * titleOpacity,
            }}
          />
          <div style={{ position: "relative" }}>
            <h1 style={{ ...titleStyle }}>
              <DecodeText
                text="ZACK ALATRASH"
                progress={scrubP}
                start={0.4}
                end={0.62}
                reduced={false}
              />
            </h1>
            <p style={{ ...taglineStyle, opacity: smooth(scrubP, 0.62, 0.76) }}>
              {pick(lang, TAGLINE)}
            </p>
            <button
              onClick={() =>
                document
                  .getElementById("projects")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              style={{ ...pressStartStyle, opacity: smooth(scrubP, 0.86, 0.97) }}
              className={scrubP > 0.9 ? "press-blink" : undefined}
            >
              {"▸"} PRESS START
            </button>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "4vh",
              left: 0,
              right: 0,
              textAlign: "center",
              opacity: smooth(scrubP, 0.9, 1),
            }}
            className="font-mono"
          >
            <span style={{ fontSize: 11, color: "var(--term-dim)", letterSpacing: 1 }}>
              {pick(lang, FOOTER)}
            </span>
          </div>
        </div>

        {/* scroll cue */}
        {armed && (
          <div
            className="scroll-cue"
            aria-hidden="true"
            style={{ opacity: p < 0.015 ? 1 : 0, zIndex: 8 }}
          >
            <span className="cue-chev">▼</span>
            <span className="cue-txt">SCROLL TO POWER ON</span>
          </div>
        )}
        </div>

        {/* the lap: the handheld held in both hands (the About beat) */}
        <div
          ref={lapLayerRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 8,
            transform: "translateY(102vh)",
            willChange: "transform",
            pointerEvents: "none",
            // The top edge feathers into the room only while tilting; at rest
            // the mask collapses to nothing so the full scene shows.
            WebkitMaskImage: `linear-gradient(to bottom, transparent 0%, black ${(24 * tiltBump).toFixed(1)}%)`,
            maskImage: `linear-gradient(to bottom, transparent 0%, black ${(24 * tiltBump).toFixed(1)}%)`,
          }}
        >
          <img
            src={lapUrl}
            alt=""
            onLoad={() => setAssetTick((n) => n + 1)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              // A slight permanent grade seats the lap art in the room's mood;
              // mid-tilt it dips further toward the room's darkness.
              filter: `brightness(${(0.94 - 0.2 * tiltBump).toFixed(3)}) saturate(${(0.96 - 0.14 * tiltBump).toFixed(3)})`,
            }}
          />
          {/* the handheld's screen: boots up as the camera pushes in */}
          <div
            ref={lapScreenRef}
            style={{
              position: "absolute",
              left: `${LAP_SCREEN.left}%`,
              top: `${LAP_SCREEN.top}%`,
              width: `${LAP_SCREEN.width}%`,
              height: `${LAP_SCREEN.height}%`,
              overflow: "hidden",
              background: `radial-gradient(95% 85% at 50% 42%, rgba(26,58,104,${(0.15 + 0.62 * backlight).toFixed(3)}), rgba(7,12,26,0.97))`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: backlight * (1 - cardIn),
              }}
            >
              {/* the logo drops in from above, the way the old handhelds booted */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: `${(-16 + 56 * logoOver).toFixed(2)}%`,
                  textAlign: "center",
                  fontFamily: PIXEL,
                  fontSize: "1.35vw",
                  color: "#f4f4fb",
                  textShadow:
                    "0.12em 0.12em 0 rgba(20,10,60,0.9), 0 0 0.8em rgba(122,162,247,0.5)",
                }}
              >
                PLAYER 01
              </div>
              <div
                style={{
                  position: "absolute",
                  left: "27%",
                  right: "27%",
                  top: "62%",
                  height: "5.5%",
                  borderRadius: 999,
                  border: "1px solid rgba(143,182,255,0.5)",
                  padding: "0.35%",
                  opacity: smooth(aboutP, 0.6, 0.66),
                }}
              >
                <div
                  style={{
                    width: `${Math.round(loadP * 100)}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: "linear-gradient(90deg, #7aa2f7, #b8e394)",
                    boxShadow: "0 0 0.6em rgba(122,162,247,0.7)",
                  }}
                />
              </div>
            </div>
            {bootBurst > 0.001 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: bootBurst,
                  background:
                    "repeating-linear-gradient(0deg, rgba(255,255,255,0.25) 0 1px, rgba(10,10,18,0.6) 1px 3px)",
                  mixBlendMode: "screen",
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "repeating-linear-gradient(rgba(0,0,0,0.2) 0 1px, transparent 1px 2px)",
              }}
            />
          </div>
          {/* screen glow spilling onto the case and hands */}
          <div
            style={{
              position: "absolute",
              left: `${LAP_SCREEN.left - 7}%`,
              top: `${LAP_SCREEN.top - 10}%`,
              width: `${LAP_SCREEN.width + 14}%`,
              height: `${LAP_SCREEN.height + 20}%`,
              pointerEvents: "none",
              background:
                "radial-gradient(50% 45% at 50% 48%, rgba(122,162,247,0.32), transparent 72%)",
              opacity: backlight,
            }}
          />
        </div>

        {/* a breath of dark as the view whips down to the lap */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 8,
            pointerEvents: "none",
            background: "#05070c",
            opacity: tiltDim,
          }}
        />

        {/* the night sky on the OS: the skill constellation, waiting behind the card */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 8,
            opacity: cardIn,
            // Transparent to input while it is only the backdrop behind the
            // card; once the constellation is revealed the whole page (rail,
            // panel, stars) has to be clickable.
            pointerEvents: skillsP > 0.75 ? "auto" : "none",
          }}
        >
          <SkillsPage reveal={skillsP} interactive={skillsP > 0.75} />
        </div>

        {/* inside the handheld: the character card resolves as the camera lands */}
        <div
          aria-hidden={cardIn < 0.5 || cardExit > 0.5}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 9,
            opacity: cardIn * (1 - cardExit),
            pointerEvents: cardIn > 0.6 && cardExit < 0.3 ? "auto" : "none",
            transform: `translateY(${(-9 * cardExit).toFixed(2)}vh) scale(${(1 - 0.025 * cardExit).toFixed(4)})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            ref={cardWrapRef}
            style={{
              width: "min(1060px, 100%)",
              transform: `scale(${cardScale})`,
              transformOrigin: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
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
            <AboutCard visible={cardIn > 0.35} play={cardIn > 0.35} />
          </div>
        </div>

        {/* still inside the little screen: keep its glow at the edges */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            pointerEvents: "none",
            opacity: cardIn,
            background:
              "radial-gradient(125% 95% at 50% 45%, transparent 54%, rgba(20,44,90,0.55) 100%)",
          }}
        />

        {/* flying cartridges live above the world */}
        <div ref={flyRef} aria-hidden="true" />
      </div>

      {/* inside the TV: the project detail shell */}
      {flow.phase === "detail" && bootEntry && (
        <DetailOverlay
          entry={bootEntry}
          onEject={eject}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
        />
      )}
    </div>
  );
}

/** Scanlines + curvature, always on the glass. */
function GlassFX() {
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(rgba(0,0,0,0.22) 0 1px, transparent 1px 3px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(115% 90% at 50% 45%, transparent 58%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />
    </>
  );
}

/** Default library screen before any cartridge is hovered. */
function BootCard({ show }: { show: number }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "5%",
        textAlign: "center",
        opacity: show,
        background:
          "radial-gradient(80% 70% at 50% 40%, #141a30 0%, #0d1120 70%)",
      }}
    >
      <div
        style={{
          fontFamily: PIXEL,
          fontSize: "clamp(10px, 1.7vw, 17px)",
          color: "#f4f4fb",
          textShadow: "2px 2px 0 rgba(20,10,60,0.9)",
          lineHeight: 1.6,
        }}
      >
        PLAYER 1
        <br />
        ZACK ALATRASH
      </div>
      <div
        className="font-mono"
        style={{
          fontSize: "clamp(9px, 1.2vw, 12px)",
          color: "#b8e394",
          letterSpacing: 1,
        }}
      >
        {showcase.length} TITLES SHIPPED · MORE IN DEVELOPMENT
      </div>
      <div
        className="press-blink"
        style={{
          fontFamily: PIXEL,
          fontSize: "clamp(7px, 1vw, 9px)",
          color: "#8fb6ff",
        }}
      >
        ▼ SELECT A CARTRIDGE
      </div>
    </div>
  );
}

/** The generated game room; `lit` brightens it as the TV powers on. */
function Room({ opacity, lit }: { opacity: number; lit: number }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, opacity }}>
      <img
        src={roomUrl}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: `brightness(${(0.82 * lit).toFixed(3)}) saturate(0.92)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(70% 62% at 50% 44%, rgba(6,8,14,0.28), rgba(6,8,14,0.55) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 95% at 50% 42%, transparent 55%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      {opacity > 0.15 &&
        DUST.map((d, i) => (
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
    </div>
  );
}

const DUST = [
  { left: "24%", top: "38%", delay: "0s", dur: "11s", size: 3 },
  { left: "31%", top: "62%", delay: "2.2s", dur: "13s", size: 2 },
  { left: "42%", top: "30%", delay: "4.5s", dur: "10s", size: 2 },
  { left: "55%", top: "56%", delay: "1.1s", dur: "12s", size: 3 },
  { left: "63%", top: "34%", delay: "3.4s", dur: "14s", size: 2 },
  { left: "71%", top: "58%", delay: "5.6s", dur: "11s", size: 3 },
  { left: "78%", top: "42%", delay: "0.7s", dur: "13s", size: 2 },
  { left: "36%", top: "48%", delay: "6.8s", dur: "12s", size: 2 },
];

/** Title/genre/stat overlay + developer credit on the station screen. */
function ScreenChrome({
  entry,
  show,
}: {
  entry: (typeof showcase)[number];
  show: number;
}) {
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: show,
          background:
            "linear-gradient(180deg, rgba(5,7,14,0.15) 0%, transparent 30%, transparent 46%, rgba(4,6,12,0.92) 86%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "6%",
          right: "6%",
          bottom: "11%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
          opacity: show,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: PIXEL,
              fontSize: "clamp(11px, 2vw, 20px)",
              color: "#f4f4fb",
              textShadow:
                "2px 2px 0 rgba(20,10,60,0.9), 0 0 14px rgba(122,162,247,0.35)",
              lineHeight: 1.35,
            }}
          >
            {entry.title}
          </div>
          <div
            className="font-mono"
            style={{
              fontSize: "clamp(8px, 1.1vw, 12px)",
              color: "#8fb6ff",
              letterSpacing: 1.2,
              marginTop: 7,
              textShadow: "0 1px 3px rgba(0,0,0,0.9)",
            }}
          >
            {entry.genre}
          </div>
          <div
            className="font-mono"
            style={{
              fontSize: "clamp(8px, 1.1vw, 12px)",
              color: "#b8e394",
              marginTop: 4,
              textShadow: "0 1px 3px rgba(0,0,0,0.9)",
            }}
          >
            {entry.headline}
          </div>
        </div>
        <div
          className="press-blink"
          style={{
            fontFamily: PIXEL,
            fontSize: "clamp(7px, 0.95vw, 10px)",
            color: "#fff",
            whiteSpace: "nowrap",
            textShadow: "0 0 8px rgba(255,255,255,0.4)",
            paddingBottom: 2,
          }}
        >
          ▸ PRESS START
        </div>
      </div>
      {/* the developer credit, where a game would put its copyright */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "3.6%",
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: "clamp(7px, 0.9vw, 10px)",
          letterSpacing: 1,
          color: "#7d86ad",
          opacity: show,
          textShadow: "0 1px 3px rgba(0,0,0,0.9)",
        }}
      >
        © 2026 ZACK ALATRASH · DEVELOPER
      </div>
    </>
  );
}

/** Reduced-motion fallback: static title, then the station as a normal section. */
function ReducedTitleLibrary({ lang }: { lang: Lang }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const entry = selectedId
    ? showcase.find((e) => e.id === selectedId) ?? null
    : null;
  const detailEntry = detailId
    ? showcase.find((e) => e.id === detailId) ?? null
    : null;
  const stepReduced = (dir: 1 | -1) => {
    if (!detailId) return;
    const idx = showcase.findIndex((e) => e.id === detailId);
    setDetailId(showcase[(idx + dir + showcase.length) % showcase.length].id);
  };
  return (
    <>
      <section
        id="title"
        aria-label="Title screen"
        style={{
          position: "relative",
          minHeight: "100vh",
          backgroundImage: `url(${posterUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 6vw",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(70% 55% at 50% 46%, rgba(8,11,18,0.78), transparent 75%)",
          }}
        />
        <div style={{ position: "relative" }}>
          <h1 style={titleStyle}>ZACK ALATRASH</h1>
          <p style={taglineStyle}>{pick(lang, TAGLINE)}</p>
        </div>
      </section>
      <section
        id="projects"
        aria-label="Projects"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "72px 16px 48px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div
            className="font-mono"
            style={{ fontSize: 10.5, letterSpacing: 2, color: "var(--term-green)" }}
          >
            {"// STAGE 02 · GAME LIBRARY"}
          </div>
          <div
            className="font-mono"
            style={{ fontSize: 10, letterSpacing: 0.6, color: "#8a93bd", marginTop: 4 }}
          >
            {pick(lang, SUBTITLE)}
          </div>
        </div>
        <div style={{ position: "relative", width: "min(540px, 92vw)", aspectRatio: "734/598" }}>
          <img src={tvUrl} alt="" aria-hidden="true" style={{ width: "100%" }} />
          <div
            style={{
              position: "absolute",
              left: `${GLASS.left}%`,
              top: `${GLASS.top}%`,
              width: `${GLASS.width}%`,
              height: `${GLASS.height}%`,
              borderRadius: "3.4% / 4.6%",
              overflow: "hidden",
              background: "#0d1120",
            }}
          >
            {entry ? (
              <>
                <img
                  src={labelUrl(entry.id)}
                  alt=""
                  aria-hidden="true"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
                <ScreenChrome entry={entry} show={1} />
              </>
            ) : (
              <BootCard show={1} />
            )}
            <GlassFX />
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
            gap: 12,
            width: "min(680px, 96vw)",
          }}
        >
          {showcase.map((e) => (
            <Cartridge
              key={e.id}
              entry={e}
              selected={e.id === selectedId}
              onSelect={setSelectedId}
              onOpen={(id) => {
                setSelectedId(id);
                setDetailId(id);
              }}
            />
          ))}
        </div>
        {detailEntry && (
          <DetailOverlay
            entry={detailEntry}
            onEject={() => setDetailId(null)}
            onPrev={() => stepReduced(-1)}
            onNext={() => stepReduced(1)}
          />
        )}
      </section>
    </>
  );
}

const ventStyle: CSSProperties = {
  flex: 1,
  maxWidth: 120,
  height: 52,
  alignSelf: "center",
  background:
    "repeating-linear-gradient(180deg, #242637 0 3px, #181a27 3px 7px)",
  borderRadius: 4,
  border: "1px solid #10111c",
  margin: "0 20px",
};

const titleStyle: CSSProperties = {
  fontFamily: PIXEL,
  fontWeight: 400,
  fontSize: "clamp(20px, 5.2vw, 58px)",
  lineHeight: 1.2,
  color: "#f4f4fb",
  textShadow: "3px 3px 0 #4a2f9e",
  letterSpacing: 1,
  margin: 0,
};

const taglineStyle: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "clamp(12px, 1.9vw, 17px)",
  color: "var(--term-green)",
  marginTop: 20,
  letterSpacing: 0.4,
};

const pressStartStyle: CSSProperties = {
  fontFamily: PIXEL,
  fontSize: "clamp(9px, 1.4vw, 12px)",
  color: "#fff",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  marginTop: 28,
  letterSpacing: 1,
};
