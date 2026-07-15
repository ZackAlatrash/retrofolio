import { profile } from "../content/profile";
import { StatCounter } from "../components/StatCounter";

/** Count-up proof metrics that animate when scrolled into view. */
export function ProofStrip({ id = "proof" }: { id?: string }) {
  return (
    <section
      id={id}
      aria-label="Proof metrics"
      style={{
        borderBottom: "1px solid color-mix(in srgb, var(--term-dim) 40%, transparent)",
        background: "color-mix(in srgb, var(--term-fg) 3%, var(--term-bg))",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        <div
          className="font-mono"
          style={{ fontSize: 12, color: "var(--term-dim)", marginBottom: 22 }}
        >
          <span style={{ color: "var(--term-green)" }}>{"// "}</span>
          by the numbers
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 24,
          }}
        >
          {profile.headlineMetrics.map((m) => (
            <StatCounter key={m.label} value={m.value} label={m.label} />
          ))}
        </div>
      </div>
    </section>
  );
}
