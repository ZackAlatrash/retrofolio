import { useState } from "react";
import type { Project } from "../content/types";
import { cardProjects } from "../content/projects";
import { Badge } from "../components/Badge";
import { useReducedMotion } from "../motion/useReducedMotion";

function ExternalIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: "translateY(1px)" }}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function Card({ project, wide }: { project: Project; wide: boolean }) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);
  const lift = active && !reduced;

  return (
    <article
      id={`project-${project.id}`}
      aria-label={project.name}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      tabIndex={0}
      style={{
        gridColumn: wide ? "span 2" : "span 1",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "18px 20px",
        borderRadius: 14,
        border: `1px solid ${lift ? "var(--term-accent)" : "color-mix(in srgb, var(--term-dim) 60%, transparent)"}`,
        background: "color-mix(in srgb, var(--term-fg) 4%, var(--term-bg))",
        transform: lift ? "translateY(-4px)" : "translateY(0)",
        boxShadow: lift
          ? "0 12px 30px -12px color-mix(in srgb, var(--term-accent) 45%, transparent)"
          : "0 0 0 transparent",
        transition:
          "transform 0.28s cubic-bezier(0.22,1,0.36,1), border-color 0.25s ease, box-shadow 0.28s ease",
        outline: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 600,
            color: "var(--term-fg)",
          }}
        >
          {project.name}
        </h3>
        <span style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {project.status.map((s) => (
            <Badge key={s} status={s} />
          ))}
        </span>
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 13.5,
          lineHeight: 1.55,
          color: "var(--term-fg)",
          opacity: 0.9,
        }}
      >
        {project.whatItIs}
      </p>

      {project.metrics && project.metrics.length > 0 && (
        <div
          style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 2 }}
        >
          {project.metrics.map((m) => (
            <span key={m.label} className="font-mono" style={{ fontSize: 12 }}>
              <span style={{ color: "var(--term-accent)", fontWeight: 500 }}>
                {m.value}
              </span>{" "}
              <span style={{ color: "var(--term-dim)" }}>{m.label}</span>
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginTop: "auto",
          paddingTop: 6,
        }}
      >
        {project.stack.slice(0, wide ? 6 : 4).map((s) => (
          <span
            key={s}
            className="font-mono"
            style={{
              fontSize: 11,
              color: "var(--term-dim)",
              border: "1px solid color-mix(in srgb, var(--term-dim) 45%, transparent)",
              padding: "1px 7px",
              borderRadius: 5,
            }}
          >
            {s}
          </span>
        ))}
      </div>

      {project.links && project.links.length > 0 && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 4 }}>
          {project.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noreferrer noopener"
              className="font-mono"
              style={{
                fontSize: 12.5,
                color: "var(--term-accent)",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                textDecoration: "none",
              }}
            >
              {l.label} <ExternalIcon />
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

/** The concise project cards in a bento grid with hover/focus lift. */
export function MoreWork({ id = "more" }: { id?: string }) {
  return (
    <section
      id={id}
      aria-label="More projects"
      style={{ maxWidth: 900, margin: "0 auto", padding: "56px 24px" }}
    >
      <div
        className="font-mono"
        style={{ fontSize: 12, color: "var(--term-dim)", marginBottom: 8 }}
      >
        <span style={{ color: "var(--term-green)" }}>{"// "}</span>
        more work
      </div>
      <h2
        style={{
          margin: "0 0 24px",
          fontSize: "clamp(22px, 3.6vw, 30px)",
          fontWeight: 600,
          color: "var(--term-fg)",
          letterSpacing: -0.3,
        }}
      >
        The rest of the shelf
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {cardProjects.map((p, i) => (
          <Card key={p.id} project={p} wide={i === 0} />
        ))}
      </div>
    </section>
  );
}
