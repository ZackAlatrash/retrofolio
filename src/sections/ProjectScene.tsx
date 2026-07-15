import type { CSSProperties, ReactNode } from "react";
import type { Project } from "../content/types";
import { Badge } from "../components/Badge";
import { Diagram } from "../components/Diagram";
import { CodeBlock } from "../components/CodeBlock";
import { DeviceFrame } from "../components/DeviceFrame";
import { StatCounter } from "../components/StatCounter";
import { useScrollReveal, revealStyle } from "../motion/useScrollReveal";

/**
 * Per-project architecture artifacts for the deep projects that have no
 * `diagram` field. These are honest, representative code artifacts (never a
 * faked screenshot) illustrating the project's hardest architectural idea, per
 * MOTION-VISUALS §6. Device frames carry clearly-labelled placeholder mockups.
 */
interface Artifact {
  code: string;
  filename: string;
  caption: string;
  frame?: { kind: "phone" | "browser"; label: string; note: string };
}

const ARTIFACTS: Record<string, Artifact> = {
  "recomp-tracker": {
    filename: "CoachService.kt",
    caption: "Every metric is computed by the domain before the model speaks.",
    code: `// Deterministic-first: domain computes, the LLM only narrates.
fun coachReply(question: String, facts: WeeklyFacts): CoachReply {
    val verdict = adjustmentEngine.evaluate(facts)   // numbers, deterministic
    val prose   = llm.explain(question, verdict)      // words only, no math
    return CoachReply(metrics = verdict.metrics, text = prose)
}`,
    frame: {
      kind: "phone",
      label: "Recomp Tracker app mockup",
      note: "device mockup · screenshot pending",
    },
  },
  "consented-cart": {
    filename: "schema.prisma",
    caption: "Opt-in is a database invariant, not a UI checkbox.",
    code: `model ConsentRecord {
  id         String    @id @default(cuid())
  purpose    Purpose   // MARKETING | TRANSACTIONAL
  granted    Boolean   @default(false)  // never opt-in by default
  grantedAt  DateTime?
  version    Int                        // versioned consent
  revokedAt  DateTime?                  // separately revocable
}`,
    frame: {
      kind: "browser",
      label: "Consented Cart admin dashboard mockup",
      note: "Polaris admin dashboard · screenshot pending",
    },
  },
  tulipvision: {
    filename: "tiled_inference.py",
    caption:
      "Overlapping tiles recover small sprouts; one global NMS removes seam duplicates.",
    code: `def detect(image):
    tiles = tile(image, size=640, overlap=0.2)
    boxes = [model(batch) for batch in batched(tiles)]
    boxes = remap_to_original(boxes, tiles)
    return global_nms(boxes)   # drop duplicates along tile seams`,
    frame: {
      kind: "browser",
      label: "TulipVision annotated detection mockup",
      note: "annotated detection view · image pending",
    },
  },
  "locked-in": {
    filename: "PolicyEngine.swift",
    caption:
      "One authority for every mutation; each denial carries a user-facing reason.",
    code: `// Single gatekeeper -> invalid states are unrepresentable.
func authorize(_ action: Action, _ state: CommitmentState) -> Decision {
    guard state.isWithinWindow else {
        return .denied(reason: "Outside the 14-day evaluation window")
    }
    return policy.evaluate(action, state)
}`,
    frame: {
      kind: "phone",
      label: "Locked IN iOS app mockup",
      note: "iOS device mockup · screenshot pending",
    },
  },
};

function PlaceholderScreen({ note }: { note: string }) {
  return (
    <div
      style={{
        aspectRatio: "3 / 5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        textAlign: "center",
        background:
          "repeating-linear-gradient(135deg, color-mix(in srgb, var(--term-fg) 4%, var(--term-bg)) 0 10px, transparent 10px 20px)",
      }}
    >
      <span
        className="font-mono"
        style={{ fontSize: 11, color: "var(--term-dim)", lineHeight: 1.5 }}
      >
        {note}
      </span>
    </div>
  );
}

function ArchitectureVisual({ project }: { project: Project }) {
  if (project.diagram) {
    return <Diagram stages={project.diagram} />;
  }
  const artifact = ARTIFACTS[project.id];
  if (!artifact) {
    return (
      <CodeBlock
        code={project.architecture ?? project.whatItIs}
        caption="Architecture"
      />
    );
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: artifact.frame ? "1fr auto" : "1fr",
        gap: 20,
        alignItems: "start",
      }}
    >
      <CodeBlock
        code={artifact.code}
        filename={artifact.filename}
        caption={artifact.caption}
      />
      {artifact.frame && (
        <div style={{ justifySelf: "center" }}>
          <DeviceFrame kind={artifact.frame.kind} label={artifact.frame.label}>
            <PlaceholderScreen note={artifact.frame.note} />
          </DeviceFrame>
        </div>
      )}
    </div>
  );
}

function Block({
  label,
  children,
  color = "var(--term-dim)",
}: {
  label: string;
  children: ReactNode;
  color?: string;
}) {
  return (
    <div>
      <div
        className="font-mono"
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          color,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 14.5,
          lineHeight: 1.6,
          color: "var(--term-fg)",
        }}
      >
        {children}
      </p>
    </div>
  );
}

export function ProjectScene({ project }: { project: Project }) {
  const { ref, visible } = useScrollReveal<HTMLElement>();

  return (
    <article
      ref={ref}
      id={`project-${project.id}`}
      aria-label={project.name}
      style={{
        ...revealStyle(visible),
        scrollMarginTop: 24,
        borderTop: "1px solid color-mix(in srgb, var(--term-dim) 40%, transparent)",
        padding: "56px 0",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "clamp(20px, 3vw, 28px)",
            fontWeight: 600,
            color: "var(--term-fg)",
            letterSpacing: -0.3,
          }}
        >
          {project.name}
        </h3>
        <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {project.status.map((s) => (
            <Badge key={s} status={s} />
          ))}
        </span>
      </header>

      <p
        style={{
          margin: "0 0 24px",
          fontSize: 16,
          lineHeight: 1.6,
          color: "var(--term-fg)",
          maxWidth: 680,
        }}
      >
        {project.whatItIs}
      </p>

      {project.problem && (
        <div style={{ marginBottom: 28, maxWidth: 720 }}>
          <Block label="problem" color="var(--term-amber)">
            {project.problem}
          </Block>
        </div>
      )}

      <div style={{ margin: "0 0 28px" }}>
        <div
          className="font-mono"
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            color: "var(--term-accent)",
            marginBottom: 12,
          }}
        >
          architecture
        </div>
        <ArchitectureVisual project={project} />
        {project.architecture && (
          <p
            style={{
              margin: "16px 0 0",
              fontSize: 14.5,
              lineHeight: 1.6,
              color: "var(--term-fg)",
              maxWidth: 720,
            }}
          >
            {project.architecture}
          </p>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
          marginBottom: 28,
        }}
      >
        {project.hardestProblem && (
          <Block label="hardest problem" color="var(--term-cite)">
            {project.hardestProblem}
          </Block>
        )}
        {project.tradeoffs && (
          <Block label="trade-offs">{project.tradeoffs}</Block>
        )}
      </div>

      {project.metrics && project.metrics.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 20,
            padding: "20px 0",
            borderTop: "1px solid color-mix(in srgb, var(--term-dim) 30%, transparent)",
            borderBottom:
              "1px solid color-mix(in srgb, var(--term-dim) 30%, transparent)",
            marginBottom: 20,
          }}
        >
          {project.metrics.map((m) => (
            <StatCounter key={m.label} value={m.value} label={m.label} />
          ))}
        </div>
      )}

      {project.limitations && (
        <p
          style={
            {
              margin: 0,
              fontSize: 13.5,
              lineHeight: 1.6,
              color: "var(--term-dim)",
              maxWidth: 720,
            } as CSSProperties
          }
        >
          <span
            className="font-mono"
            style={{ color: "var(--term-red)", marginRight: 8 }}
          >
            limitations:
          </span>
          {project.limitations}
        </p>
      )}
    </article>
  );
}
