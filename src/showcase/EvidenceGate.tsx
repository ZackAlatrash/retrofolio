import { useState } from "react";
import type { EvidenceGateModule } from "../content/types";
import { ALLOW, DENY, INK, INK_2, INK_3, ModuleHead, PIXEL, Panel, PanelHead } from "./detailUi";

interface EvidenceGateProps {
  gate: EvidenceGateModule;
  accent: string;
}

/**
 * The refusal threshold, made operable.
 *
 * The project's own benchmark put on-topic and off-topic questions in two
 * populations that do not overlap, so the honest way to show the threshold is
 * on the same axis as the measurements that justify it: drag across it and the
 * system's decision flips in front of you.
 */
export function EvidenceGate({ gate, accent }: EvidenceGateProps) {
  const [score, setScore] = useState(0.72);
  const passes = score >= gate.threshold;
  const band = gate.bands.find((b) => score >= b.from && score <= b.to) ?? gate.bands[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ModuleHead accent={accent} title="★ THE EVIDENCE GATE" claim={gate.claim} />

      <Panel>
        <PanelHead accent={accent} title="RETRIEVAL CONFIDENCE">
          measured, not guessed
        </PanelHead>

        {/* the measured populations, on the axis the threshold lives on */}
        <div style={{ margin: "14px 0 0" }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              height: 34,
              borderRadius: 7,
              overflow: "hidden",
              border: "1px solid #3a4166",
            }}
          >
            {gate.bands.map((b) => (
              <div
                key={b.label}
                title={b.label}
                style={{
                  flex: b.to - b.from,
                  background: b.answered ? `${ALLOW}26` : "rgba(34,41,71,0.95)",
                  borderRight: "1px solid #2b3152",
                }}
              />
            ))}
            {/* the line itself */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: `${gate.threshold * 100}%`,
                top: 0,
                bottom: 0,
                width: 2,
                background: accent,
              }}
            />
          </div>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            aria-label="Retrieval confidence"
            aria-valuetext={`${score.toFixed(2)}, ${passes ? "answered" : "refused"}`}
            style={{ width: "100%", marginTop: 10, accentColor: accent, cursor: "pointer" }}
          />

          <div
            className="font-mono"
            style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: INK_3 }}
          >
            <span>0.00</span>
            <span style={{ color: accent }}>line at {gate.threshold.toFixed(2)}</span>
            <span>1.00</span>
          </div>
        </div>

        {/* what the system does at this score */}
        <div
          data-verdict={passes ? "answer" : "refuse"}
          style={{
            marginTop: 13,
            padding: "12px 13px",
            borderRadius: 8,
            border: `1px solid ${passes ? `${ALLOW}77` : `${DENY}77`}`,
            background: passes ? `${ALLOW}12` : `${DENY}10`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <span
              className="font-mono"
              style={{ fontSize: 15, color: passes ? ALLOW : DENY, minWidth: 46 }}
            >
              {score.toFixed(2)}
            </span>
            <span
              style={{
                fontFamily: PIXEL,
                fontSize: 9,
                color: passes ? ALLOW : DENY,
              }}
            >
              {passes ? "ANSWERS" : "REFUSES"}
            </span>
            <span className="font-mono" style={{ fontSize: 11.5, color: INK_3 }}>
              {band.label}
            </span>
          </div>
          <p
            className="font-mono"
            style={{ fontSize: 12.5, color: INK_2, lineHeight: 1.7, margin: "8px 0 0" }}
          >
            {passes ? gate.above : gate.below}
          </p>
          <p
            className="font-mono"
            style={{ fontSize: 12, color: INK_3, lineHeight: 1.65, margin: "6px 0 0" }}
          >
            {band.meaning}
          </p>
        </div>

        <p
          className="font-mono"
          style={{ fontSize: 12, color: INK_3, lineHeight: 1.7, margin: "11px 0 0" }}
        >
          {gate.calibration}
        </p>
      </Panel>

      <Panel>
        <PanelHead accent={accent} title="THE SAME IDEA, RUNNING HERE">
          not a screenshot
        </PanelHead>
        <p
          className="font-mono"
          style={{ fontSize: 12.5, color: INK_2, lineHeight: 1.7, margin: "10px 0 0" }}
        >
          {gate.liveHere}
        </p>
        <button
          onClick={() => window.dispatchEvent(new Event("zk:ask"))}
          className="font-mono coach-chip"
          style={{
            marginTop: 11,
            fontSize: 12.5,
            padding: "8px 13px",
            borderRadius: 7,
            cursor: "pointer",
            color: INK,
            background: `${accent}26`,
            borderStyle: "solid",
            borderWidth: 1,
            borderBottomWidth: 2,
            borderColor: accent,
          }}
        >
          Try it on this site ▸
        </button>
        <p
          className="font-mono"
          style={{ fontSize: 11.5, color: INK_3, lineHeight: 1.65, margin: "10px 0 0" }}
        >
          {gate.liveCaveat}
        </p>
      </Panel>

      <Panel>
        <PanelHead accent={accent} title="BUILT BY HAND">
          what a vector database is, once you take the library away
        </PanelHead>
        <ul style={{ listStyle: "none", margin: "11px 0 0", padding: 0 }}>
          {gate.handBuilt.map((item, i) => (
            <li
              key={item.label}
              style={{ padding: "9px 0", borderTop: i === 0 ? "none" : "1px solid #2b3152" }}
            >
              <div className="font-mono" style={{ fontSize: 12.5, color: INK }}>
                {item.label}
              </div>
              <div
                className="font-mono"
                style={{ fontSize: 12, color: INK_2, lineHeight: 1.65, marginTop: 3 }}
              >
                {item.detail}
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
