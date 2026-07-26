import { useEffect, useRef } from "react";
import { labelUrl, shellHex, showcase, type ShowcaseEntry } from "./showcaseData";
import { SystemMap } from "./SystemMap";
import { CoachBoundary } from "./CoachBoundary";
import { ConsentLedger } from "./ConsentLedger";
import { EvidenceGate } from "./EvidenceGate";
import { VisionBench } from "./VisionBench";
import { CommitmentClock } from "./CommitmentClock";
import { MarketingSite } from "./MarketingSite";

const PIXEL = '"Press Start 2P", ui-monospace, monospace';

interface DetailOverlayProps {
  entry: ShowcaseEntry;
  onEject: () => void;
  onPrev: () => void;
  onNext: () => void;
  /** Jump straight to another cartridge, for real cross-references. */
  onGoTo?: (id: string) => void;
}

/**
 * The in-game detail screen shell ("inside the TV"). One consistent frame:
 * title bar (name, PREV/NEXT, EJECT) + skinned placeholder content blocks.
 * Per-project content and signature modules are designed later; this shell
 * carries the flow (ESC ejects, arrows switch projects).
 */
export function DetailOverlay({
  entry,
  onEject,
  onPrev,
  onNext,
  onGoTo,
}: DetailOverlayProps) {
  const { project } = entry;
  const related = (project.relatedIds ?? [])
    .map((id) => showcase.find((e) => e.id === id))
    .filter((e): e is ShowcaseEntry => Boolean(e));
  const accent = shellHex[entry.shell];
  const ejectRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    ejectRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEject();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    // The help chat sits below this overlay, so anything in here that summons
    // it has to get out of the way first or the chat opens behind the screen.
    window.addEventListener("keydown", onKey);
    window.addEventListener("zk:ask", onEject);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("zk:ask", onEject);
    };
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(84px, 1fr))",
                  gap: 12,
                }}
              >
                {(project.metrics ?? []).map((m) => (
                  <div key={m.label}>
                    <div style={{ fontFamily: PIXEL, fontSize: 13, color: "#f4f4fb" }}>
                      {m.value}
                    </div>
                    <div
                      className="font-mono"
                      style={{ fontSize: 11, color: "#98a1c6", marginTop: 5, letterSpacing: 0.4 }}
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
                      fontSize: 11.5,
                      padding: "4px 10px",
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
            {project.context && (
              <Block accent={accent} title="FIELD REPORT">
                <Prose>{project.context}</Prose>
              </Block>
            )}
          </div>

          {/* full-width briefing below the two columns */}
          <div className="detail-full" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {project.systemMap && (
              <SignatureModule accent={accent}>
                <SystemMap map={project.systemMap} accent={accent} />
              </SignatureModule>
            )}
            {project.coachBoundary && (
              <SignatureModule accent={accent}>
                <CoachBoundary boundary={project.coachBoundary} accent={accent} />
              </SignatureModule>
            )}
            {project.consentLedger && (
              <SignatureModule accent={accent}>
                <ConsentLedger ledger={project.consentLedger} accent={accent} />
              </SignatureModule>
            )}
            {project.evidenceGate && (
              <SignatureModule accent={accent}>
                <EvidenceGate gate={project.evidenceGate} accent={accent} />
              </SignatureModule>
            )}
            {project.visionBench && (
              <SignatureModule accent={accent}>
                <VisionBench bench={project.visionBench} accent={accent} />
              </SignatureModule>
            )}
            {project.commitmentClock && (
              <SignatureModule accent={accent}>
                <CommitmentClock clock={project.commitmentClock} accent={accent} />
              </SignatureModule>
            )}
            {project.marketingSite && (
              <SignatureModule accent={accent}>
                <MarketingSite site={project.marketingSite} accent={accent} />
              </SignatureModule>
            )}

            {project.problem && (
              <Block accent={accent} title="THE PROBLEM">
                <Prose>{project.problem}</Prose>
              </Block>
            )}
            {project.architecture && (
              <Block accent={accent} title="ARCHITECTURE">
                <Prose>{project.architecture}</Prose>
              </Block>
            )}
            {project.hardestProblem && (
              <Block accent={accent} title="⚔ BOSS FIGHT">
                <Prose>{project.hardestProblem}</Prose>
              </Block>
            )}
            {project.tradeoffs && (
              <Block accent={accent} title="TRADE-OFFS">
                <Prose>{project.tradeoffs}</Prose>
              </Block>
            )}
            {project.limitations && (
              <Block accent={accent} title="KNOWN LIMITS">
                <Prose>{project.limitations}</Prose>
              </Block>
            )}
            {related.length > 0 && onGoTo && (
              <Block accent={accent} title="PART OF">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {related.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onGoTo(r.id)}
                      className="font-mono coach-chip"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        padding: "6px 11px",
                        borderRadius: 7,
                        cursor: "pointer",
                        color: "#eef0fa",
                        background: "rgba(34,41,71,0.95)",
                        borderStyle: "solid",
                        borderWidth: 1,
                        borderBottomWidth: 2,
                        borderColor: shellHex[r.shell],
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 2,
                          background: shellHex[r.shell],
                          flex: "none",
                        }}
                      />
                      {r.project.name} ▸
                    </button>
                  ))}
                </div>
              </Block>
            )}
            {project.links && project.links.length > 0 && (
              <Block accent={accent} title="LINKS">
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {project.links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono"
                      style={{ fontSize: 11, color: accent }}
                    >
                      {l.label} ↗
                    </a>
                  ))}
                </div>
              </Block>
            )}
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

/** The frame around a project's one distinctive interactive module. */
function SignatureModule({
  accent,
  children,
}: {
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: `1px solid ${accent}44`,
        borderRadius: 9,
        padding: "12px 13px",
        background: "rgba(16,20,36,0.55)",
      }}
    >
      {children}
    </div>
  );
}

/** Body copy inside a briefing block. */
function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-mono"
      style={{ fontSize: 12.5, color: "#c6cce6", lineHeight: 1.7, margin: 0 }}
    >
      {children}
    </p>
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
          fontSize: 10,
          color: accent,
          marginBottom: 10,
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
