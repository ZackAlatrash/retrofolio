import { useState } from "react";
import type { ConsentLedger as ConsentLedgerData, ConsentRow } from "../content/types";
import { ALLOW, DENY, INK, INK_2, INK_3, ModuleHead, PIXEL, Panel, PanelHead } from "./detailUi";

interface ConsentLedgerProps {
  ledger: ConsentLedgerData;
  accent: string;
}

/** A consent record's live state in the demo. */
type RecordState = "granted" | "withheld" | "revoked";


/**
 * The consent model as something you operate rather than read.
 *
 * The argument is that opt-in is structural, so the module hands over the one
 * control a shopper actually has and lets the visitor try to reach a marketing
 * email without it. The two records revoke independently, which is the other
 * half of the claim.
 */
export function ConsentLedger({ ledger, accent }: ConsentLedgerProps) {
  const [ticked, setTicked] = useState(false);
  const [revoked, setRevoked] = useState<Record<string, boolean>>({});

  const stateOf = (row: ConsentRow): RecordState => {
    if (revoked[row.kind]) return "revoked";
    const granted = row.grantedByDefault || ticked;
    return granted ? "granted" : "withheld";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ModuleHead accent={accent} title="★ THE CONSENT RECEIPT" claim={ledger.claim} />

      <Panel>
        <PanelHead accent={accent} title="ONE SUBMISSION, TWO RECORDS">
          the shopper has exactly one control
        </PanelHead>

        {/* the storefront side */}
        <div
          style={{
            margin: "12px 0 14px",
            padding: "12px 13px",
            borderRadius: 8,
            border: "1px solid #3a4166",
            background: "rgba(12,16,30,0.6)",
          }}
        >
          <div className="font-mono" style={{ fontSize: 12, color: INK_3, marginBottom: 9 }}>
            Email me my cart
          </div>
          <label
            className="font-mono coach-chip"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              fontSize: 12.5,
              padding: "8px 12px",
              borderRadius: 7,
              cursor: "pointer",
              color: ticked ? INK : INK_2,
              background: ticked ? `${accent}26` : "rgba(34,41,71,0.95)",
              borderStyle: "solid",
              borderWidth: 1,
              borderBottomWidth: 2,
              borderColor: ticked ? accent : "#737ebb",
            }}
          >
            <input
              type="checkbox"
              checked={ticked}
              onChange={(e) => setTicked(e.target.checked)}
              style={{ width: 15, height: 15, accentColor: accent, cursor: "pointer" }}
            />
            Also send me offers and news
          </label>
          <div className="font-mono" style={{ fontSize: 11.5, color: INK_3, marginTop: 9 }}>
            {ticked ? "Ticked by the shopper." : "Unticked. This is how every widget ships."}
          </div>
        </div>

        {/* the database side */}
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {ledger.rows.map((row) => (
            <RecordCard
              key={row.kind}
              row={row}
              state={stateOf(row)}
              onToggleRevoke={() =>
                setRevoked((r) => ({ ...r, [row.kind]: !r[row.kind] }))
              }
            />
          ))}
        </div>

        <Consequence rows={ledger.rows} stateOf={stateOf} />
      </Panel>

      <Panel>
        <PanelHead accent={accent} title="EVERY RECORD KEEPS">
          enough to prove what was agreed, months later
        </PanelHead>
        <ul style={{ listStyle: "none", margin: "11px 0 0", padding: 0 }}>
          {ledger.snapshot.map((field, i) => (
            <li
              key={field.label}
              style={{ padding: "9px 0", borderTop: i === 0 ? "none" : "1px solid #2b3152" }}
            >
              <div className="font-mono" style={{ fontSize: 12.5, color: INK }}>
                {field.label}
              </div>
              <div
                className="font-mono"
                style={{ fontSize: 12, color: INK_2, lineHeight: 1.6, marginTop: 3 }}
              >
                {field.detail}
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel>
        <PanelHead accent={accent} title="WHAT THIS MAKES IMPOSSIBLE">
          {ledger.guarantees.length} things that cannot happen, and why
        </PanelHead>
        <ul style={{ listStyle: "none", margin: "11px 0 0", padding: 0 }}>
          {ledger.guarantees.map((g, i) => (
            <li
              key={g.cannot}
              style={{
                display: "flex",
                gap: 10,
                padding: "9px 0",
                borderTop: i === 0 ? "none" : "1px solid #2b3152",
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 12, color: accent, flex: "none" }}>
                ✕
              </span>
              <span style={{ flex: 1 }}>
                <span className="font-mono" style={{ fontSize: 12.5, color: INK, lineHeight: 1.5 }}>
                  {g.cannot}
                </span>
                <span
                  className="font-mono"
                  style={{
                    display: "block",
                    fontSize: 12,
                    color: INK_2,
                    lineHeight: 1.6,
                    marginTop: 3,
                  }}
                >
                  {g.because}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function RecordCard({
  row,
  state,
  onToggleRevoke,
}: {
  row: ConsentRow;
  state: RecordState;
  onToggleRevoke: () => void;
}) {
  const granted = state === "granted";
  const badge =
    state === "granted" ? "GRANTED" : state === "revoked" ? "REVOKED" : "NOT GRANTED";
  const badgeColor = granted ? ALLOW : DENY;

  return (
    <div
      data-record={row.kind}
      data-state={state}
      style={{
        padding: "11px 12px",
        borderRadius: 8,
        border: `1px solid ${granted ? `${ALLOW}77` : "#4a5178"}`,
        background: granted ? `${ALLOW}12` : "rgba(20,25,44,0.75)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontFamily: PIXEL, fontSize: 9, color: INK }}>{row.kind}</span>
        <span
          className="font-mono"
          style={{
            fontSize: 10.5,
            padding: "2px 7px",
            borderRadius: 5,
            letterSpacing: 0.4,
            color: badgeColor,
            border: `1px solid ${badgeColor}77`,
            background: `${badgeColor}1a`,
          }}
        >
          {badge}
        </span>
      </div>
      <p
        className="font-mono"
        style={{ fontSize: 12, color: INK_2, lineHeight: 1.6, margin: "7px 0 0" }}
      >
        {row.purpose}
      </p>
      <p
        className="font-mono"
        style={{ fontSize: 11.5, color: INK_3, lineHeight: 1.6, margin: "5px 0 9px" }}
      >
        {row.allows}
      </p>
      <button
        onClick={onToggleRevoke}
        className="font-mono coach-chip"
        style={{
          fontSize: 11.5,
          padding: "5px 10px",
          borderRadius: 6,
          cursor: "pointer",
          color: INK_2,
          background: "rgba(34,41,71,0.95)",
          borderStyle: "solid",
          borderWidth: 1,
          borderColor: "#737ebb",
        }}
      >
        {state === "revoked" ? "restore this record" : "revoke this record"}
      </button>
    </div>
  );
}

/** The whole point: what is actually sendable right now. */
function Consequence({
  rows,
  stateOf,
}: {
  rows: ConsentRow[];
  stateOf: (row: ConsentRow) => RecordState;
}) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: "11px 13px",
        borderRadius: 8,
        border: "1px solid #3a4166",
        background: "rgba(12,16,30,0.75)",
      }}
    >
      <div
        className="font-mono"
        style={{ fontSize: 11, color: INK_3, letterSpacing: 0.5, marginBottom: 8 }}
      >
        SO WHAT CAN BE SENT?
      </div>
      {rows.map((row) => {
        const ok = stateOf(row) === "granted";
        return (
          <div
            key={row.kind}
            data-sendable={ok ? "yes" : "no"}
            style={{ display: "flex", gap: 9, alignItems: "baseline", padding: "3px 0" }}
          >
            <span
              aria-hidden="true"
              style={{ fontSize: 12, color: ok ? ALLOW : DENY, flex: "none", width: 12 }}
            >
              {ok ? "✓" : "✕"}
            </span>
            <span className="font-mono" style={{ fontSize: 12.5, color: INK_2, lineHeight: 1.6 }}>
              <span style={{ color: INK }}>{row.kind}:</span> {ok ? row.allows : "blocked, no record grants it."}
            </span>
          </div>
        );
      })}
    </div>
  );
}
