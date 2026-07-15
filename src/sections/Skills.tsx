import { profile } from "../content/profile";
import { Section } from "../components/Section";
import { useScrollReveal, revealStyle } from "../motion/useScrollReveal";

function SkillGroupRow({
  name,
  skills,
  delay,
}: {
  name: string;
  skills: string[];
  delay: number;
}) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{
        ...revealStyle(visible, 16),
        transitionDelay: visible ? `${delay}ms` : "0ms",
        display: "grid",
        gridTemplateColumns: "minmax(140px, 200px) 1fr",
        gap: 20,
        padding: "18px 0",
        borderTop: "1px solid color-mix(in srgb, var(--term-dim) 30%, transparent)",
      }}
    >
      <h3
        className="font-mono"
        style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 500,
          color: "var(--term-accent)",
        }}
      >
        {name}
      </h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {skills.map((s) => (
          <span
            key={s}
            style={{
              fontSize: 13,
              color: "var(--term-fg)",
              background: "color-mix(in srgb, var(--term-fg) 6%, transparent)",
              border: "1px solid color-mix(in srgb, var(--term-dim) 40%, transparent)",
              padding: "3px 10px",
              borderRadius: 999,
            }}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Skills grouped exactly as in the profile, with a light staggered reveal. */
export function Skills({ id = "skills" }: { id?: string }) {
  return (
    <Section id={id} title="skills">
      <div>
        {profile.skillGroups.map((g, i) => (
          <SkillGroupRow
            key={g.name}
            name={g.name}
            skills={g.skills}
            delay={i * 60}
          />
        ))}
      </div>
    </Section>
  );
}
