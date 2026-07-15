import type { ProjectStatus } from "../content/types";

const COLOR: Record<ProjectStatus, string> = {
  deployed: "var(--term-green)",
  live: "var(--term-green)",
  adopted: "var(--term-accent)",
  beta: "var(--term-amber)",
  academic: "var(--term-dim)",
  personal: "var(--term-dim)",
};

export function Badge({ status }: { status: ProjectStatus }) {
  const color = COLOR[status];
  return (
    <span
      className="font-mono"
      style={{
        color,
        border: `1px solid ${color}`,
        borderRadius: 999,
        padding: "1px 9px",
        fontSize: 11,
        lineHeight: 1.6,
        opacity: 0.95,
      }}
    >
      {status}
    </span>
  );
}
