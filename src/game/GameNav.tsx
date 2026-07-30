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
const smooth = (x: number, a: number, b: number) => {
  if (b <= a) return x >= b ? 1 : 0;
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

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
  const [menuOpen, setMenuOpen] = useState(false);

  // Arriving somewhere is the end of using the menu, so it closes itself.
  useEffect(() => setMenuOpen(false), [active]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

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
  const activeIndex = ITEMS.findIndex((i) => i.id === active);
  const activeLabel = activeIndex >= 0 ? ITEMS[activeIndex].label : "TITLE";
  /**
   * The vertical title menu needs about 188px between PRESS START and the
   * footer. That band is roughly `0.42H - 104`, so it only exists from about
   * 724px of viewport height; under that the menu printed over both. Short
   * phones keep an uncluttered title screen and meet the nav a moment later, as
   * the bar forms, which is where it is a single full-size control anyway.
   */
  const stackedMenu = compact && H >= 740;
  /**
   * The stacked menu's fade lives on its container (the scrim behind the rows
   * has to go with it), so the container is also what disarms: a child cannot
   * see an ancestor's opacity, and these rows sit over the hero at opacity 0
   * for the whole title screen.
   */
  const stackedOpacity = r * (1 - smooth(t, 0.15, 0.5));

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

        {/*
          One control instead of four. Six controls did not fit a phone bar:
          that is what forced 10px labels and 4px gaps between touch targets.
          A journey this linear is scrolled rather than jumped through, so the
          bar spends its room saying where you are, and holds the jumps behind
          a tap where they can be full size.
        */}
        {compact && (
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="hud-menu"
            aria-label={`Screen ${activeLabel}. Open screen menu`}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              minHeight: 44,
              padding: "0 14px",
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              letterSpacing: 0.6,
              color: "var(--term-fg)",
              background: menuOpen
                ? "color-mix(in srgb, var(--term-accent) 22%, transparent)"
                : "color-mix(in srgb, var(--term-fg) 7%, transparent)",
              border: `1px solid ${menuOpen ? "var(--term-accent)" : "var(--term-dim)"}`,
              opacity: smooth(t, 0.5, 0.85),
              pointerEvents: t > 0.6 ? "auto" : "none",
              transition: "background 0.18s ease, border-color 0.18s ease",
            }}
          >
            <span aria-hidden="true" style={{ ...pixel, fontSize: 9, color: "var(--term-green)" }}>
              {activeIndex >= 0 ? String(activeIndex + 1).padStart(2, "0") : "//"}
            </span>
            {activeLabel}
            <span aria-hidden="true" style={{ fontSize: 10, color: "var(--term-dim)" }}>
              {menuOpen ? "▲" : "▼"}
            </span>
          </button>
        )}
      </div>

      {compact && menuOpen && (
        <>
          {/* Tapping anywhere else is the ordinary way to dismiss a sheet. */}
          <button
            aria-label="Close screen menu"
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(4,6,14,0.5)",
              border: "none",
              cursor: "pointer",
              pointerEvents: "auto",
            }}
          />
          <div
            id="hud-menu"
            role="group"
            aria-label="Screens"
            style={{
              position: "fixed",
              top: BAR_H + 6,
              left: 10,
              right: 10,
              zIndex: 1,
              borderRadius: 12,
              overflow: "hidden",
              background: "color-mix(in srgb, var(--term-bg) 97%, transparent)",
              border: "1px solid var(--term-accent)",
              boxShadow: "0 18px 46px rgba(0,0,0,0.6)",
              pointerEvents: "auto",
            }}
          >
            {ITEMS.map((item, i) => (
              <MenuRow
                key={item.id}
                numeral={String(i + 1).padStart(2, "0")}
                label={item.label}
                isActive={active === item.id}
                onClick={() => {
                  setMenuOpen(false);
                  scrollToScreen(item.id);
                }}
              />
            ))}
            {/* The P1 chip does this too, but an amber badge does not say so. */}
            <MenuRow
              numeral="//"
              label="TITLE"
              isActive={active === "title"}
              onClick={() => {
                setMenuOpen(false);
                scrollToScreen("title");
              }}
            />
          </div>
        </>
      )}

      {/* nav items: centered group, descends into the bar */}
      {compact ? (
        // Unrendered rather than transparent once the crossfade is done, so it
        // leaves the tab order too.
        stackedMenu && t < 0.5 && (
        /*
         * The title screen has vertical room and nothing else competing for it,
         * so the menu is a vertical list: the classic title-screen shape, and
         * the only one that gives four full-size rows on a phone. It cannot
         * position-lerp into a horizontal bar the way the wide menu does, so it
         * crossfades instead, out over the first half of the descent while the
         * bar's own control fades in over the second.
         */
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: H * 0.58,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            opacity: stackedOpacity,
            pointerEvents: stackedOpacity < 0.05 || t >= 0.4 ? "none" : "auto",
          }}
        >
          {/* The title frame puts its cartridge shelf right here, and the lower
              rows landed on its lit edges. The wide menu sits in clear space and
              needs nothing; this one has to make its own. */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 300,
              height: "calc(100% + 34px)",
              borderRadius: 18,
              background:
                "radial-gradient(58% 52% at 50% 50%, rgba(6,9,20,0.9), rgba(6,9,20,0.55) 72%, transparent)",
              pointerEvents: "none",
            }}
          />
          {ITEMS.map((item, i) => (
            <NavItem
              key={item.id}
              item={item}
              index={i}
              highlight={false}
              isActive={active === item.id}
              opacity={1}
              stacked
            />
          ))}
        </div>
        )
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
  stacked,
  style,
}: {
  item: { id: string; label: string };
  index?: number;
  highlight: boolean;
  isActive: boolean;
  opacity: number;
  compact?: boolean;
  /** The phone's title-screen menu: a vertical list of full-width rows. */
  stacked?: boolean;
  style?: CSSProperties;
}) {
  return (
    <button
      onClick={() => scrollToScreen(item.id)}
      aria-current={isActive ? "true" : undefined}
      style={{
        ...style,
        fontFamily: "var(--font-mono)",
        fontSize: stacked ? 15 : compact ? "clamp(10px, 3.1vw, 15px)" : 16,
        letterSpacing: stacked ? 1.4 : compact ? 0.4 : 1,
        whiteSpace: "nowrap",
        cursor: "pointer",
        // Faded out means gone, not merely invisible: without this a menu at
        // opacity 0 still swallowed taps meant for the screen behind it. The
        // stacked variant defers to its container, which is where its own fade
        // and its scrim live.
        pointerEvents: stacked ? undefined : opacity < 0.05 ? "none" : "auto",
        border: highlight ? "1px solid var(--term-accent)" : "1px solid transparent",
        borderRadius: 7,
        padding: stacked ? "0 18px" : compact ? "0 clamp(2px, 1.4vw, 12px)" : "6px 12px",
        // A finger needs the whole bar height, not the text's own box. Width
        // too: ABOUT and SKILLS are short enough to fall under it at 320px.
        minHeight: stacked || compact ? 44 : undefined,
        display: stacked || compact ? "flex" : undefined,
        alignItems: stacked || compact ? "center" : undefined,
        justifyContent: stacked ? "center" : undefined,
        gap: stacked ? 10 : undefined,
        minWidth: stacked ? 210 : compact ? 44 : 0,
        opacity,
        background: highlight ? "var(--term-accent)" : "transparent",
        color: highlight ? "var(--term-bg)" : "var(--term-fg)",
        // the highlight eases; position/scale stay scroll-exact
        transition:
          "background 0.18s ease, color 0.18s ease, border-color 0.18s ease",
      }}
    >
      {(!compact || stacked) && index != null && (
        <span
          style={{
            ...pixel,
            fontSize: stacked ? 9 : "0.6em",
            color: highlight ? "var(--term-bg)" : "var(--term-green)",
            marginRight: stacked ? 0 : 8,
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

/** A destination in the phone menu: a full-width row, sized for a thumb. */
function MenuRow({
  numeral,
  label,
  isActive,
  onClick,
}: {
  numeral: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={isActive ? "true" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        minHeight: 52,
        padding: "0 16px",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "var(--font-mono)",
        fontSize: 15,
        letterSpacing: 0.8,
        border: "none",
        borderTop: "1px solid color-mix(in srgb, var(--term-dim) 40%, transparent)",
        color: isActive ? "var(--term-bg)" : "var(--term-fg)",
        background: isActive ? "var(--term-accent)" : "transparent",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          ...pixel,
          fontSize: 9,
          color: isActive ? "var(--term-bg)" : "var(--term-green)",
          opacity: 0.9,
        }}
      >
        {numeral}
      </span>
      {label}
    </button>
  );
}

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

