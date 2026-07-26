import { useState } from "react";
import type { CoachBoundary as CoachBoundaryData, CoachTool } from "../content/types";
import { INK, INK_2, INK_3, ModuleHead, PIXEL, Panel, PanelHead } from "./detailUi";

interface CoachBoundaryProps {
  boundary: CoachBoundaryData;
  accent: string;
}

/**
 * The deterministic boundary the coach sits behind, shown rather than claimed.
 *
 * Three parts, in the order the argument needs making: what an answer is
 * actually made of, how much freedom each capability gets, and the engine that
 * decides the numbers before the model is ever called.
 */
export function CoachBoundary({ boundary, accent }: CoachBoundaryProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ModuleHead accent={accent} title="★ THE COACH" claim={boundary.claim} />

      <Anatomy spans={boundary.anatomy} accent={accent} />
      <Clearance boundary={boundary} accent={accent} />
      <Verdict verdict={boundary.verdict} accent={accent} />
    </div>
  );
}

/** What an answer is made of. Filtering one source out is the whole point. */
function Anatomy({
  spans,
  accent,
}: {
  spans: CoachBoundaryData["anatomy"];
  accent: string;
}) {
  const [only, setOnly] = useState<"computed" | "written" | null>(null);

  return (
    <Panel>
      <PanelHead accent={accent} title="ANATOMY OF AN ANSWER">
        the shape of a reply, not a transcript of one
      </PanelHead>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", margin: "10px 0 11px" }}>
        <SourceToggle
          label="COMPUTED BY THE APP"
          on={only === "computed"}
          swatch={accent}
          onClick={() => setOnly(only === "computed" ? null : "computed")}
        />
        <SourceToggle
          label="WRITTEN BY THE MODEL"
          on={only === "written"}
          swatch="#7b84b8"
          onClick={() => setOnly(only === "written" ? null : "written")}
        />
      </div>

      <p
        className="font-mono"
        style={{ fontSize: 13, lineHeight: 2, margin: 0, color: INK_2 }}
      >
        {spans.map((span, i) => {
          const dimmed = only !== null && only !== span.source;
          const computed = span.source === "computed";
          return (
            <span
              key={i}
              data-source={span.source}
              style={{
                padding: computed ? "3px 6px" : undefined,
                borderRadius: computed ? 5 : undefined,
                background: computed ? `${accent}2e` : undefined,
                border: computed ? `1px solid ${accent}77` : undefined,
                color: computed ? INK : INK_2,
                opacity: dimmed ? 0.28 : 1,
                transition: "opacity 150ms linear",
              }}
            >
              {span.text}
            </span>
          );
        })}
      </p>
    </Panel>
  );
}

function SourceToggle({
  label,
  on,
  swatch,
  onClick,
}: {
  label: string;
  on: boolean;
  swatch: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className="font-mono coach-chip"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        fontSize: 11,
        padding: "5px 10px",
        borderRadius: 7,
        cursor: "pointer",
        letterSpacing: 0.4,
        color: on ? INK : INK_3,
        background: on ? "rgba(52,62,108,0.98)" : "rgba(34,41,71,0.95)",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: on ? "#a3aee6" : "#737ebb",
      }}
    >
      <span
        aria-hidden="true"
        style={{ width: 9, height: 9, borderRadius: 2, background: swatch, flex: "none" }}
      />
      {label}
    </button>
  );
}

/** How much freedom each capability gets, and why. */
function Clearance({ boundary, accent }: { boundary: CoachBoundaryData; accent: string }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <Panel>
      <PanelHead accent={accent} title="WHAT IT IS ALLOWED TO DO">
        {boundary.tools.length} capabilities, three levels of trust
      </PanelHead>

      <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 12 }}>
        {boundary.lanes.map((lane) => {
          const tools = boundary.tools.filter((t) => t.lane === lane.id);
          const gated = lane.id === "confirm";
          return (
            <div key={lane.id}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: PIXEL,
                    fontSize: 9,
                    color: gated ? accent : INK_2,
                  }}
                >
                  {lane.label}
                </span>
                <span className="font-mono" style={{ fontSize: 11, color: INK_3 }}>
                  {tools.length}
                </span>
              </div>
              <p
                className="font-mono"
                style={{ fontSize: 12, color: INK_2, lineHeight: 1.6, margin: "5px 0 8px" }}
              >
                {lane.rule} {lane.why}
              </p>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {tools.map((tool) => (
                  <ToolChip
                    key={tool.label}
                    tool={tool}
                    accent={accent}
                    gated={gated}
                    open={open === tool.label}
                    onClick={() => setOpen(open === tool.label ? null : tool.label)}
                  />
                ))}
              </div>
              {tools.some((t) => t.label === open) && (
                <p
                  className="font-mono"
                  style={{
                    fontSize: 12.5,
                    color: INK_2,
                    lineHeight: 1.7,
                    margin: "9px 0 0",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid ${accent}66`,
                    background: "rgba(12,16,30,0.8)",
                  }}
                >
                  {tools.find((t) => t.label === open)!.detail}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function ToolChip({
  tool,
  accent,
  gated,
  open,
  onClick,
}: {
  tool: CoachTool;
  accent: string;
  gated: boolean;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-expanded={open}
      className="font-mono coach-chip"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        padding: "6px 11px",
        borderRadius: 7,
        cursor: "pointer",
        textAlign: "left",
        color: open ? INK : INK_2,
        background: open ? `${accent}26` : "rgba(34,41,71,0.95)",
        borderStyle: "solid",
        borderWidth: 1,
        borderBottomWidth: 2,
        borderColor: open ? accent : gated ? `${accent}88` : "#737ebb",
      }}
    >
      {gated && (
        <span aria-hidden="true" style={{ fontSize: 11, color: accent }}>
          ⏸
        </span>
      )}
      {tool.label}
    </button>
  );
}

/** The engine that decides before the model is called. */
function Verdict({
  verdict,
  accent,
}: {
  verdict: CoachBoundaryData["verdict"];
  accent: string;
}) {
  return (
    <Panel>
      <PanelHead accent={accent} title="THE WEEKLY VERDICT">
        decided by rules, then handed to the model to explain
      </PanelHead>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", margin: "11px 0 10px" }}>
        {verdict.states.map((s) => (
          <span
            key={s}
            className="font-mono"
            style={{
              fontSize: 11.5,
              padding: "4px 10px",
              borderRadius: 6,
              color: accent,
              background: `${accent}1f`,
              border: `1px solid ${accent}55`,
            }}
          >
            {s}
          </span>
        ))}
      </div>

      <ol style={{ listStyle: "none", margin: "0 0 10px", padding: 0 }}>
        {verdict.outcomes.map((o, i) => (
          <li
            key={o.when}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              padding: "7px 0",
              borderTop: i === 0 ? "none" : "1px solid #2b3152",
            }}
          >
            <span className="font-mono" style={{ fontSize: 11, color: accent, flex: "none" }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className="font-mono"
              style={{ fontSize: 12.5, color: INK_2, lineHeight: 1.5, flex: 1 }}
            >
              {o.when}
            </span>
            <span
              className="font-mono"
              style={{ fontSize: 12, color: INK, flex: "none", textAlign: "right" }}
            >
              {o.verdict}
              {o.change && <span style={{ color: accent }}> {o.change}</span>}
            </span>
          </li>
        ))}
      </ol>

      <p className="font-mono" style={{ fontSize: 12, color: INK_3, lineHeight: 1.7, margin: 0 }}>
        {verdict.note}
      </p>
    </Panel>
  );
}

