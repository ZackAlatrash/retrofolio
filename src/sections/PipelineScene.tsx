import { useEffect, useRef, useState } from "react";
import { getProject } from "../content/projects";
import { Diagram } from "../components/Diagram";
import { useReducedMotion } from "../motion/useReducedMotion";
import { buildPipelineTimeline } from "../motion/pipelineTimeline";

const CITATION = "cites src/adapters/opensearch/hybrid_search.py:42";

/**
 * The signature animation: the Omnipotence six-stage RAG pipeline assembles
 * stage-by-stage as the pinned section is scrubbed, a token flows down the
 * rail, and the final stage resolves green with a sample citation.
 *
 * Under reduced motion it renders the full <Diagram/> with every caption.
 */
export function PipelineScene({ id = "pipeline" }: { id?: string }) {
  const reduced = useReducedMotion();
  const omni = getProject("omnipotence");
  const stages = omni?.diagram ?? [];
  const n = stages.length;

  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<HTMLDivElement>(null);
  const stageRefs = useRef<HTMLLIElement[]>([]);
  const [revealed, setRevealed] = useState(reduced ? n : 1);

  useEffect(() => {
    if (reduced || n === 0) return;
    const section = sectionRef.current;
    const pin = pinRef.current;
    if (!section || !pin) return;
    const cleanup = buildPipelineTimeline({
      section,
      pin,
      stages: stageRefs.current.slice(0, n),
      token: tokenRef.current,
      onProgress: setRevealed,
    });
    return cleanup;
  }, [reduced, n]);

  if (n === 0) return null;

  const heading = (
    <div style={{ marginBottom: 28 }}>
      <div
        className="font-mono"
        style={{ fontSize: 12, color: "var(--term-dim)", marginBottom: 10 }}
      >
        <span style={{ color: "var(--term-green)" }}>{"// "}</span>
        signature: the retrieval pipeline
      </div>
      <h2
        style={{
          margin: 0,
          fontSize: "clamp(22px, 3.6vw, 32px)",
          fontWeight: 600,
          color: "var(--term-fg)",
          letterSpacing: -0.3,
        }}
      >
        How Omnipotence answers a question
      </h2>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: 15,
          lineHeight: 1.55,
          color: "var(--term-dim)",
          maxWidth: 560,
        }}
      >
        A plain-English question becomes a source-cited answer through six
        independently runnable stages.
      </p>
    </div>
  );

  // Reduced-motion: full static diagram, all captions, plus the citation.
  if (reduced) {
    return (
      <section
        id={id}
        aria-label="Retrieval pipeline"
        style={{ maxWidth: 900, margin: "0 auto", padding: "72px 24px" }}
      >
        {heading}
        <Diagram stages={stages} />
        <CitationLine visible />
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-label="Retrieval pipeline"
      style={{ position: "relative" }}
    >
      <div
        ref={pinRef}
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 760,
          margin: "0 auto",
          padding: "48px 24px",
        }}
      >
        {heading}

        <div style={{ position: "relative", paddingLeft: 34 }}>
          {/* rail + flowing token */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 11,
              top: 12,
              bottom: 12,
              width: 2,
              background:
                "color-mix(in srgb, var(--term-dim) 60%, transparent)",
              borderRadius: 2,
            }}
          >
            <div
              ref={tokenRef}
              style={{
                position: "absolute",
                left: "50%",
                top: "0%",
                width: 12,
                height: 12,
                marginLeft: -6,
                marginTop: -6,
                borderRadius: "50%",
                background: "var(--term-cite)",
                boxShadow:
                  "0 0 10px 2px color-mix(in srgb, var(--term-cite) 70%, transparent)",
              }}
            />
          </div>

          <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {stages.map((stage, i) => {
              const last = i === n - 1;
              const isRevealed = i < revealed;
              const color = last ? "var(--term-green)" : "var(--term-accent)";
              return (
                <li
                  key={stage.label}
                  ref={(el) => {
                    if (el) stageRefs.current[i] = el;
                  }}
                  style={{
                    position: "relative",
                    marginBottom: i === n - 1 ? 0 : 14,
                  }}
                >
                  {/* node marker on the rail */}
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: -28,
                      top: 16,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: isRevealed ? color : "var(--term-bg)",
                      border: `2px solid ${isRevealed ? color : "var(--term-dim)"}`,
                    }}
                  />
                  <div
                    style={{
                      border: `1px solid ${isRevealed ? color : "var(--term-dim)"}`,
                      borderRadius: 10,
                      padding: "12px 16px",
                      background: last
                        ? "color-mix(in srgb, var(--term-green) 8%, var(--term-bg))"
                        : "color-mix(in srgb, var(--term-fg) 4%, var(--term-bg))",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span
                        className="font-mono"
                        style={{ fontSize: 12, color: "var(--term-dim)" }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="font-mono"
                        style={{ fontSize: 14.5, color, fontWeight: 500 }}
                      >
                        {stage.label}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--term-fg)",
                        marginTop: 4,
                        lineHeight: 1.45,
                        opacity: 0.85,
                      }}
                    >
                      {stage.caption}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <CitationLine visible={revealed >= n} />
      </div>
    </section>
  );
}

function CitationLine({ visible }: { visible: boolean }) {
  return (
    <div
      aria-live="polite"
      style={{
        marginTop: 20,
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 13,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      <span
        className="font-mono"
        style={{
          color: "var(--term-green)",
          fontSize: 12,
        }}
      >
        ✓ grounded
      </span>
      <span
        className="font-mono"
        style={{
          color: "var(--term-cite)",
          border: "1px solid color-mix(in srgb, var(--term-cite) 55%, transparent)",
          background: "color-mix(in srgb, var(--term-cite) 12%, transparent)",
          borderRadius: 6,
          padding: "2px 9px",
          fontSize: 12,
        }}
      >
        {CITATION}
      </span>
    </div>
  );
}
