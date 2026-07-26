import { useState } from "react";
import type { CommitmentClock as ClockData } from "../content/types";
import { ALLOW, DENY, INK, INK_2, INK_3, ModuleHead, PIXEL, Panel, PanelHead } from "./detailUi";
import { lastDay, lockEndLabel, stateAt, verdictFor } from "./commitmentRules";

interface CommitmentClockProps {
  clock: ClockData;
  accent: string;
}

/**
 * A commitment played forward on a scrubber.
 *
 * Everything this project does is a function of elapsed time, so a static
 * diagram would describe it without ever demonstrating it. Dragging the day is
 * the only way to watch a missed target trip the lifecycle and see the
 * gatekeeper's refusals change wording underneath.
 */
export function CommitmentClock({ clock, accent }: CommitmentClockProps) {
  const [day, setDay] = useState(0);
  const end = lastDay(clock);
  const s = stateAt(day, clock);
  const denied = clock.actions.filter((a) => !verdictFor(a.id, s, clock).allowed).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ModuleHead accent={accent} title="★ THE CLOCK" claim={clock.claim} />

      <Panel>
        <PanelHead accent={accent} title="DAY BY DAY">
          {clock.lockDays} day lock, {clock.windowDays} day windows
        </PanelHead>

        <div style={{ margin: "13px 0 0" }}>
          <input
            type="range"
            min={0}
            max={end}
            step={1}
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            aria-label="Day of the commitment"
            aria-valuetext={`Day ${day}, ${s.label}`}
            style={{ width: "100%", accentColor: accent, cursor: "pointer" }}
          />
          <div
            className="font-mono"
            style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: INK_3 }}
          >
            <span>day 0</span>
            <span style={{ color: accent }}>
              window {s.window} of {s.windows}
            </span>
            <span>day {end}</span>
          </div>
        </div>

        {/* where the commitment stands right now */}
        <div
          data-phase={s.phase}
          style={{
            marginTop: 13,
            padding: "12px 13px",
            borderRadius: 8,
            border: `1px solid ${s.phase === "active" || s.phase === "completed" ? `${ALLOW}66` : `${DENY}66`}`,
            background: s.phase === "active" || s.phase === "completed" ? `${ALLOW}10` : `${DENY}10`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="font-mono" style={{ fontSize: 15, color: INK, minWidth: 58 }}>
              day {day}
            </span>
            <span
              style={{
                fontFamily: PIXEL,
                fontSize: 9,
                color: s.phase === "active" || s.phase === "completed" ? ALLOW : DENY,
              }}
            >
              {s.label.toUpperCase()}
            </span>
            <span className="font-mono" style={{ marginLeft: "auto", fontSize: 11.5, color: INK_3 }}>
              capacity {s.used}/{s.capacity}
            </span>
          </div>
          <p
            className="font-mono"
            style={{ fontSize: 12.5, color: INK_2, lineHeight: 1.7, margin: "9px 0 0" }}
          >
            {s.detail}
          </p>
          {!s.lockEnded && (
            <p className="font-mono" style={{ fontSize: 11.5, color: INK_3, margin: "6px 0 0" }}>
              {s.daysRemaining} day{s.daysRemaining === 1 ? "" : "s"} of lock remaining, ending{" "}
              {lockEndLabel(clock)}.
            </p>
          )}
        </div>

        {/* what the gatekeeper says about each action, today */}
        <div
          className="font-mono"
          style={{ fontSize: 11, color: INK_3, letterSpacing: 0.5, margin: "14px 0 8px" }}
        >
          {denied} OF {clock.actions.length} ACTIONS BLOCKED RIGHT NOW
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {clock.actions.map((action, i) => {
            const v = verdictFor(action.id, s, clock);
            return (
              <li
                key={action.id}
                data-action={action.id}
                data-allowed={v.allowed ? "yes" : "no"}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "9px 0",
                  borderTop: i === 0 ? "none" : "1px solid #2b3152",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ fontSize: 12, color: v.allowed ? ALLOW : DENY, width: 12, flex: "none" }}
                >
                  {v.allowed ? "✓" : "✕"}
                </span>
                <span style={{ flex: 1 }}>
                  <span
                    className="font-mono"
                    style={{ fontSize: 12.5, color: v.allowed ? INK_2 : INK }}
                  >
                    {action.label}
                  </span>
                  {!v.allowed && (
                    <>
                      <span
                        className="font-mono"
                        style={{
                          display: "block",
                          fontSize: 12,
                          color: DENY,
                          lineHeight: 1.6,
                          marginTop: 3,
                        }}
                      >
                        {v.reason!.title}. {v.message}
                      </span>
                      {v.hint && (
                        <span
                          className="font-mono"
                          style={{
                            display: "block",
                            fontSize: 11.5,
                            color: INK_3,
                            lineHeight: 1.6,
                            marginTop: 2,
                          }}
                        >
                          {v.hint}
                        </span>
                      )}
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        <p
          className="font-mono"
          style={{ fontSize: 11.5, color: INK_3, lineHeight: 1.65, margin: "12px 0 0" }}
        >
          {clock.note}
        </p>
      </Panel>

      <Panel>
        <PanelHead accent={accent} title="WHY SCRUBBING IS SAFE">
          the engine replays, it does not extrapolate
        </PanelHead>
        <ul style={{ listStyle: "none", margin: "11px 0 0", padding: 0 }}>
          {clock.pipeline.map((item, i) => (
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

      <Panel>
        <PanelHead accent={accent} title="THE ONE-WAY RULE">
          each layer may know the one below it, never the one above
        </PanelHead>
        <div style={{ marginTop: 12 }}>
          {clock.layers.map((layer, i) => (
            <div
              key={layer.label}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                marginBottom: i === clock.layers.length - 1 ? 0 : 6,
                border: `1px solid ${i === clock.layers.length - 1 ? `${accent}88` : "#3a4166"}`,
                background:
                  i === clock.layers.length - 1 ? `${accent}18` : "rgba(34,41,71,0.6)",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
                <span style={{ fontFamily: PIXEL, fontSize: 9, color: INK }}>{layer.label}</span>
                {i < clock.layers.length - 1 && (
                  <span aria-hidden="true" style={{ fontSize: 11, color: INK_3 }}>
                    ↓
                  </span>
                )}
              </div>
              <p
                className="font-mono"
                style={{ fontSize: 12, color: INK_2, lineHeight: 1.65, margin: "6px 0 0" }}
              >
                {layer.detail}
              </p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
