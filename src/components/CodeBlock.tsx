interface CodeBlockProps {
  code: string;
  caption?: string;
  filename?: string;
}

/** A minimal monospace code artifact. Syntax highlighting can be layered later. */
export function CodeBlock({ code, caption, filename }: CodeBlockProps) {
  return (
    <figure style={{ margin: 0 }}>
      <div
        style={{
          borderRadius: 10,
          border: "1px solid var(--term-dim)",
          overflow: "hidden",
          background: "color-mix(in srgb, var(--term-fg) 4%, var(--term-bg))",
        }}
      >
        {filename && (
          <div
            className="font-mono"
            style={{
              fontSize: 11,
              color: "var(--term-dim)",
              padding: "6px 12px",
              borderBottom: "1px solid var(--term-dim)",
            }}
          >
            {filename}
          </div>
        )}
        <pre
          className="font-mono"
          style={{
            margin: 0,
            padding: "12px 14px",
            fontSize: 12.5,
            lineHeight: 1.6,
            color: "var(--term-fg)",
            overflowX: "auto",
          }}
        >
          <code>{code}</code>
        </pre>
      </div>
      {caption && (
        <figcaption
          style={{ fontSize: 12, color: "var(--term-dim)", marginTop: 8 }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
