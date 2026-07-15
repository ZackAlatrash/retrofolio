import type { DiagramStage } from "../content/types";

interface DiagramProps {
  stages: DiagramStage[];
  /** Number of stages currently revealed. Defaults to all (static render). */
  revealed?: number;
  showCaptions?: boolean;
}

/**
 * Static, accessible architecture-flow diagram. Also used as the reduced-motion
 * fallback for the animated PipelineScene (revealed = stages.length).
 */
export function Diagram({
  stages,
  revealed = stages.length,
  showCaptions = true,
}: DiagramProps) {
  return (
    <div>
      <ol
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "stretch",
          gap: 8,
        }}
      >
        {stages.map((stage, i) => {
          const on = i < revealed;
          const last = i === stages.length - 1;
          const color = last ? "var(--term-green)" : "var(--term-accent)";
          return (
            <li
              key={stage.label}
              style={{
                display: "flex",
                alignItems: "stretch",
                gap: 8,
                opacity: on ? 1 : 0.25,
                transition: "opacity 0.3s ease",
              }}
            >
              <div
                style={{
                  minWidth: 120,
                  border: `1px solid ${on ? color : "var(--term-dim)"}`,
                  borderRadius: 8,
                  padding: "8px 12px",
                  background: "color-mix(in srgb, var(--term-fg) 4%, transparent)",
                }}
              >
                <div
                  className="font-mono"
                  style={{ fontSize: 12.5, color }}
                >
                  {stage.label}
                </div>
                {showCaptions && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--term-dim)",
                      marginTop: 3,
                      lineHeight: 1.4,
                    }}
                  >
                    {stage.caption}
                  </div>
                )}
              </div>
              {!last && (
                <span
                  aria-hidden="true"
                  className="font-mono"
                  style={{
                    alignSelf: "center",
                    color: "var(--term-dim)",
                    fontSize: 13,
                  }}
                >
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
