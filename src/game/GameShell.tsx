import { TitleLibrary } from "../screens/TitleLibrary";
import { AboutScreen } from "../screens/AboutScreen";
import { GameNav } from "./GameNav";
import { HelpWidget } from "./HelpWidget";
import { CrtOverlay } from "./CrtOverlay";
import { useGameRoute } from "./useGameRoute";
import { useReducedMotion } from "../motion/useReducedMotion";
import { SkillsPage } from "../screens/SkillsPage";
import { ContactScreen } from "../screens/ContactScreen";

const MOCK =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("mock")
    : null;


/**
 * The retro-game shell: the fused Title + Game Library sequence (one continuous
 * television), the remaining screens (stubs for now, built in order), the game
 * HUD nav, the floating chat, and the CRT overlay.
 */
export function GameShell() {
  const { reveal, morph, active } = useGameRoute();
  const reducedMotion = useReducedMotion();
  // Mockup review: the skills constellation solo, fully revealed.
  if (MOCK === "contact") {
    return (
      <>
        <ContactScreen />
        <CrtOverlay />
      </>
    );
  }
  if (MOCK === "skills") {
    return (
      <>
        <section id="skills" aria-label="Skills" style={{ minHeight: "100vh", position: "relative" }}>
          <SkillsPage reveal={1} interactive />
        </section>
        <CrtOverlay />
      </>
    );
  }
  return (
    <>
      <TitleLibrary />
      {/* Under reduced motion the camera move is skipped, so the card needs a
          plain section; otherwise it resolves inside the handheld. */}
      {reducedMotion && <AboutScreen />}
      {reducedMotion && (
        <section id="skills" aria-label="Skills" style={{ minHeight: "100vh", position: "relative" }}>
          <SkillsPage reveal={1} interactive />
        </section>
      )}
      <Stub id="patch" n={5} title="PATCH NOTES" note="dev log" />
      <ContactScreen />
      <GameNav reveal={reveal} morph={morph} active={active} />
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
