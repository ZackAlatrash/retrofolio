import type { ReactNode } from "react";

type FrameKind = "phone" | "browser";

interface DeviceFrameProps {
  kind?: FrameKind;
  label: string;
  children: ReactNode;
}

/** A phone or browser chrome frame around a screenshot or mock. */
export function DeviceFrame({
  kind = "phone",
  label,
  children,
}: DeviceFrameProps) {
  const isPhone = kind === "phone";
  return (
    <div
      role="img"
      aria-label={label}
      style={{
        width: isPhone ? 190 : "100%",
        borderRadius: isPhone ? 22 : 12,
        border: "3px solid var(--term-dim)",
        background: "var(--term-bg)",
        padding: isPhone ? 8 : 0,
        overflow: "hidden",
      }}
    >
      {!isPhone && (
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            padding: "8px 10px",
            borderBottom: "1px solid var(--term-dim)",
          }}
        >
          <span style={dot("#ff5f56")} />
          <span style={dot("#ffbd2e")} />
          <span style={dot("#27c93f")} />
        </div>
      )}
      <div style={{ borderRadius: isPhone ? 14 : 0, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function dot(color: string): React.CSSProperties {
  return {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: color,
    display: "inline-block",
  };
}
