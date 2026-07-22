import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useReducedMotion } from "../motion/useReducedMotion";
import {
  FRAME_COUNT,
  frameUrl,
  posterUrl,
} from "../hero/useHeroScrub";
import { DecodeText } from "../hero/DecodeText";
import { useSettings, pick } from "../game/settings";
import { Cartridge } from "../showcase/Cartridge";
import {
  showcase,
  labelUrl,
  crtUrl,
  consoleUrl,
} from "../showcase/showcaseData";
import {
  CONTAINER_VH,
  SCRUB_VH,
  PULL_VH,
  S1,
  S2,
  clamp01,
  smooth,
} from "../showcase/sequence";

const PIXEL = '"Press Start 2P", ui-monospace, monospace';
// CRT glass rect within the cropped TV image (percentages).
const GLASS = { left: 4.9, top: 5.4, width: 90.2, height: 87.4 };
// TV crop rect within the original 1376x768 video frame.
const TV_IN_VIDEO = { x: 123, y: 6, w: 1130, h: 756 };
const VIDEO_W = 1376;
const VIDEO_H = 768;

const TAGLINE = {
  en: "Grounded AI, shipped to production.",
  nl: "Gefundeerde AI, in productie gebracht.",
};
const FOOTER = {
  en: "© 2026 · HAARLEM, NL · AVAILABLE SUMMER 2026",
  nl: "© 2026 · HAARLEM · BESCHIKBAAR VANAF ZOMER 2026",
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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
 * The fused Title -> Game Library sequence (design: one continuous television).
 * Phase 1 scrubs the hero video; phase 2 pulls the camera back, revealing the
 * entertainment center while the screen flickers from the title to the
 * selected project; the rest phase holds the station for browsing.
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
  const [selectedId, setSelectedId] = useState(showcase[0].id);
  const entry = showcase.find((e) => e.id === selectedId) ?? showcase[0];

  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (reduced) return;
    const id = window.setTimeout(() => setArmed(true), 900);
    return () => window.clearTimeout(id);
  }, [reduced]);

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

  // Scroll -> progress + imperative canvas draw.
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
      if (img) {
        const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      }
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

  if (reduced) return <ReducedTitleLibrary lang={lang} />;

  const scrubP = clamp01(p / S1);
  const pullT = smooth(p, S1, S2);

  // --- TV geometry: from video-matched rect to the station rect. ---
  const cover = Math.max(W / VIDEO_W, H / VIDEO_H);
  const oy = (H - VIDEO_H * cover) / 2;
  const startW = TV_IN_VIDEO.w * cover;
  const startTop = oy + TV_IN_VIDEO.y * cover;
  const endW = Math.min(0.6 * W, Math.max(360, 1.42 * (H - 320)));
  const endTop = Math.max(44, 0.065 * H);
  const tvW = lerp(startW, endW, pullT);
  const tvH = tvW * (756 / 1130);
  const tvTop = lerp(startTop, endTop, pullT);
  const cabW = Math.min(tvW * 1.14, W * 0.96);
  const cabTop = tvTop + tvH - 6;

  const titleOpacity = 1 - smooth(pullT, 0, 0.22);
  const stationOpacity = smooth(pullT, 0.04, 0.3);
  const artIn = smooth(pullT, 0.16, 0.42);
  const noise = pullT > 0.001 && pullT < 0.3 ? 0.5 - Math.abs(pullT - 0.08) * 2 : 0;

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

      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          background: "#080b12",
        }}
      >
        {/* room ambience behind the station */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            opacity: stationOpacity,
            background:
              "radial-gradient(90% 65% at 50% 30%, rgba(122,162,247,0.08), transparent 60%), radial-gradient(120% 100% at 50% 100%, rgba(0,0,0,0.55), transparent 55%)",
          }}
        />

        {/* phase 1: the video */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: pullT < 0.06 ? 1 : Math.max(0, 1 - (pullT - 0.06) * 9),
          }}
        />

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
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(70% 55% at 50% 46%, rgba(8,11,18,0.72), transparent 70%)",
              opacity: smooth(scrubP, 0.35, 0.62),
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
          <div className="scroll-cue" aria-hidden="true" style={{ opacity: p < 0.015 ? 1 : 0 }}>
            <span className="cue-chev">▼</span>
            <span className="cue-txt">SCROLL TO POWER ON</span>
          </div>
        )}

        {/* stage label, fades in with the station */}
        <div
          className="font-mono"
          aria-hidden={stationOpacity < 0.5}
          style={{
            position: "absolute",
            top: Math.max(14, endTop - 30),
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 10.5,
            letterSpacing: 2,
            color: "var(--term-green)",
            opacity: stationOpacity * smooth(pullT, 0.5, 0.9),
          }}
        >
          {"// STAGE 02 — GAME LIBRARY"}
        </div>

        {/* ==== the station (TV + cabinet) ==== */}
        <div aria-hidden={pullT < 0.05} style={{ opacity: stationOpacity }}>
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
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: "-12% -9%",
                background:
                  "radial-gradient(60% 58% at 50% 46%, rgba(122,162,247,0.3), transparent 72%)",
                pointerEvents: "none",
              }}
            />
            <img
              src={crtUrl}
              alt=""
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                borderRadius: 18,
                filter: "drop-shadow(0 24px 40px rgba(0,0,0,0.55))",
              }}
            />
            <div
              key={entry.id}
              className="crt-flicker"
              style={{
                position: "absolute",
                left: `${GLASS.left}%`,
                top: `${GLASS.top}%`,
                width: `${GLASS.width}%`,
                height: `${GLASS.height}%`,
                borderRadius: "24px / 30px",
                overflow: "hidden",
                background: "#0a0c16",
              }}
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
                  opacity: artIn,
                }}
              />
              <ScreenChrome entry={entry} show={artIn} />
            </div>
            {/* channel-change static */}
            {noise > 0 && (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: `${GLASS.left}%`,
                  top: `${GLASS.top}%`,
                  width: `${GLASS.width}%`,
                  height: `${GLASS.height}%`,
                  borderRadius: "24px / 30px",
                  opacity: noise,
                  background:
                    "repeating-linear-gradient(0deg, rgba(255,255,255,0.22) 0 1px, rgba(10,10,18,0.5) 1px 3px)",
                  mixBlendMode: "screen",
                }}
              />
            )}
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
            {/* light spill from the screen */}
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
              <img
                src={consoleUrl}
                alt=""
                aria-hidden="true"
                style={{
                  width: "38%",
                  display: "block",
                  filter: "drop-shadow(0 14px 18px rgba(0,0,0,0.6))",
                  marginBottom: -3,
                }}
              />
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
            {/* open shelf */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${showcase.length}, 1fr)`,
                gap: Math.max(8, cabW * 0.016),
                padding: `14px ${Math.max(14, cabW * 0.03)}px 12px`,
              }}
            >
              {showcase.map((e) => (
                <Cartridge
                  key={e.id}
                  entry={e}
                  selected={e.id === selectedId}
                  onSelect={setSelectedId}
                  onOpen={setSelectedId}
                />
              ))}
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
      </div>
    </div>
  );
}

/** Title/genre/stat overlay on the station screen. */
function ScreenChrome({ entry, show }: { entry: (typeof showcase)[number]; show: number }) {
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: show,
          background:
            "linear-gradient(180deg, rgba(5,7,14,0.15) 0%, transparent 30%, transparent 48%, rgba(4,6,12,0.9) 88%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "6%",
          right: "6%",
          bottom: "7%",
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
      {/* scanlines + curvature */}
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

/** Reduced-motion fallback: static title, then the station as a normal section. */
function ReducedTitleLibrary({ lang }: { lang: "en" | "nl" }) {
  const [selectedId, setSelectedId] = useState(showcase[0].id);
  const entry = showcase.find((e) => e.id === selectedId) ?? showcase[0];
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
          gap: 18,
          padding: "72px 16px 48px",
        }}
      >
        <Station>
          <div style={{ position: "relative", width: "min(600px, 94vw)", aspectRatio: "1130/756" }}>
            <img src={crtUrl} alt="" aria-hidden="true" style={{ width: "100%" }} />
            <div
              style={{
                position: "absolute",
                left: `${GLASS.left}%`,
                top: `${GLASS.top}%`,
                width: `${GLASS.width}%`,
                height: `${GLASS.height}%`,
                borderRadius: "24px / 30px",
                overflow: "hidden",
              }}
            >
              <img
                src={labelUrl(entry.id)}
                alt=""
                aria-hidden="true"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
              <ScreenChrome entry={entry} show={1} />
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
                onOpen={setSelectedId}
              />
            ))}
          </div>
        </Station>
      </section>
    </>
  );
}

function Station({ children }: { children: ReactNode }) {
  return <>{children}</>;
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
