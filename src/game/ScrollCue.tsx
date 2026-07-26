import { useReducedMotion } from "../motion/useReducedMotion";

/**
 * The scroll affordance for the pinned sequence.
 *
 * Inside a pinned sequence, scrolling animates rather than moves, so the usual
 * "the page is going somewhere, there is more below" feedback disappears and a
 * visitor cannot tell a transition from a finished screen. This cue makes the
 * difference explicit and teachable:
 *
 *   mid-transition - a dim bobbing chevron: keep going, this is still moving
 *   settled        - a bright labelled hint: this screen is yours to explore,
 *                    and there is more when you are done
 *
 * It stays out of the way of the title screen (which has its own cue) and of
 * the very bottom of the page (where there is nothing more to scroll to).
 */
export function ScrollCue({
  show,
  settled,
  atEnd,
  active,
}: {
  /** Past the title screen, where the sequence's own cue has handed over. */
  show: boolean;
  settled: boolean;
  atEnd: boolean;
  /** Current screen: the cue keeps clear of what each one puts at its foot. */
  active: string;
}) {
  const reduced = useReducedMotion();
  // Under reduced motion nothing is pinned, so ordinary scrolling already
  // tells the visitor everything this cue would.
  // The credits are the end of the game and carry their own call to action, so
  // they need no scroll cue at all.
  if (reduced || !show || atEnd || active === "contact") return null;

  // The constellation keeps its languages row at the foot of the screen; sit
  // above it rather than on top of it.
  const bottom = active === "skills" ? 84 : 14;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom,
        zIndex: 45,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: settled ? "7px 14px" : "6px 10px",
          borderRadius: 999,
          background: settled ? "rgba(8,13,28,0.82)" : "transparent",
          border: `1px solid ${settled ? "rgba(158,206,106,0.45)" : "transparent"}`,
          opacity: settled ? 1 : 0.38,
          transition: "opacity 0.35s ease, background 0.35s ease, border-color 0.35s ease",
        }}
      >
        <span
          className="cue-chev"
          style={{
            fontSize: settled ? 13 : 15,
            color: settled ? "var(--term-green)" : "#8fb6ff",
            lineHeight: 1,
          }}
        >
          ▼
        </span>
        {settled && (
          <span
            className="font-mono"
            style={{
              fontSize: 10.5,
              letterSpacing: 1.2,
              color: "var(--term-green)",
              whiteSpace: "nowrap",
            }}
          >
            LOOK AROUND · SCROLL FOR MORE
          </span>
        )}
      </div>
    </div>
  );
}
