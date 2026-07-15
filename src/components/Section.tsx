import type { ReactNode } from "react";

interface SectionProps {
  id: string;
  title?: string;
  children: ReactNode;
}

/** A page section with a terminal-style comment heading and a scroll anchor. */
export function Section({ id, title, children }: SectionProps) {
  return (
    <section
      id={id}
      aria-label={title ?? id}
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "72px 24px",
        scrollMarginTop: 24,
      }}
    >
      {title && (
        <h2
          className="font-mono"
          style={{
            fontSize: 13,
            fontWeight: 400,
            color: "var(--term-dim)",
            margin: "0 0 24px",
          }}
        >
          <span style={{ color: "var(--term-green)" }}>{"// "}</span>
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
