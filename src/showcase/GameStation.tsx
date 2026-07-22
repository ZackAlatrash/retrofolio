import { useState, type CSSProperties } from "react";
import { Cartridge } from "./Cartridge";
import { showcase, labelUrl, crtUrl, consoleUrl } from "./showcaseData";

const PIXEL = '"Press Start 2P", ui-monospace, monospace';

const ventStyle: CSSProperties = {
  flex: 1,
  maxWidth: 110,
  height: 52,
  alignSelf: "center",
  background: "repeating-linear-gradient(180deg, #242637 0 3px, #181a27 3px 7px)",
  borderRadius: 4,
  border: "1px solid #10111c",
  margin: "0 20px",
};

// The CRT glass rectangle within the TV image, as percentages of the image box.
// Tuned visually against public/game/crt.webp.
const GLASS = { left: "4.9%", top: "5.4%", width: "90.2%", height: "87.4%" };

/**
 * Projects "game station": an entertainment-center scene. The CRT TV (full-
 * bleed title screen for the selected project) sits above a media cabinet; the
 * console rests on the cabinet's top board and the cartridges stand in a
 * recessed rack shelf below. Hover previews; click will insert + boot (next).
 */
export function GameStation() {
  const [selectedId, setSelectedId] = useState(showcase[0].id);
  const entry = showcase.find((e) => e.id === selectedId) ?? showcase[0];

  return (
    <section
      id="projects"
      aria-label="Projects"
      style={{
        minHeight: "100vh",
        padding: "72px 16px 48px",
        scrollMarginTop: 52,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* room ambience */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(90% 65% at 50% 34%, rgba(122,162,247,0.07), transparent 60%), radial-gradient(120% 100% at 50% 100%, rgba(0,0,0,0.5), transparent 55%)",
          pointerEvents: "none",
        }}
      />

      {/* header */}
      <div style={{ textAlign: "center", marginBottom: 18, position: "relative" }}>
        <div
          className="font-mono"
          style={{ fontSize: 11, color: "var(--term-green)", letterSpacing: 2, marginBottom: 10 }}
        >
          {"// STAGE 03"}
        </div>
        <h2
          style={{
            fontFamily: PIXEL,
            fontWeight: 400,
            fontSize: "clamp(15px, 2.6vw, 24px)",
            color: "#f4f4fb",
            textShadow: "2px 2px 0 #4a2f9e",
            letterSpacing: 1,
            margin: 0,
          }}
        >
          GAME LIBRARY
        </h2>
      </div>

      {/* ==== the TV ==== */}
      <div
        style={{
          position: "relative",
          aspectRatio: "1130 / 756",
          zIndex: 2,
        }}
        className="station-tv"
      >
        {/* phosphor glow behind the set */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: "-14% -10%",
            background:
              "radial-gradient(60% 58% at 50% 46%, rgba(122,162,247,0.32), transparent 72%)",
            pointerEvents: "none",
          }}
        />
        <img
          src={crtUrl}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            borderRadius: "18px",
            filter: "drop-shadow(0 24px 40px rgba(0,0,0,0.55))",
          }}
        />
        {/* the glass: full-bleed art + overlay */}
        <div
          key={entry.id}
          className="crt-flicker"
          style={{
            position: "absolute",
            left: GLASS.left,
            top: GLASS.top,
            width: GLASS.width,
            height: GLASS.height,
            borderRadius: "24px / 30px",
            overflow: "hidden",
            background: "#0a0c16",
          }}
        >
          <img
            src={labelUrl(entry.id)}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {/* bottom scrim for legibility */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(5,7,14,0.18) 0%, transparent 30%, transparent 46%, rgba(4,6,12,0.9) 88%)",
            }}
          />
          {/* title block */}
          <div
            style={{
              position: "absolute",
              left: "6%",
              right: "6%",
              bottom: "7%",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: PIXEL,
                  fontSize: "clamp(11px, 2.2vw, 19px)",
                  color: "#f4f4fb",
                  textShadow: "2px 2px 0 rgba(20,10,60,0.9), 0 0 14px rgba(122,162,247,0.35)",
                  lineHeight: 1.35,
                }}
              >
                {entry.title}
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: "clamp(8px, 1.2vw, 11px)",
                  color: "#8fb6ff",
                  letterSpacing: 1.2,
                  marginTop: 7,
                  textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                }}
              >
                {entry.genre}
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: "clamp(8px, 1.2vw, 11px)",
                  color: "#b8e394",
                  marginTop: 4,
                  textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                }}
              >
                {entry.headline}
              </div>
            </div>
            <div
              className="press-blink"
              style={{
                fontFamily: PIXEL,
                fontSize: "clamp(7px, 1vw, 9px)",
                color: "#fff",
                whiteSpace: "nowrap",
                textShadow: "0 0 8px rgba(255,255,255,0.4)",
                paddingBottom: 2,
              }}
            >
              ▸ PRESS START
            </div>
          </div>
          {/* scanlines + curvature vignette */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "repeating-linear-gradient(rgba(0,0,0,0.22) 0 1px, transparent 1px 3px)",
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(115% 90% at 50% 45%, transparent 58%, rgba(0,0,0,0.55) 100%)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      {/* ==== the cabinet ==== */}
      <div
        style={{
          position: "relative",
          marginTop: -6,
          zIndex: 1,
          borderRadius: 8,
          border: "2px solid #0b0c14",
          background: "linear-gradient(180deg, #272939 0%, #1c1e2b 55%, #171925 100%)",
          boxShadow:
            "0 30px 60px rgba(0,0,0,0.55), inset 0 2px 0 rgba(255,255,255,0.06)",
        }}
        className="station-cab"
      >
        {/* top board highlight */}
        <div
          aria-hidden="true"
          style={{
            height: 10,
            borderRadius: "6px 6px 0 0",
            background: "linear-gradient(180deg, #363950 0%, #262838 100%)",
            borderBottom: "1px solid #0d0e18",
          }}
        />

        {/* console bay */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            padding: "10px 24px 0",
          }}
        >
          <div aria-hidden="true" style={ventStyle} />
          <img
            src={consoleUrl}
            alt=""
            aria-hidden="true"
            className="station-console"
            style={{
              display: "block",
              filter: "drop-shadow(0 14px 18px rgba(0,0,0,0.6))",
              marginBottom: -4,
            }}
          />
          <div aria-hidden="true" style={ventStyle} />
        </div>

        {/* divider board */}
        <div
          aria-hidden="true"
          style={{
            height: 9,
            margin: "0 10px",
            borderRadius: 3,
            background: "linear-gradient(180deg, #303348 0%, #1e2030 100%)",
            border: "1px solid #0c0d17",
          }}
        />

        {/* rack shelf */}
        <div
          className="rack-grid"
          style={{ padding: "16px 18px 18px" }}
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

        {/* feet */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 26,
            right: 26,
            bottom: -10,
            height: 10,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ width: 34, background: "#0e0f1a", borderRadius: "0 0 4px 4px" }} />
          <span style={{ width: 34, background: "#0e0f1a", borderRadius: "0 0 4px 4px" }} />
        </div>
      </div>

      <div
        className="font-mono"
        style={{
          position: "relative",
          marginTop: 30,
          fontSize: 10.5,
          letterSpacing: 1,
          color: "var(--term-dim)",
        }}
      >
        HOVER A CARTRIDGE · CLICK TO LOAD
      </div>
    </section>
  );
}
