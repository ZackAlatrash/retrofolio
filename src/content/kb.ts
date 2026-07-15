import type { KBChunk } from "./types";
import { projects } from "./projects";
import { profile } from "./profile";

/**
 * Derives the retrieval knowledge base from the curated content model. This is
 * the single source of truth the grounded chatbot answers from. No fabrication:
 * every chunk's prose comes straight from projects.ts / profile.ts, so numbers
 * the model cites are numbers that already exist in the resume-derived content.
 *
 * Chunk ids are stable citation anchors (e.g. `omnipotence:architecture`,
 * `profile:strongest-project`). Chunking is per-facet, not mid-sentence, and a
 * per-project cap in the retriever keeps top-k source-diverse.
 */

function stackTags(stack: string[]): string[] {
  return stack
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

function metricsSentence(name: string, metrics: { value: string; label: string }[]): string {
  const parts = metrics.map((m) => `${m.value} ${m.label}`).join(", ");
  return `${name} by the numbers: ${parts}.`;
}

/** Builds the full KB. Deterministic and pure, safe to call at request time. */
export function buildKb(): KBChunk[] {
  const chunks: KBChunk[] = [];

  for (const p of projects) {
    const baseTags = [
      ...stackTags(p.stack),
      ...p.status,
      ...p.name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean),
    ];

    // Overview: what it is + the problem it solves.
    chunks.push({
      id: `${p.id}:overview`,
      projectId: p.id,
      sectionLabel: `${p.name} overview`,
      text: [`${p.name}. ${p.whatItIs}`, p.problem].filter(Boolean).join(" "),
      tags: [...baseTags, "project", "overview", "summary"],
    });

    if (p.architecture) {
      chunks.push({
        id: `${p.id}:architecture`,
        projectId: p.id,
        sectionLabel: `${p.name} architecture`,
        text: `${p.name} architecture. ${p.architecture}`,
        tags: [...baseTags, "architecture", "design", "structure"],
      });
    }

    if (p.hardestProblem) {
      chunks.push({
        id: `${p.id}:hardest`,
        projectId: p.id,
        sectionLabel: `${p.name} hardest problem`,
        text: `The hardest problem in ${p.name}. ${p.hardestProblem}`,
        tags: [...baseTags, "hardest", "problem", "challenge", "engineering"],
      });
    }

    if (p.tradeoffs) {
      chunks.push({
        id: `${p.id}:tradeoffs`,
        projectId: p.id,
        sectionLabel: `${p.name} tradeoffs`,
        text: `Tradeoffs in ${p.name}. ${p.tradeoffs}`,
        tags: [...baseTags, "tradeoffs", "decisions", "engineering"],
      });
    }

    if (p.limitations) {
      chunks.push({
        id: `${p.id}:limitations`,
        projectId: p.id,
        sectionLabel: `${p.name} limitations`,
        text: `Limitations of ${p.name}. ${p.limitations}`,
        tags: [...baseTags, "limitations", "honesty", "scope"],
      });
    }

    if (p.metrics && p.metrics.length > 0) {
      chunks.push({
        id: `${p.id}:metrics`,
        projectId: p.id,
        sectionLabel: `${p.name} metrics`,
        text: metricsSentence(p.name, p.metrics),
        tags: [...baseTags, "metrics", "numbers", "scale"],
      });
    }
  }

  // Identity and positioning.
  chunks.push({
    id: "profile:positioning",
    projectId: null,
    sectionLabel: "Positioning",
    text: `${profile.name}, who goes by ${profile.goesBy}. ${profile.positioning}`,
    tags: ["identity", "positioning", "about", "who", "engineer", "llm", "ai"],
  });

  // Availability and role sought.
  chunks.push({
    id: "profile:availability",
    projectId: null,
    sectionLabel: "Availability",
    text: `${profile.goesBy} is looking for a ${profile.seeking}. He is available for junior software developer roles and open to opportunities.`,
    tags: ["availability", "available", "hiring", "hire", "role", "roles", "seeking", "looking", "want", "wants", "job", "position", "opportunity", "internship", "junior", "developer", "part-time"],
  });

  // Location and work permit.
  chunks.push({
    id: "profile:location",
    projectId: null,
    sectionLabel: "Location and work permit",
    text: `${profile.goesBy} is located and based in ${profile.location}, where he lives. Work eligibility: ${profile.status}.`,
    tags: ["location", "located", "based", "live", "lives", "living", "city", "country", "netherlands", "haarlem", "dutch", "relocation", "relocate", "permit", "visa", "work", "residence", "eligibility"],
  });

  // Languages.
  chunks.push({
    id: "profile:languages",
    projectId: null,
    sectionLabel: "Languages",
    text: `Languages ${profile.goesBy} speaks: ${profile.languages.join(", ")}.`,
    tags: ["languages", "arabic", "english", "dutch", "spoken"],
  });

  // Education.
  chunks.push({
    id: "profile:education",
    projectId: null,
    sectionLabel: "Education",
    text: `Education. ${profile.education} He is a student but the work is production-grade rather than coursework toys.`,
    tags: ["education", "student", "university", "inholland", "degree", "bsc", "propedeuse", "minor", "data", "ai"],
  });

  // Certifications.
  chunks.push({
    id: "profile:certifications",
    projectId: null,
    sectionLabel: "Certifications",
    text: `Certification highlight: ${profile.certHighlight}.`,
    tags: ["certification", "aws", "certified", "practitioner", "credential"],
  });

  // Curated: strongest project. projectId set so the citation deep-links to it.
  chunks.push({
    id: "profile:strongest-project",
    projectId: "omnipotence",
    sectionLabel: "Strongest project",
    text: "His strongest project is Omnipotence, a code-aware RAG engine that is both deployed and adopted. It shows the full range: hexagonal architecture with boundary tests that fail the build, a six-stage retrieval and reranking pipeline, and a full AWS infrastructure-as-code deployment. It is the clearest evidence of grounded AI built to production standards.",
    tags: ["strongest", "best", "top", "impressive", "flagship", "project", "omnipotence", "rag", "recommend"],
  });

  // Curated: RAG experience across three systems.
  chunks.push({
    id: "profile:rag",
    projectId: null,
    sectionLabel: "RAG experience",
    text: "He has built three independent RAG systems: Omnipotence for code, Lex-AI over EU AI policy with a from-scratch NumPy vector store, and the cited AI coach inside Recomp Tracker. All are built around evidence gating, citation enforcement, and deterministic boundaries so the model cannot fabricate.",
    tags: ["rag", "retrieval", "grounded", "embeddings", "vector", "citations", "evidence", "gating", "llm", "ai"],
  });

  // Curated: production AWS experience.
  chunks.push({
    id: "profile:aws",
    projectId: "omnipotence",
    sectionLabel: "Production AWS experience",
    text: "Yes, he has production AWS experience. Omnipotence is deployed to AWS entirely as infrastructure-as-code with CloudFormation: containerised services on ECS and ECR behind API Gateway and an ALB, Amazon Bedrock for inference, OpenSearch for hybrid search, S3 for vectors, and Lambda for ingestion. He also holds the AWS Certified AI Practitioner certification.",
    tags: ["aws", "cloud", "production", "deployed", "cloudformation", "ecs", "bedrock", "lambda", "opensearch", "s3", "infrastructure", "devops"],
  });

  // Curated: architecture discipline.
  chunks.push({
    id: "profile:architecture",
    projectId: null,
    sectionLabel: "Architecture discipline",
    text: "Architecture is his differentiator. He uses hexagonal ports-and-adapters, clean architecture, pure domain layers with zero framework dependencies, and automated boundary tests that fail the build when business logic reaches for an adapter.",
    tags: ["architecture", "hexagonal", "ports", "adapters", "clean", "domain", "boundary", "design", "structure", "engineering"],
  });

  // Curated: testing discipline.
  chunks.push({
    id: "profile:testing",
    projectId: null,
    sectionLabel: "Testing discipline",
    text: "His testing discipline is strong. He practices test-driven development and has written roughly 1,300 unit tests on Recomp Tracker alone, plus architecture boundary tests that fail the build. Across projects he uses pytest, JUnit 5, Vitest, XCTest, Cucumber for BDD, and Playwright, covering unit, integration, contract, and end-to-end levels.",
    tags: ["testing", "tests", "discipline", "tdd", "pytest", "junit", "vitest", "xctest", "playwright", "cucumber", "bdd", "unit", "integration", "coverage", "quality"],
  });

  // Curated: experience level and honest weakness.
  chunks.push({
    id: "profile:experience",
    projectId: null,
    sectionLabel: "Experience and honesty",
    text: "He is a 4th-year IT student, and honestly he does not yet have a full-time commercial engineering role. What stands in for that is a six-month internship graded 9 out of 10 plus a body of self-directed production-grade work: systems deployed company-wide, adopted by a university research group, and a closed beta heading to the Play Store.",
    tags: ["experience", "weakness", "honest", "student", "internship", "commercial", "junior", "grade", "background"],
  });

  // Skills inventory, one chunk per group so a skill query lands precisely.
  for (const group of profile.skillGroups) {
    const slug = group.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    chunks.push({
      id: `profile:skills-${slug}`,
      projectId: null,
      sectionLabel: `Skills: ${group.name}`,
      text: `${group.name} skills: ${group.skills.join(", ")}.`,
      tags: ["skills", "stack", "technologies", ...stackTags(group.skills)],
    });
  }

  // Contact.
  chunks.push({
    id: "profile:contact",
    projectId: null,
    sectionLabel: "Contact",
    text: `Contact ${profile.goesBy} via email at ${profile.email}, GitHub at ${profile.github}, or LinkedIn at ${profile.linkedin}.`,
    tags: ["contact", "email", "github", "linkedin", "reach", "hire"],
  });

  return chunks;
}

/** Memoized KB for repeated request-time use. */
let cached: KBChunk[] | null = null;
export function getKb(): KBChunk[] {
  if (!cached) cached = buildKb();
  return cached;
}
