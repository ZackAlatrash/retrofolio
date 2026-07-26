import { useState } from "react";
import type { MarketingSite as MarketingSiteData } from "../content/types";
import { ALLOW, DENY, INK, INK_2, INK_3, ModuleHead, PIXEL, Panel, PanelHead } from "./detailUi";

interface MarketingSiteProps {
  site: MarketingSiteData;
  accent: string;
}

/**
 * The argument first, the craft second.
 *
 * A marketing site is judged on whether its point lands, so the module leads
 * with the point: switching between two shoppers is the fastest way to show
 * that declining a cookie banner and declining contact are not the same act.
 */
export function MarketingSite({ site, accent }: MarketingSiteProps) {
  const [caseId, setCaseId] = useState(site.cases[site.cases.length - 1].id);
  const active = site.cases.find((c) => c.id === caseId) ?? site.cases[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ModuleHead accent={accent} title="★ THE ARGUMENT" claim={site.claim} />

      <Panel>
        <PanelHead accent={accent} title="TWO PERMISSIONS, NOT ONE">
          pick a shopper
        </PanelHead>

        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", margin: "12px 0 12px" }}>
          {site.cases.map((c) => {
            const on = c.id === caseId;
            return (
              <button
                key={c.id}
                onClick={() => setCaseId(c.id)}
                aria-pressed={on}
                className="font-mono coach-chip"
                style={{
                  fontSize: 12,
                  padding: "7px 12px",
                  borderRadius: 7,
                  cursor: "pointer",
                  textAlign: "left",
                  color: on ? INK : INK_2,
                  background: on ? `${accent}26` : "rgba(34,41,71,0.95)",
                  borderStyle: "solid",
                  borderWidth: 1,
                  borderBottomWidth: 2,
                  borderColor: on ? accent : "#737ebb",
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          }}
        >
          {active.outcomes.map((o) => (
            <div
              key={o.approach}
              data-approach={o.approach}
              data-reachable={o.reachable ? "yes" : "no"}
              style={{
                padding: "11px 12px",
                borderRadius: 8,
                border: `1px solid ${o.reachable ? `${ALLOW}77` : `${DENY}77`}`,
                background: o.reachable ? `${ALLOW}12` : `${DENY}10`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: PIXEL, fontSize: 9, color: INK }}>{o.approach}</span>
                <span
                  className="font-mono"
                  style={{
                    marginLeft: "auto",
                    fontSize: 10.5,
                    padding: "2px 7px",
                    borderRadius: 5,
                    letterSpacing: 0.4,
                    color: o.reachable ? ALLOW : DENY,
                    border: `1px solid ${o.reachable ? ALLOW : DENY}77`,
                    background: `${o.reachable ? ALLOW : DENY}1a`,
                  }}
                >
                  {o.reachable ? "REACHABLE" : "LOST"}
                </span>
              </div>
              <p
                className="font-mono"
                style={{ fontSize: 12, color: INK_2, lineHeight: 1.65, margin: "8px 0 0" }}
              >
                {o.detail}
              </p>
            </div>
          ))}
        </div>

        <p
          className="font-mono"
          style={{ fontSize: 12, color: INK_3, lineHeight: 1.7, margin: "12px 0 0" }}
        >
          {site.premise}
        </p>
      </Panel>

      <Panel>
        <PanelHead accent={accent} title="THE HERO">
          ninety-six frames, scrubbed by scroll
        </PanelHead>
        <ul style={{ listStyle: "none", margin: "11px 0 0", padding: 0 }}>
          {site.hero.map((item, i) => (
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
        <p
          className="font-mono"
          style={{
            fontSize: 12,
            color: INK_2,
            lineHeight: 1.7,
            margin: "11px 0 0",
            padding: "10px 12px",
            borderRadius: 8,
            border: `1px solid ${accent}66`,
            background: "rgba(12,16,30,0.8)",
          }}
        >
          {site.heroNote}
        </p>
      </Panel>

      <Panel>
        <PanelHead accent={accent} title="NO BACKEND, STILL A FUNNEL">
          shipped on a budget of nothing
        </PanelHead>
        <ul style={{ listStyle: "none", margin: "11px 0 0", padding: 0 }}>
          {site.delivery.map((item, i) => (
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
