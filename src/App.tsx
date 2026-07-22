import { GameShell } from "./game/GameShell";
import { GameStation } from "./showcase/GameStation";

/**
 * Retro-game portfolio (redesign in progress, built screen by screen).
 * Title screen + shared game shell (HUD, level-select, chat, CRT) are live;
 * the remaining screens are stubs, built in order.
 */
export function App() {
  const debug =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("debug");
  if (debug === "projects") return <GameStation />;
  return <GameShell />;
}
