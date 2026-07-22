import { SCREENS, scrollToScreen } from "./screens";
import { useSettings } from "./settings";
import { useTheme } from "../theme/useTheme";

interface HudProps {
  hudProgress: number;
  active: string;
}

/**
 * The persistent HUD. Hidden while the title screen owns the viewport, it
 * slides down as the title exits so the title menu appears to lift into it.
 */
export function Hud({ hudProgress, active }: HudProps) {
  const { crt, toggleCrt, sound, toggleSound, lang, setLang } = useSettings();
  const { theme, setTheme } = useTheme();
  const isLight = theme === "paper";
  const shown = hudProgress > 0.02;

  return (
    <header
      aria-label="Game HUD"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transform: `translateY(${(hudProgress - 1) * 100}%)`,
        opacity: hudProgress,
        pointerEvents: shown ? "auto" : "none",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "9px 14px",
        fontFamily: "var(--font-mono)",
        background: "color-mix(in srgb, var(--term-bg) 88%, transparent)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--term-dim)",
      }}
    >
      <button
        onClick={() => scrollToScreen("title")}
        aria-label="Back to title"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          flex: "none",
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: 2,
            background: "var(--term-green)",
          }}
        />
        <span style={{ fontSize: 11, color: "var(--term-fg)", letterSpacing: 1 }}>
          ZACK
        </span>
      </button>

      <nav
        aria-label="Levels"
        style={{
          display: "flex",
          gap: 4,
          flex: 1,
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {SCREENS.map((s, i) => {
          const on = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => scrollToScreen(s.id)}
              aria-current={on ? "true" : undefined}
              style={{
                fontSize: 11,
                letterSpacing: 0.5,
                padding: "4px 9px",
                borderRadius: 6,
                whiteSpace: "nowrap",
                cursor: "pointer",
                border: "none",
                background: on ? "var(--term-accent)" : "transparent",
                color: on ? "var(--term-bg)" : "var(--term-dim)",
              }}
            >
              <span style={{ opacity: 0.6, marginRight: 5 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {s.label}
            </button>
          );
        })}
      </nav>

      <div style={{ display: "flex", gap: 4, alignItems: "center", flex: "none" }}>
        <Tool label={isLight ? "☀" : "☾"} title="Toggle light/dark" onClick={() => setTheme(isLight ? "tokyo-night" : "paper")} />
        <Tool label="CRT" title="Toggle CRT scanlines" active={crt} onClick={toggleCrt} small />
        <Tool label={sound ? "♪" : "♪̸"} title="Toggle sound" active={sound} onClick={toggleSound} />
        <Tool
          label={lang.toUpperCase()}
          title="Toggle language"
          onClick={() => setLang(lang === "en" ? "nl" : "en")}
          small
        />
      </div>
    </header>
  );
}

function Tool({
  label,
  title,
  onClick,
  active,
  small,
}: {
  label: string;
  title: string;
  onClick: () => void;
  active?: boolean;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      style={{
        minWidth: 30,
        height: 30,
        padding: small ? "0 8px" : 0,
        borderRadius: 7,
        fontSize: small ? 10 : 14,
        letterSpacing: 0.5,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active ? "var(--term-accent)" : "transparent",
        color: active ? "var(--term-bg)" : "var(--term-fg)",
        border: `1px solid ${active ? "var(--term-accent)" : "var(--term-dim)"}`,
      }}
    >
      {label}
    </button>
  );
}
