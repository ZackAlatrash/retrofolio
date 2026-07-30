import { useEffect, useState, type CSSProperties } from "react";
import { scrollToScreen } from "./screens";
import { showcase } from "../showcase/showcaseData";
import { useSettings } from "./settings";
import { useReducedMotion } from "../motion/useReducedMotion";
import { useLayoutProfile } from "./useLayoutProfile";

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
  const { hoverless } = useLayoutProfile();
  const { lang, setLang } = useSettings();

  const n = ITEMS.length;
  const mid = (n - 1) / 2;
  const cx = W / 2;
  // One compact, centered gap for both states, so the title menu is a tight
  // cluster (not a full-width bar) and rises straight up into the HUD.
  const gap = clamp((W - 560) / (n - 1), 100, 158);
  const y = lerp(H * 0.66, BAR_H / 2, t);
  const chromeOn = t > 0.5;
  /**
   * Below this the spaced-out layout cannot hold.
   *
   * Items sit at fixed centres `gap` apart and the gap floors at 100px, so the
   * group is about 426px wide whatever the screen is. Clearing the player chip
   * on the left needs `W/2 - 213 > 162`, which is only true from about 750px
   * up, and its items only stop overlapping each other by the width of their
   * own padding once the gap exceeds 112px, which needs about 896px. Under
   * that, items ran off both edges and printed over each other and over the
   * chip. Narrow gets a real row instead, sized to the space it has.
   *
   * Touch takes the same row at any width. Even where the spaced layout fits,
   * its items are 34px tall and their boxes overlap by the width of their
   * padding, so which one a tap lands on depends on paint order.
   */
  const compact = W < 900 || hoverless;
  /**
   * The bar shrinks its menu slightly as it descends. Compact stops at 1: the
   * shrink was scaling a 44px target down to 40 and quietly undoing it.
   */
  const scale = lerp(1.05, compact ? 1 : 0.9, t);

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
          aria-hidden="true"
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
            minHeight: 44,
            minWidth: 44,
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
          {/* The name is the first thing to go: it is 109px that the four nav
              labels need more, and the chip alone still says whose HUD this is. */}
          {!compact && (
            <span style={{ fontSize: 14, color: "var(--term-fg)", letterSpacing: 0.5 }}>
              ZACK ALATRASH
            </span>
          )}
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
          {/* Decoration, and the project count is already on the library
              screen, so it yields to the nav on a narrow bar. */}
          {!compact && (
            <span
              title={`${showcase.length} projects shipped`}
              style={{
                fontSize: 13,
                color: "var(--term-accent)",
                marginRight: 4,
                letterSpacing: 0.5,
              }}
            >
              ◆ {showcase.length}
            </span>
          )}
          <Key
            label={lang.toUpperCase()}
            title="Language"
            onClick={() => setLang(lang === "en" ? "nl" : "en")}
          />
        </div>
      </div>

      {/* nav items: centered group, descends into the bar */}
      {compact ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: y,
            transform: `translateY(-50%) scale(${scale})`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            // Sized against the space there actually is rather than a fixed
            // centre-to-centre gap, so four labels fit from 320px up.
            gap: "clamp(1px, 1.2vw, 10px)",
            // The chip (44 + 18 left) and the language key (44 + 16 right)
            // hold their places while this row shrinks, so the row is inset
            // past both rather than centred over them.
            padding: "0 70px",
            pointerEvents: "none",
          }}
        >
          {ITEMS.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              highlight={chromeOn && active === item.id}
              isActive={active === item.id}
              opacity={r}
              compact
            />
          ))}
        </div>
      ) : (
        ITEMS.map((item, i) => (
          <NavItem
            key={item.id}
            item={item}
            index={i}
            highlight={chromeOn && active === item.id}
            isActive={active === item.id}
            opacity={r}
            style={{
              position: "absolute",
              left: cx + (i - mid) * gap,
              top: y,
              transform: `translate(-50%, -50%) scale(${scale})`,
              transformOrigin: "center",
            }}
          />
        ))
      )}

    </div>
  );
}

/**
 * One nav entry, laid out either at a fixed centre (wide) or as a flex child
 * (narrow). The numeral is dropped when compact: it costs about 24px an item,
 * which is the difference between four labels fitting and not.
 */
function NavItem({
  item,
  index,
  highlight,
  isActive,
  opacity,
  compact,
  style,
}: {
  item: { id: string; label: string };
  index?: number;
  highlight: boolean;
  isActive: boolean;
  opacity: number;
  compact?: boolean;
  style?: CSSProperties;
}) {
  return (
    <button
      onClick={() => scrollToScreen(item.id)}
      aria-current={isActive ? "true" : undefined}
      style={{
        ...style,
        fontFamily: "var(--font-mono)",
        fontSize: compact ? "clamp(10px, 3.1vw, 15px)" : 16,
        letterSpacing: compact ? 0.4 : 1,
        whiteSpace: "nowrap",
        cursor: "pointer",
        pointerEvents: "auto",
        border: highlight ? "1px solid var(--term-accent)" : "1px solid transparent",
        borderRadius: 7,
        padding: compact ? "0 clamp(2px, 1.4vw, 12px)" : "6px 12px",
        // A finger needs the whole bar height, not the text's own box. Width
        // too: ABOUT and SKILLS are short enough to fall under it at 320px.
        minHeight: compact ? 44 : undefined,
        display: compact ? "flex" : undefined,
        alignItems: compact ? "center" : undefined,
        minWidth: compact ? 44 : 0,
        opacity,
        background: highlight ? "var(--term-accent)" : "transparent",
        color: highlight ? "var(--term-bg)" : "var(--term-fg)",
        // the highlight eases; position/scale stay scroll-exact
        transition:
          "background 0.18s ease, color 0.18s ease, border-color 0.18s ease",
      }}
    >
      {!compact && index != null && (
        <span
          style={{
            ...pixel,
            fontSize: "0.6em",
            color: highlight ? "var(--term-bg)" : "var(--term-green)",
            marginRight: 8,
            opacity: 0.85,
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      {item.label}
    </button>
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
        // The key face stays 30px; the button around it is a finger's worth.
        height: 44,
        minWidth: 44,
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

