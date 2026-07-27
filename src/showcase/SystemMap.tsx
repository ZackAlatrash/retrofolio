import { useState } from "react";
import type { PipelineStage, PipelineTrack, SystemMap as SystemMapData } from "../content/types";
import { SUBHEAD_FLEX } from "./detailUi";

const PIXEL = '"Press Start 2P", ui-monospace, monospace';

/**
 * Palette. Every value here is checked against the node background (#1c2239)
 * for WCAG AA at 4.5:1, so nothing on this screen relies on a colour a visitor
 * has to squint at. See tests/system-map.test.tsx for the guard.
 */
const INK = "#eef0fa";
const INK_2 = "#b9c0dd";
const INK_3 = "#98a1c6";

interface SystemMapProps {
  map: SystemMapData;
  accent: string;
}

/**
 * The project's real pipelines as a stage-select map.
 *
 * Not a redrawn abstraction: each node is a stage of a pipeline that runs one
 * step at a time, and the class implementing it is named on the node. The
 * LOCAL/PRODUCTION switch shows the ports holding, since the stages never
 * change, only the adapters behind two of them do.
 */
export function SystemMap({ map, accent }: SystemMapProps) {
  const [target, setTarget] = useState<"local" | "prod">("prod");
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontFamily: PIXEL, fontSize: 10, color: accent, letterSpacing: 0.5 }}>
          ★ SYSTEM MAP
        </span>
        <span className="font-mono" style={{ fontSize: 12, color: INK_3, flex: 1 }}>
          pick any stage to see what it does
        </span>
        <TargetSwitch target={target} onChange={setTarget} accent={accent} />
      </div>

      {map.tracks.map((track) => (
        <Track
          key={track.id}
          track={track}
          // Both rails share the longest track's column count, so a box is the
          // same size in either one and the stages line up between them.
          columns={Math.max(...map.tracks.map((t) => t.stages.length))}
          accent={accent}
          target={target}
          selected={selected}
          onSelect={setSelected}
        />
      ))}

      <p className="font-mono" style={{ fontSize: 12.5, color: INK_2, lineHeight: 1.65, margin: 0 }}>
        {map.join}
      </p>
    </div>
  );
}

/** Local dev and production differ by adapter, never by stage. */
function TargetSwitch({
  target,
  onChange,
  accent,
}: {
  target: "local" | "prod";
  onChange: (t: "local" | "prod") => void;
  accent: string;
}) {
  return (
    <div
      role="group"
      aria-label="Deployment target"
      style={{ display: "flex", border: "1px solid #3a4166", borderRadius: 7, overflow: "hidden" }}
    >
      {(["local", "prod"] as const).map((t) => {
        const on = target === t;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            aria-pressed={on}
            className="font-mono stage-switch"
            style={{
              fontSize: 11,
              padding: "6px 12px",
              border: "none",
              cursor: "pointer",
              letterSpacing: 0.5,
              color: on ? "#11142a" : INK_2,
              background: on ? accent : "transparent",
            }}
          >
            {t === "local" ? "LOCAL DEV" : "PRODUCTION"}
          </button>
        );
      })}
    </div>
  );
}

function Track({
  track,
  columns,
  accent,
  target,
  selected,
  onSelect,
}: {
  track: PipelineTrack;
  columns: number;
  accent: string;
  target: "local" | "prod";
  selected: string | null;
  onSelect: (key: string | null) => void;
}) {
  return (
    <div
      style={{
        border: "1px solid #2b3152",
        borderRadius: 10,
        padding: "13px 14px",
        background: "rgba(20,25,44,0.6)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontFamily: PIXEL, fontSize: 11, color: accent }}>{track.label}</span>
        <span
          className="font-mono"
          style={{ fontSize: 12.5, color: INK_2, flex: SUBHEAD_FLEX }}
        >
          {track.purpose}
        </span>
      </div>

      <ol
        className="stage-grid"
        style={{ ["--cols" as string]: columns }}
      >
        {track.stages.map((stage, i) => {
          const key = `${track.id}:${i}`;
          return (
            <li key={key} style={{ display: "flex" }}>
              <StageNode
                stage={stage}
                ordinal={i + 1}
                trackLabel={track.label}
                accent={accent}
                target={target}
                open={selected === key}
                onClick={() => onSelect(selected === key ? null : key)}
              />
            </li>
          );
        })}
      </ol>

      {track.stages.map((stage, i) => {
        const key = `${track.id}:${i}`;
        if (selected !== key) return null;
        return <StageDetail key={key} stage={stage} accent={accent} target={target} />;
      })}
    </div>
  );
}

/**
 * One stage. The name appears once: the CLI subcommand belongs in the detail
 * panel next to the rest of the runnable-stage story, not repeated on the face
 * of the node in a second casing.
 */
function StageNode({
  stage,
  ordinal,
  trackLabel,
  accent,
  target,
  open,
  onClick,
}: {
  stage: PipelineStage;
  ordinal: number;
  trackLabel: string;
  accent: string;
  target: "local" | "prod";
  open: boolean;
  onClick: () => void;
}) {
  const impl = stage.swap ? stage.swap[target] : stage.impl;
  return (
    <button
      onClick={onClick}
      aria-expanded={open}
      // The visible node is a stack of fragments; spell the name out instead of
      // letting a screen reader read "05 Router OllamaRouterAuthor".
      aria-label={`${trackLabel} stage ${ordinal}: ${stage.label}, ${impl}`}
      className="font-mono stage-node"
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 3,
        padding: "8px 10px 9px",
        borderRadius: 8,
        cursor: "pointer",
        textAlign: "left",
        background: open ? `${accent}26` : "rgba(34,41,71,0.95)",
        // A flat card on a dark screen reads as a panel. The brighter top edge
        // and the heavier base line are what make it read as a key to press.
        // All longhand: mixing `border` with `borderBottomWidth` makes React
        // drop one of them on re-render.
        borderStyle: "solid",
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 2,
        borderLeftWidth: 1,
        borderTopColor: open ? accent : "#8b97d4",
        borderRightColor: open ? accent : "#737ebb",
        borderBottomColor: open ? accent : "#737ebb",
        borderLeftColor: open ? accent : "#737ebb",
        color: "inherit",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
        <span style={{ fontSize: 11, color: accent }}>{String(ordinal).padStart(2, "0")}</span>
        {stage.step && (
          <span
            style={{
              fontSize: 10,
              padding: "1px 5px",
              borderRadius: 4,
              letterSpacing: 0.5,
              color: accent,
              background: `${accent}1f`,
              border: `1px solid ${accent}55`,
            }}
          >
            {stage.step}
          </span>
        )}
        {stage.swap && (
          <span title="Adapter changes with the deployment target" style={{ fontSize: 11, color: accent }}>
            ⇄
          </span>
        )}
        <span
          aria-hidden="true"
          className="stage-chevron"
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 17,
            height: 17,
            borderRadius: 5,
            fontSize: 10,
            lineHeight: 1,
            color: open ? "#11142a" : INK,
            background: open ? accent : "rgba(255,255,255,0.13)",
            border: `1px solid ${open ? accent : "#7984bd"}`,
            transform: open ? "rotate(180deg)" : "none",
          }}
        >
          ▾
        </span>
      </span>

      <span style={{ fontSize: 13.5, color: INK, lineHeight: 1.25 }}>{stage.label}</span>
      {/* break-word, not anywhere: a class name only splits when it genuinely
          cannot fit a line, rather than wherever the column happens to end. */}
      <span style={{ fontSize: 12, color: INK_2, lineHeight: 1.35, overflowWrap: "break-word" }}>
        {impl}
      </span>
    </button>
  );
}

function StageDetail({
  stage,
  accent,
  target,
}: {
  stage: PipelineStage;
  accent: string;
  target: "local" | "prod";
}) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: "12px 14px",
        borderRadius: 8,
        border: `1px solid ${accent}66`,
        background: "rgba(12,16,30,0.8)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontFamily: PIXEL, fontSize: 10, color: accent }}>
          {stage.label.toUpperCase()}
        </span>
        {stage.command && (
          <code className="font-mono" style={{ fontSize: 12, color: INK_3 }}>
            runs on its own: {stage.command}
          </code>
        )}
        {stage.output && (
          <code className="font-mono" style={{ fontSize: 12, color: INK_3 }}>
            hands on: {stage.output}
          </code>
        )}
      </div>
      <p
        className="font-mono"
        style={{ fontSize: 12.5, color: INK_2, lineHeight: 1.7, margin: "10px 0 0" }}
      >
        {stage.detail}
      </p>
      {stage.swap && (
        <p
          className="font-mono"
          style={{ fontSize: 12, color: INK_3, lineHeight: 1.7, margin: "9px 0 0" }}
        >
          Adapter here: <span style={{ color: accent }}>{stage.swap[target]}</span>. The stage,
          the port and the core logic are identical either way.
        </p>
      )}
    </div>
  );
}
