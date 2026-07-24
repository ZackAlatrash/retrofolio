/**
 * The skills constellation: curated from the master resume for the portfolio
 * (the exhaustive keyword inventory stays on the resume). Every skill carries
 * its evidence: the shipped projects that prove it. Levels are derived from
 * evidence counts, never self-assessed. Entries with a `projectId` deep-link
 * to that cartridge's detail; entries without one name work that has no
 * cartridge (yet) and render as plain proof.
 */

export interface SkillEvidence {
  /** Matches a ShowcaseEntry id when the proving project has a cartridge. */
  projectId?: string;
  name: string;
}

export interface Skill {
  id: string;
  name: string;
  /** One line of what this actually means in practice. */
  blurb: string;
  evidence: SkillEvidence[];
}

export interface SkillBranch {
  id: string;
  name: string;
  color: string;
  skills: Skill[];
}

const P = {
  omni: { projectId: "omnipotence", name: "Omnipotence" },
  recomp: { projectId: "recomp-tracker", name: "Recomp Tracker" },
  cart: { projectId: "consented-cart", name: "Consented Cart" },
  lex: { projectId: "lex-ai", name: "Lex-AI" },
  tulip: { projectId: "tulipvision", name: "TulipVision" },
  locked: { projectId: "locked-in", name: "Locked IN" },
  kukis: { projectId: "kukis", name: "Kukis" },
  banking: { name: "Digital Banking Platform" },
  festival: { name: "Haarlem Festival" },
  site: { name: "This portfolio" },
};

export const skillBranches: SkillBranch[] = [
  {
    id: "ai",
    name: "AI · RAG SYSTEMS",
    color: "#8fb6ff",
    skills: [
      {
        id: "rag",
        name: "RAG systems",
        blurb: "Three independent production builds, all grounded and cited.",
        evidence: [P.omni, P.lex, P.recomp],
      },
      {
        id: "retrieval",
        name: "Hybrid retrieval",
        blurb: "k-NN vector + BM25 lexical search over OpenSearch.",
        evidence: [P.omni],
      },
      {
        id: "rerank",
        name: "Reranking · CE + MMR",
        blurb: "Cross-encoder reranking; MMR written from scratch.",
        evidence: [P.omni, P.lex],
      },
      {
        id: "gating",
        name: "Evidence gating",
        blurb: "Refuse before fabricating: tuned confidence thresholds.",
        evidence: [P.omni, P.lex, P.site],
      },
      {
        id: "tooling",
        name: "LLM tool calling + SSE",
        blurb: "19 function tools behind confirmations, token streaming.",
        evidence: [P.recomp],
      },
      {
        id: "inference",
        name: "Ollama + Bedrock",
        blurb: "Self-hosted and managed inference behind one swappable port.",
        evidence: [P.omni, P.lex],
      },
      {
        id: "vision",
        name: "Vision · YOLO + PyTorch",
        blurb: "Trained detectors; tiled inference with global NMS.",
        evidence: [P.tulip],
      },
      {
        id: "vectordb",
        name: "NumPy vector DB",
        blurb: "Exact cosine search built from first principles.",
        evidence: [P.lex],
      },
    ],
  },
  {
    id: "arch",
    name: "ARCHITECTURE",
    color: "#e0af68",
    skills: [
      {
        id: "hexagonal",
        name: "Hexagonal · ports & adapters",
        blurb: "14 ports, swappable adapters, pure core.",
        evidence: [P.omni],
      },
      {
        id: "clean",
        name: "Clean architecture",
        blurb: "Pure domain layers with zero framework imports.",
        evidence: [P.recomp, P.locked],
      },
      {
        id: "statemachines",
        name: "State machines",
        blurb: "Lifecycle engines: locks, windows, recovery modes.",
        evidence: [P.locked, P.recomp],
      },
      {
        id: "policy",
        name: "Policy engines",
        blurb: "One gatekeeper authority; invalid states unrepresentable.",
        evidence: [P.locked, P.cart],
      },
      {
        id: "ddd",
        name: "Domain-driven design",
        blurb: "Rules enforced in the schema, not by UI convention.",
        evidence: [P.cart, P.recomp],
      },
      {
        id: "boundaries",
        name: "Boundary tests",
        blurb: "Architecture rules that fail the build when broken.",
        evidence: [P.omni],
      },
    ],
  },
  {
    id: "testing",
    name: "TESTING",
    color: "#9ece6a",
    skills: [
      {
        id: "tdd",
        name: "TDD",
        blurb: "~1,300 test-first unit tests on one app alone.",
        evidence: [P.recomp],
      },
      {
        id: "pyramid",
        name: "Unit -> E2E pyramid",
        blurb: "Unit, integration, contract and end-to-end layers.",
        evidence: [P.omni, P.recomp, P.cart, P.kukis],
      },
      {
        id: "bdd",
        name: "BDD · Cucumber",
        blurb: "Business-readable acceptance scenarios.",
        evidence: [P.banking],
      },
      {
        id: "frameworks",
        name: "pytest · JUnit · Vitest · XCTest",
        blurb: "Native test stacks across four ecosystems.",
        evidence: [P.omni, P.recomp, P.cart, P.locked, P.kukis],
      },
    ],
  },
  {
    id: "cloud",
    name: "CLOUD & DEVOPS",
    color: "#7aa2f7",
    skills: [
      {
        id: "aws",
        name: "AWS · IaC",
        blurb: "CloudFormation, ECS/ECR, Lambda, API GW, OpenSearch, S3, Bedrock.",
        evidence: [P.omni],
      },
      {
        id: "azure",
        name: "Azure",
        blurb: "Container Apps, Azure SQL, Blob Storage.",
        evidence: [P.tulip, P.festival],
      },
      {
        id: "docker",
        name: "Docker",
        blurb: "Multi-stage builds, Compose stacks, Nginx.",
        evidence: [P.omni, P.tulip, P.banking],
      },
      {
        id: "cicd",
        name: "CI/CD · GitHub Actions",
        blurb: "Build-test-deploy gates on every push.",
        evidence: [P.recomp, P.kukis, P.site],
      },
    ],
  },
  {
    id: "backend",
    name: "BACKEND & DATA",
    color: "#f7768e",
    skills: [
      {
        id: "fastapi",
        name: "FastAPI",
        blurb: "JWT-auth REST APIs with pluggable model adapters.",
        evidence: [P.tulip],
      },
      {
        id: "spring",
        name: "Spring Boot 3",
        blurb: "Security + JWT, JPA, method-level authorization.",
        evidence: [P.banking],
      },
      {
        id: "rrv7",
        name: "React Router v7",
        blurb: "Framework-mode full-stack app on Shopify.",
        evidence: [P.cart],
      },
      {
        id: "integrations",
        name: "OAuth · webhooks · REST",
        blurb: "Embedded auth, idempotent webhook pipelines, rate limits.",
        evidence: [P.cart, P.tulip, P.banking],
      },
      {
        id: "orm",
        name: "Prisma + Room",
        blurb: "16-entity schema; 15-version migration history.",
        evidence: [P.cart, P.recomp],
      },
      {
        id: "migrations",
        name: "Zero-downtime migrations",
        blurb: "Idempotent backfills that bridge legacy data live.",
        evidence: [P.cart],
      },
      {
        id: "crypto",
        name: "Crypto & PII care",
        blurb: "AES-256-GCM, BCrypt, hashing PII at rest.",
        evidence: [P.recomp, P.cart, P.banking],
      },
    ],
  },
  {
    id: "frontend",
    name: "FRONTEND & MOBILE",
    color: "#bb9af7",
    skills: [
      {
        id: "android",
        name: "Android · Kotlin + Compose",
        blurb: "65k-LOC offline-first app, Material 3, WorkManager.",
        evidence: [P.recomp],
      },
      {
        id: "ios",
        name: "iOS · Swift + SwiftUI",
        blurb: "Swift concurrency, protocol-first persistence.",
        evidence: [P.locked],
      },
      {
        id: "react",
        name: "React 18 + TypeScript",
        blurb: "Strict TS, canvas scroll experiences, this site.",
        evidence: [P.kukis, P.cart, P.site],
      },
      {
        id: "vue",
        name: "Vue 3",
        blurb: "Typed Composition API SPA with Pinia.",
        evidence: [P.tulip],
      },
      {
        id: "designsystems",
        name: "Design systems",
        blurb: "Token systems and component libraries from scratch.",
        evidence: [P.recomp, P.kukis, P.locked],
      },
      {
        id: "a11y",
        name: "Accessibility",
        blurb: "Reduced motion, focus management, VoiceOver, Dynamic Type.",
        evidence: [P.kukis, P.locked, P.site],
      },
    ],
  },
];

/** The languages loadout row (shipped work only). */
export const languages = [
  "Python",
  "Kotlin",
  "Swift",
  "TypeScript",
  "Java",
  "C#",
  "JavaScript",
  "SQL",
  "PHP",
];

/** Evidence-derived level, capped at 5 pips. */
export const skillLevel = (s: Skill) => Math.min(5, s.evidence.length);
