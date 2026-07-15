import { profile } from "./content/profile";
import { deepProjects } from "./content/projects";
import { Section } from "./components/Section";
import { StatCounter } from "./components/StatCounter";
import { Diagram } from "./components/Diagram";
import { Badge } from "./components/Badge";
import { useTheme } from "./theme/useTheme";

/**
 * Foundation shell. Real sections (Hero, PipelineScene, SelectedWork, chatbot,
 * command palette, boot) are built in the parallel workstreams per the plan.
 * This renders the content model so the foundation is verifiable end to end.
 */
export function App() {
  const { theme, setTheme, themes } = useTheme();
  const omni = deepProjects.find((p) => p.id === "omnipotence");

  return (
    <main>
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          padding: "16px 24px",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <span
          className="font-mono"
          style={{ fontSize: 12, color: "var(--term-dim)", alignSelf: "center" }}
        >
          theme:
        </span>
        {themes.map((t) => (
          <button
            key={t.name}
            onClick={() => setTheme(t.name)}
            className="font-mono"
            aria-pressed={theme === t.name}
            style={{
              fontSize: 12,
              padding: "3px 10px",
              borderRadius: 6,
              cursor: "pointer",
              background: "transparent",
              color: theme === t.name ? "var(--term-accent)" : "var(--term-fg)",
              border: `1px solid ${theme === t.name ? "var(--term-accent)" : "var(--term-dim)"}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Section id="whoami">
        <div
          className="font-mono"
          style={{ fontSize: 12, color: "var(--term-green)", marginBottom: 8 }}
        >
          $ whoami
        </div>
        <h1 style={{ fontSize: 30, margin: "0 0 8px", color: "var(--term-fg)" }}>
          {profile.name}{" "}
          <span style={{ color: "var(--term-dim)", fontSize: 18 }}>
            ({profile.goesBy})
          </span>
        </h1>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.5,
            maxWidth: 560,
            color: "var(--term-fg)",
          }}
        >
          {profile.positioning}
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 12,
            marginTop: 28,
          }}
        >
          {profile.headlineMetrics.map((m) => (
            <StatCounter key={m.label} value={m.value} label={m.label} />
          ))}
        </div>
      </Section>

      {omni?.diagram && (
        <Section id="pipeline" title={`${omni.name} — retrieval pipeline`}>
          <Diagram stages={omni.diagram} />
        </Section>
      )}

      <Section id="work" title="selected work">
        <div style={{ display: "grid", gap: 20 }}>
          {deepProjects.map((p) => (
            <article
              key={p.id}
              style={{
                border: "1px solid var(--term-dim)",
                borderRadius: 12,
                padding: "16px 18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  marginBottom: 6,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 17, color: "var(--term-fg)" }}>
                  {p.name}
                </span>
                {p.status.map((s) => (
                  <Badge key={s} status={s} />
                ))}
              </div>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: "var(--term-fg)",
                  margin: "0 0 10px",
                }}
              >
                {p.whatItIs}
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {p.stack.slice(0, 6).map((s) => (
                  <span
                    key={s}
                    className="font-mono"
                    style={{
                      fontSize: 11,
                      color: "var(--term-accent)",
                      background:
                        "color-mix(in srgb, var(--term-accent) 12%, transparent)",
                      padding: "2px 8px",
                      borderRadius: 5,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Section>
    </main>
  );
}
