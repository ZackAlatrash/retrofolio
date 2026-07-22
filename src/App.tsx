import { GameShell } from "./game/GameShell";

/**
 * Retro-game portfolio (redesign in progress, built screen by screen).
 * Title screen + shared game shell (HUD, level-select, chat, CRT) are live;
 * the remaining screens are stubs, built in order.
 */
export function App() {
  return <GameShell />;
}
