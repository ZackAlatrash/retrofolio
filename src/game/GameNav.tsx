import { useEffect, useState, type CSSProperties } from "react";
import { scrollToScreen } from "./screens";
import { useSettings } from "./settings";
import { useTheme } from "../theme/useTheme";
import { useReducedMotion } from "../motion/useReducedMotion";

const ITEMS = [
  { id: "projects", label: "PROJECTS" },
  { id: "about", label: "ABOUT" },
  { id: "skills", label: "SKILLS" },
  { id: "contact", label: "CONTACT" },
];

const BAR_H = 58;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

function useWindowSize() {
  const [size, setSize] = useState(() => ({
    w: typeof window === "undefined" ? 1280 : window.innerWidth,
    h: typeof window === "undefined" ? 720 : window.innerHeight,
  }));
  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return size;
}

interface GameNavProps {
  reveal: number;
  morph: number;
  active: string;
}

/**
 * The persistent game HUD. On the title screen the nav sits centered under the
 * name as a big title-screen menu; as the title exits it descends (staying
 * centered, spacing tightening) into a chunky HUD bar, while the player chip,
 * coin, keycap toggles and control hints boot in at the edges.
 */
export function GameNav({ reveal, morph, active }: GameNavProps) {
  const prefersReduced = useReducedMotion();
  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const forceMotion = params.has("motion");
  const forcedM = params.get("m"); // debug: force a fixed morph value
  const reduced = prefersReduced && !forceMotion;

  const t = forcedM != null ? parseFloat(forcedM) : reduced ? 1 : morph;
  const r = forcedM != null ? 1 : reduced ? 1 : reveal;

  const { w: W, h: H } = useWindowSize();
  const { crt, toggleCrt, sound, toggleSound, lang, setLang } = useSettings();
  const { theme, setTheme } = useTheme();
  const isLight = theme === "paper";

  const n = ITEMS.length;
  const mid = (n - 1) / 2;
  const cx = W / 2;
  const heroGap = clamp((W - 120) / (n - 1), 130, 220);
  const barGap = clamp((W - 560) / (n - 1), 118, 172);
  const gap = lerp(heroGap, barGap, t);
  const y = lerp(H * 0.66, BAR_H / 2, t);
  const scale = lerp(1.5, 0.95, t);
  const chromeOn = t > 0.5;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        pointerEvents: "none",
        fontFamily: "var(--font-mono)",
      }}
    >
      {/* bar background + player + toggles */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: BAR_H,
          background: "color-mix(in srgb, var(--term-bg) 94%, transparent)",
          borderBottom: "2px solid var(--term-accent)",
          boxShadow: "0 2px 20px rgba(0,0,0,0.35)",
          backdropFilter: "blur(10px)",
          opacity: t,
          pointerEvents: chromeOn ? "auto" : "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -4,
            height: 2,
            background:
              "linear-gradient(90deg, var(--term-green), var(--term-accent) 55%, transparent)",
            opacity: 0.55,
          }}
        />
        <button
          onClick={() => scrollToScreen("title")}
          aria-label="Back to title"
          style={{
            position: "absolute",
            left: 18,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 9,
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              ...pixel,
              fontSize: 9,
              color: "var(--term-bg)",
              background: "var(--term-amber)",
              padding: "5px 6px",
              borderRadius: 4,
            }}
          >
            P1
          </span>
          <span style={{ fontSize: 14, color: "var(--term-fg)", letterSpacing: 0.5 }}>
            ZACK ALATRASH
          </span>
        </button>

        <div
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{ fontSize: 13, color: "var(--term-accent)", marginRight: 4, letterSpacing: 0.5 }}
          >
            ◆ 12
          </span>
          <Key big label={isLight ? "☀" : "☾"} title="Light / dark" onClick={() => setTheme(isLight ? "tokyo-night" : "paper")} />
          <Key label="CRT" title="CRT scanlines" on={crt} onClick={toggleCrt} />
          <Key big label={sound ? "♪" : "♪̸"} title="Sound" on={sound} onClick={toggleSound} />
          <Key label={lang.toUpperCase()} title="Language" onClick={() => setLang(lang === "en" ? "nl" : "en")} />
        </div>
      </div>

      {/* nav items: centered group, descends into the bar */}
      {ITEMS.map((item, i) => {
        const x = cx + (i - mid) * gap;
        const isActive = active === item.id;
        const highlight = chromeOn && isActive;
        return (
          <button
            key={item.id}
            onClick={() => scrollToScreen(item.id)}
            aria-current={isActive ? "true" : undefined}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) scale(${scale})`,
              transformOrigin: "center",
              fontFamily: "var(--font-mono)",
              fontSize: 16,
              letterSpacing: 1,
              whiteSpace: "nowrap",
              cursor: "pointer",
              pointerEvents: "auto",
              border: highlight ? "1px solid var(--term-accent)" : "1px solid transparent",
              borderRadius: 7,
              padding: "6px 12px",
              opacity: r,
              background: highlight ? "var(--term-accent)" : "transparent",
              color: highlight ? "var(--term-bg)" : "var(--term-fg)",
            }}
          >
            <span style={{ ...pixel, fontSize: "0.6em", color: highlight ? "var(--term-bg)" : "var(--term-green)", marginRight: 8, opacity: 0.85 }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            {item.label}
          </button>
        );
      })}

      {/* control hints */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 30,
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "0 16px",
          background: "color-mix(in srgb, var(--term-bg) 78%, transparent)",
          borderTop: "1px solid var(--term-dim)",
          opacity: t,
          pointerEvents: "none",
        }}
      >
        <Hint keys="◄ ►" label="NAVIGATE" />
        <Hint keys="⏎" label="SELECT" />
        <Hint keys="?" label="ASK" />
      </div>
    </div>
  );
}

const pixel: CSSProperties = {
  fontFamily: '"Press Start 2P", ui-monospace, monospace',
};

function Key({
  label,
  title,
  onClick,
  on,
  big,
}: {
  label: string;
  title: string;
  onClick: () => void;
  on?: boolean;
  big?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={on}
      style={{
        height: 30,
        minWidth: 30,
        padding: "0 9px",
        borderRadius: 6,
        fontFamily: big ? "var(--font-mono)" : '"Press Start 2P", ui-monospace, monospace',
        fontSize: big ? 15 : 9,
        letterSpacing: 0.5,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: on ? "var(--term-bg)" : "var(--term-fg)",
        background: on ? "var(--term-accent)" : "color-mix(in srgb, var(--term-fg) 8%, transparent)",
        border: `1px solid ${on ? "var(--term-accent)" : "var(--term-dim)"}`,
      }}
    >
      {label}
    </button>
  );
}

function Hint({ keys, label }: { keys: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          fontFamily: '"Press Start 2P", ui-monospace, monospace',
          fontSize: 8,
          color: "var(--term-fg)",
          border: "1px solid var(--term-dim)",
          borderRadius: 3,
          padding: "4px 5px",
        }}
      >
        {keys}
      </span>
      <span style={{ fontSize: 11, color: "var(--term-dim)", letterSpacing: 0.5 }}>{label}</span>
    </span>
  );
}
