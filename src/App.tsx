import { TitleScreen } from "./screens/TitleScreen";

/**
 * Retro-game portfolio (redesign in progress, built screen by screen).
 * Screen 1 (Title) is live. The remaining screens land here in order; for now
 * a stub gives the title's START / PRESS START somewhere to scroll to.
 */
export function App() {
  return (
    <>
      <TitleScreen />
      <section
        id="library"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
        }}
      >
        <p
          className="font-mono"
          style={{ color: "var(--term-dim)", fontSize: 13, textAlign: "center" }}
        >
          <span style={{ color: "var(--term-green)" }}>{"// "}</span>
          GAME LIBRARY — the cartridge showcase is built next
        </p>
      </section>
    </>
  );
}
