import { useState } from "react";
import { Cartridge } from "./Cartridge";
import {
  showcase,
  labelUrl,
  crtUrl,
  consoleUrl,
} from "./showcaseData";

/**
 * Projects "game station": a CRT preview on top (updates as you hover a
 * cartridge), the console with its slot, and the cartridge shelf below.
 * Clicking a cartridge will insert + boot the detail screen (built next).
 */
export function GameStation() {
  const [selectedId, setSelectedId] = useState(showcase[0].id);
  const entry = showcase.find((e) => e.id === selectedId) ?? showcase[0];
  const { project } = entry;

  return (
    <section
      id="projects"
      aria-label="Projects"
      style={{
        minHeight: "100vh",
        padding: "78px 20px 40px",
        scrollMarginTop: 52,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <div
        className="font-mono"
        style={{ fontSize: 12, color: "var(--term-dim)", letterSpacing: 1, marginBottom: 6 }}
      >
        <span style={{ color: "var(--term-green)" }}>{"// "}</span>GAME LIBRARY
      </div>

      {/* CRT preview */}
      <div style={{ position: "relative", width: "min(640px, 92vw)", aspectRatio: "1376 / 768" }}>
        <img src={crtUrl} alt="" aria-hidden="true" style={{ width: "100%", display: "block" }} />
        <div
          key={entry.id}
          className="crt-fade"
          style={{
            position: "absolute",
            left: "10%",
            top: "8%",
            width: "80%",
            height: "82%",
            display: "flex",
            alignItems: "center",
            gap: "5%",
            padding: "0 3%",
          }}
        >
          <img
            src={labelUrl(entry.id)}
            alt=""
            aria-hidden="true"
            style={{
              width: "38%",
              aspectRatio: "4 / 3",
              objectFit: "cover",
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="font-mono"
              style={{
                fontFamily: '"Press Start 2P", ui-monospace, monospace',
                fontSize: "clamp(10px, 2vw, 15px)",
                color: "#f4f4fb",
                textShadow: "2px 2px 0 #4a2f9e",
                lineHeight: 1.4,
              }}
            >
              {project.name.toUpperCase()}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(8px,1.3vw,11px)", color: "#7aa2f7", marginTop: 8, letterSpacing: 1 }}>
              {entry.genre}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(8px,1.3vw,11px)", color: "#9ece6a", marginTop: 6 }}>
              {entry.headline}
            </div>
            <div
              className="press-blink"
              style={{ fontFamily: '"Press Start 2P", ui-monospace, monospace', fontSize: "clamp(6px,1vw,8px)", color: "#fff", marginTop: 14 }}
            >
              ▸ PRESS START
            </div>
          </div>
        </div>
      </div>

      {/* console with slot */}
      <img
        src={consoleUrl}
        alt=""
        aria-hidden="true"
        style={{ width: "min(300px, 60vw)", display: "block", marginTop: -8 }}
      />

      {/* shelf */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))",
          gap: 14,
          width: "min(760px, 94vw)",
          marginTop: 8,
        }}
      >
        {showcase.map((e) => (
          <Cartridge
            key={e.id}
            entry={e}
            selected={e.id === selectedId}
            onSelect={setSelectedId}
            onOpen={setSelectedId}
          />
        ))}
      </div>
    </section>
  );
}
