import { deepProjects } from "../content/projects";
import { ProjectScene } from "./ProjectScene";

/** The six deep projects, each rendered as a full scroll-revealed scene. */
export function SelectedWork({ id = "work" }: { id?: string }) {
  return (
    <section
      id={id}
      aria-label="Selected work"
      style={{ maxWidth: 900, margin: "0 auto", padding: "72px 24px 24px" }}
    >
      <div
        className="font-mono"
        style={{ fontSize: 12, color: "var(--term-dim)", marginBottom: 8 }}
      >
        <span style={{ color: "var(--term-green)" }}>{"// "}</span>
        selected work
      </div>
      <h2
        style={{
          margin: "0 0 8px",
          fontSize: "clamp(24px, 4vw, 34px)",
          fontWeight: 600,
          color: "var(--term-fg)",
          letterSpacing: -0.4,
        }}
      >
        Six systems, built to hold up
      </h2>
      <div>
        {deepProjects.map((p) => (
          <ProjectScene key={p.id} project={p} />
        ))}
      </div>
    </section>
  );
}
