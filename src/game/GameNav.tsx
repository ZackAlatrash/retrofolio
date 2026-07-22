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

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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
 * The persistent game HUD. On the title screen the nav items sit centered under
 * the name; as the title exits they travel and shrink up into a HUD bar while
 * the player chip, coin, keycap toggles and control hints boot in around them.
 */
export function GameNav({ reveal, morph, active }: GameNavProps) {
  const prefersReduced = useReducedMotion();
  const forceMotion =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("motion");
  const reduced = prefersReduced && !forceMotion;

  const t = reduced ? 1 : morph;
  const r = reduced ? 1 : reveal;
  const { w: W, h: H } = useWindowSize();
  const { crt, toggleCrt, sound, toggleSound, lang, setLang } = useSettings();
  const { theme, setTheme } = useTheme();
  const isLight = theme === "paper";

  const n = ITEMS.length;
  const barGap = Math.min(112, Math.max(74, (W - 340) / n));
  const barStart = 156;
  const heroGap = Math.min(168, (W - 40) / n);
  const heroStart = (W - heroGap * n) / 2 + heroGap / 2;
  const heroY = H * 0.64;
  const barY = 21;
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
          height: 42,
          background: "color-mix(in srgb, var(--term-bg) 92%, transparent)",
          borderBottom: "2px solid var(--term-accent)",
          backdropFilter: "blur(8px)",
          opacity: t,
          pointerEvents: chromeOn ? "auto" : "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -3,
            height: 2,
            background:
              "linear-gradient(90deg, var(--term-green), var(--term-accent) 55%, transparent)",
            opacity: 0.5,
          }}
        />
        <button
          onClick={() => scrollToScreen("title")}
          aria-label="Back to title"
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 7,
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <span style={{ ...pixel, fontSize: 8, color: "var(--term-amber)" }}>
            P1
          </span>
          <span style={{ fontSize: 11, color: "var(--term-fg)", letterSpacing: 0.5 }}>
            ZACK ALATRASH
          </span>
        </button>

        <div
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 10, color: "var(--term-accent)", marginRight: 2 }}>
            ◆ 12
          </span>
          <Key label={isLight ? "☀" : "☾"} title="Light / dark" onClick={() => setTheme(isLight ? "tokyo-night" : "paper")} />
          <Key label="CRT" title="CRT scanlines" on={crt} onClick={toggleCrt} />
          <Key label={sound ? "♪" : "♪̸"} title="Sound" on={sound} onClick={toggleSound} />
          <Key label={lang.toUpperCase()} title="Language" onClick={() => setLang(lang === "en" ? "nl" : "en")} />
        </div>
      </div>

      {/* nav items (morphing) */}
      {ITEMS.map((item, i) => {
        const x = lerp(heroStart + i * heroGap, barStart + i * barGap, t);
        const y = lerp(heroY, barY, t);
        const s = lerp(1, 0.62, t);
        const isActive = chromeOn && active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => scrollToScreen(item.id)}
            aria-current={isActive ? "true" : undefined}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) scale(${s})`,
              transformOrigin: "center",
              fontFamily: "var(--font-mono)",
              fontSize: 15,
              letterSpacing: 1,
              whiteSpace: "nowrap",
              cursor: "pointer",
              pointerEvents: "auto",
              border: "none",
              borderRadius: 6,
              padding: chromeOn ? "5px 9px" : "4px 6px",
              opacity: r,
              background: isActive ? "var(--term-accent)" : "transparent",
              color: isActive
                ? "var(--term-bg)"
                : i === 0 && !chromeOn
                  ? "var(--term-amber)"
                  : "var(--term-fg)",
            }}
          >
            <span style={{ ...pixel, fontSize: "0.62em", color: "var(--term-dim)", marginRight: 6 }}>
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
          height: 26,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 14px",
          background: "color-mix(in srgb, var(--term-bg) 70%, transparent)",
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
}: {
  label: string;
  title: string;
  onClick: () => void;
  on?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={on}
      style={{
        ...pixel,
        fontSize: 7,
        padding: "5px 6px",
        borderRadius: 3,
        cursor: "pointer",
        color: on ? "var(--term-bg)" : "var(--term-fg)",
        background: on ? "var(--term-accent)" : "color-mix(in srgb, var(--term-fg) 6%, transparent)",
        border: `1px solid ${on ? "var(--term-accent)" : "var(--term-dim)"}`,
      }}
    >
      {label}
    </button>
  );
}

function Hint({ keys, label }: { keys: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span
        style={{
          ...pixel,
          fontSize: 6,
          color: "var(--term-fg)",
          border: "1px solid var(--term-dim)",
          borderRadius: 2,
          padding: "3px 4px",
        }}
      >
        {keys}
      </span>
      <span style={{ fontSize: 9, color: "var(--term-dim)" }}>{label}</span>
    </span>
  );
}
