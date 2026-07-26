import { TitleLibrary } from "../screens/TitleLibrary";
import { AboutScreen } from "../screens/AboutScreen";
import { GameNav } from "./GameNav";
import { HelpWidget } from "./HelpWidget";
import { CrtOverlay } from "./CrtOverlay";
import { useGameRoute } from "./useGameRoute";
import { useReducedMotion } from "../motion/useReducedMotion";
import { SkillsPage } from "../screens/SkillsPage";
import { ContactScreen } from "../screens/ContactScreen";
import { ScrollCue } from "./ScrollCue";

const MOCK =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("mock")
    : null;

/**
 * The retro-game shell. One pinned sequence carries Title -> Projects -> About
 * -> Skills on the same television (the camera never cuts), then the credits
 * roll closes the game. Plus the HUD nav, the floating help chat and the CRT
 * overlay.
 *
 * Debug: ?mock=skills / ?mock=contact render a single screen on its own.
 */
export function GameShell() {
  const { reveal, morph, active, progress, ticks, settled, atEnd } = useGameRoute();
  const reducedMotion = useReducedMotion();

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
        <section
          id="skills"
          aria-label="Skills"
          style={{ minHeight: "100vh", position: "relative" }}
        >
          <SkillsPage reveal={1} interactive />
        </section>
        <CrtOverlay />
      </>
    );
  }

  return (
    <>
      <TitleLibrary />
      {/* Under reduced motion the camera move is skipped, so the card and the
          constellation need plain sections; otherwise both live inside the
          pinned sequence above. */}
      {reducedMotion && <AboutScreen />}
      {reducedMotion && (
        <section
          id="skills"
          aria-label="Skills"
          style={{ minHeight: "100vh", position: "relative" }}
        >
          <SkillsPage reveal={1} interactive />
        </section>
      )}
      <ContactScreen />
      <GameNav
        reveal={reveal}
        morph={morph}
        active={active}
        progress={progress}
        ticks={ticks}
      />
      {/* the title screen has its own cue, so this takes over after it */}
      <ScrollCue show={reveal > 0.9} settled={settled} atEnd={atEnd} />
      <HelpWidget />
      <CrtOverlay />
    </>
  );
}
