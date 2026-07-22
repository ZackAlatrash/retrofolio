import { GameShell } from "./game/GameShell";

/**
 * Retro-game portfolio (redesign in progress, built screen by screen).
 * The fused Title + Game Library sequence and the shell are live; remaining
 * screens are stubs. Debug: ?seq=<0..1> forces the sequence progress.
 */
export function App() {
  return <GameShell />;
}
