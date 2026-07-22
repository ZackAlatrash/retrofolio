import { TitleScreen } from "../screens/TitleScreen";
import { Hud } from "./Hud";
import { HelpWidget } from "./HelpWidget";
import { CrtOverlay } from "./CrtOverlay";
import { useGameRoute } from "./useGameRoute";

/**
 * The retro-game shell: the Title screen, the remaining screens (stubs for now,
 * built in order), the persistent HUD that the title menu lifts into, the
 * floating chat, and the CRT overlay.
 */
export function GameShell() {
  const { hudProgress, active } = useGameRoute();
  return (
    <>
      <TitleScreen />
      <Stub id="about" n={2} title="ABOUT" note="the character card is built here" />
      <Stub id="projects" n={3} title="GAME LIBRARY" note="the cartridge showcase is next" />
      <Stub id="skills" n={4} title="SKILL TREE" note="skills screen" />
      <Stub id="patch" n={5} title="PATCH NOTES" note="dev log" />
      <Stub id="contact" n={6} title="CREDITS" note="contact screen" />
      <Hud hudProgress={hudProgress} active={active} />
      <HelpWidget />
      <CrtOverlay />
    </>
  );
}

function Stub({
  id,
  n,
  title,
  note,
}: {
  id: string;
  n: number;
  title: string;
  note: string;
}) {
  return (
    <section
      id={id}
      aria-label={title}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "72px 24px 24px",
        scrollMarginTop: 52,
        borderTop: "1px solid color-mix(in srgb, var(--term-dim) 40%, transparent)",
      }}
    >
      <span
        className="font-mono"
        style={{ fontSize: 12, color: "var(--term-green)", letterSpacing: 1 }}
      >
        LEVEL {String(n).padStart(2, "0")}
      </span>
      <h2 style={{ fontSize: 22, color: "var(--term-fg)", margin: 0 }}>{title}</h2>
      <span
        className="font-mono"
        style={{ fontSize: 12, color: "var(--term-dim)" }}
      >
        <span style={{ color: "var(--term-green)" }}>{"// "}</span>
        {note}
      </span>
    </section>
  );
}
