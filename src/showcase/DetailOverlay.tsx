import { useEffect, useRef } from "react";
import { labelUrl, shellHex, type ShowcaseEntry } from "./showcaseData";

const PIXEL = '"Press Start 2P", ui-monospace, monospace';

interface DetailOverlayProps {
  entry: ShowcaseEntry;
  onEject: () => void;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * The in-game detail screen shell ("inside the TV"). One consistent frame:
 * title bar (name, PREV/NEXT, EJECT) + skinned placeholder content blocks.
 * Per-project content and signature modules are designed later; this shell
 * carries the flow (ESC ejects, arrows switch projects).
 */
export function DetailOverlay({ entry, onEject, onPrev, onNext }: DetailOverlayProps) {
  const { project } = entry;
  const accent = shellHex[entry.shell];
  const ejectRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    ejectRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEject();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onEject, onPrev, onNext]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${project.name} details`}
      className="detail-in"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        background: "#0b0f1c",
      }}
    >
      {/* title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: "rgba(9,12,20,0.96)",
          borderBottom: `2px solid ${accent}`,
          flex: "none",
        }}
      >
        <span
          style={{
            fontFamily: PIXEL,
            fontSize: "clamp(9px, 1.4vw, 13px)",
            color: "#f4f4fb",
            textShadow: "2px 2px 0 rgba(20,10,60,0.9)",
            flex: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {entry.title}
        </span>
        <BarButton label="◄ PREV" onClick={onPrev} />
        <BarButton label="NEXT ►" onClick={onNext} />
        <BarButton label="⏏ EJECT" onClick={onEject} accent="#ff9d94" refEl={ejectRef} />
      </div>

      {/* body (keyed so switching projects flickers like a channel change) */}
      <div
        key={entry.id}
        className="crt-flicker"
        style={{ flex: 1, overflowY: "auto", padding: 16 }}
      >
        <div className="detail-grid" style={{ maxWidth: 1040, margin: "0 auto" }}>
          {/* hero */}
          <div
            style={{
              position: "relative",
              borderRadius: 10,
              overflow: "hidden",
              minHeight: 260,
              border: `1px solid ${accent}44`,
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
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, transparent 40%, rgba(5,8,16,0.88) 92%)",
              }}
            />
            <div style={{ position: "absolute", left: 14, right: 14, bottom: 12 }}>
              <div
                className="font-mono"
                style={{ fontSize: 11, color: accent, letterSpacing: 1.2 }}
              >
                {entry.genre}
              </div>
              <div
                className="font-mono"
                style={{ fontSize: 12, color: "#c7cde8", marginTop: 6, lineHeight: 1.5 }}
              >
                {project.whatItIs}
              </div>
            </div>
          </div>

          {/* right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Block accent={accent} title="STATS">
              <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
                {(project.metrics ?? []).map((m) => (
                  <div key={m.label}>
                    <div style={{ fontFamily: PIXEL, fontSize: 12, color: "#f4f4fb" }}>
                      {m.value}
                    </div>
                    <div
                      className="font-mono"
                      style={{ fontSize: 9, color: "#68719c", marginTop: 4, letterSpacing: 0.5 }}
                    >
                      {m.label.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </Block>
            <Block accent={accent} title="EQUIPMENT">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {project.stack.slice(0, 8).map((s) => (
                  <span
                    key={s}
                    className="font-mono"
                    style={{
                      fontSize: 10,
                      padding: "3px 9px",
                      borderRadius: 5,
                      color: accent,
                      background: `${accent}1c`,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </Block>
            <Block accent={accent} title="THE STORY" dashedNote>
              <span className="font-mono" style={{ fontSize: 11, color: "#aab2d4", lineHeight: 1.6 }}>
                {project.problem ?? project.whatItIs} · full briefing blocks
                (architecture, boss fight, trade-offs, gallery) are designed per
                project in the next phase.
              </span>
            </Block>
            <Block accent={accent} title="★ SIGNATURE MODULE" dashed>
              <span className="font-mono" style={{ fontSize: 11, color: "#8a93bd", lineHeight: 1.6 }}>
                Reserved: this project's unique interactive module lands here.
              </span>
            </Block>
          </div>
        </div>
      </div>

      {/* faint CRT dressing: still inside the TV */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "repeating-linear-gradient(rgba(0,0,0,0.14) 0 1px, transparent 1px 3px)",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(130% 100% at 50% 45%, transparent 62%, rgba(0,0,0,0.4) 100%)",
        }}
      />
    </div>
  );
}

function BarButton({
  label,
  onClick,
  accent,
  refEl,
}: {
  label: string;
  onClick: () => void;
  accent?: string;
  refEl?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={refEl}
      onClick={onClick}
      className="font-mono"
      style={{
        fontSize: 11,
        color: accent ?? "#c9cde8",
        border: `1px solid ${accent ? "#5c2a26" : "#2a2f48"}`,
        borderRadius: 6,
        padding: "5px 10px",
        cursor: "pointer",
        background: "transparent",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function Block({
  accent,
  title,
  children,
  dashed,
  dashedNote,
}: {
  accent: string;
  title: string;
  children: React.ReactNode;
  dashed?: boolean;
  dashedNote?: boolean;
}) {
  return (
    <div
      style={{
        border: `1px ${dashed ? "dashed" : "solid"} ${dashed ? accent : "#232842"}`,
        borderRadius: 9,
        padding: "10px 13px",
        background: dashedNote ? "rgba(20,25,44,0.4)" : "rgba(20,25,44,0.6)",
      }}
    >
      <div
        style={{
          fontFamily: PIXEL,
          fontSize: 8,
          color: accent,
          marginBottom: 8,
          letterSpacing: 0.5,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

/** The splash the TV shows while a cartridge boots. */
export function SplashCard({ entry }: { entry: ShowcaseEntry }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
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
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(90% 80% at 50% 55%, rgba(6,9,18,0.35), rgba(6,9,18,0.82) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "6%",
          textAlign: "center",
          padding: "0 8%",
        }}
      >
        <div
          style={{
            fontFamily: PIXEL,
            fontSize: "clamp(11px, 2vw, 19px)",
            color: "#f4f4fb",
            textShadow: "2px 2px 0 rgba(20,10,60,0.95), 0 0 16px rgba(122,162,247,0.4)",
            lineHeight: 1.4,
          }}
        >
          {entry.title}
        </div>
        <div
          className="font-mono"
          style={{ fontSize: "clamp(8px, 1.1vw, 11px)", color: "#cfe0ff", letterSpacing: 1.2 }}
        >
          {entry.genre}
        </div>
        <div
          className="press-blink"
          style={{
            fontFamily: PIXEL,
            fontSize: "clamp(6px, 0.9vw, 8px)",
            color: "#fff",
          }}
        >
          ▸ LOADING…
        </div>
      </div>
      <div className="splash-static" aria-hidden="true" />
    </div>
  );
}
