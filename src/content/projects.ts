import type { Project } from "./types";

/**
 * The full project inventory. Facts sourced strictly from the master resume.
 * No fabricated metrics, dates, testimonials, or links. Visitor copy avoids
 * em dashes per Zack's standing preference.
 */
export const projects: Project[] = [
  {
    id: "omnipotence",
    name: "Omnipotence / CodeLens",
    tier: "deep",
    status: ["deployed", "adopted"],
    whatItIs:
      "A code-aware RAG engine: ask a plain-English question about a large codebase and get a concise, source-cited answer.",
    stack: [
      "Python 3.11",
      "Hexagonal architecture",
      "Tree-sitter",
      "SentenceTransformers",
      "OpenSearch",
      "Amazon Bedrock",
      "AWS CloudFormation",
      "Docker",
      "pytest",
    ],
    problem:
      "Engineers waste hours reading unfamiliar code to answer simple questions. Omnipotence ingests repositories, chunks them semantically, and answers questions through a multi-stage retrieval and ranking pipeline, always citing the source.",
    architecture:
      "Strict dependency inversion: pure business logic in the core, 14 abstract ports, and swappable adapters for OpenSearch, Bedrock or Ollama, Tree-sitter, and HuggingFace. Deployed to AWS entirely as infrastructure-as-code with CloudFormation: containerised services on ECS and ECR behind API Gateway and an ALB, Bedrock for inference, OpenSearch for hybrid search, S3 for vectors, and Lambda for ingestion.",
    hardestProblem:
      "Proving the architecture actually held. Automated architecture-boundary tests fail the build if business logic reaches for an adapter, and the same core runs Ollama locally and Bedrock in production without a single change to business logic.",
    tradeoffs:
      "Retrieval quality comes from pipeline design, not model size: syntax-aware chunking, LLM enrichment under strict anti-hallucination prompting, hybrid k-NN plus BM25 retrieval, relevance filtering, and cross-encoder reranking. More moving parts, but every stage is independently runnable for evaluation and debugging.",
    limitations:
      "Six languages supported at the chunking layer today. Answer quality depends on repository enrichment quality, and the deep pipeline trades some latency for grounding and citation accuracy.",
    metrics: [
      { value: "~7,200", label: "lines of Python" },
      { value: "14", label: "abstract ports" },
      { value: "28", label: "test modules" },
      { value: "6", label: "languages" },
    ],
    diagram: [
      { label: "query", caption: "embed the natural-language question" },
      { label: "route", caption: "select candidate repositories cheaply" },
      { label: "hybrid retrieve", caption: "k-NN vectors plus BM25 lexical" },
      { label: "LLM filter", caption: "drop irrelevant chunks" },
      { label: "rerank", caption: "cross-encoder reorders by relevance" },
      { label: "cited answer", caption: "grounded answer with sources" },
    ],
  },
  {
    id: "recomp-tracker",
    name: "Recomp Tracker",
    tier: "deep",
    status: ["beta"],
    whatItIs:
      "A ~65k-LOC Android app that unifies nutrition, training, and recovery into a closed feedback loop, with a cited AI coach that cannot fabricate a metric.",
    stack: [
      "Kotlin",
      "Jetpack Compose",
      "Material 3",
      "MVVM + Clean Architecture",
      "Coroutines / Flow",
      "Room",
      "WorkManager",
      "OpenAI-compatible LLM",
      "RAG",
      "TDD",
    ],
    problem:
      "A calorie counter only logs. Recomp Tracker reads the user's own trends in weight, waist, adherence, and recovery, then recommends concrete plan changes, while an AI coach answers questions and takes actions grounded strictly in real data.",
    architecture:
      "A strict dependency rule from UI to ViewModel to Repository to Room and DataStore, with a pure-Kotlin domain layer that carries zero Android dependencies, so core logic runs on the JVM in milliseconds and is trivially unit-testable. Offline-first persistence with Room across 15 migrations, 11 DataStore stores, and API secrets in AES-256-GCM encrypted storage.",
    hardestProblem:
      "Deterministic-first AI. Every number and verdict is computed by domain engines; the LLM only adds prose, so the model has no path to fabricate a metric. The plan-version ledger was the hardest piece: a plan change never re-judges days already logged under the old target, which naive implementations silently corrupt.",
    tradeoffs:
      "Keeping the model behind a deterministic boundary means more domain code and less LLM magic, but it buys a real trust and safety property rather than a prompt-engineering hope.",
    limitations:
      "Closed beta with 10 users, Play Store publication imminent. Retention numbers from testers are still being gathered.",
    metrics: [
      { value: "~65k", label: "lines of code" },
      { value: "~1,300", label: "unit tests" },
      { value: "19", label: "LLM tools" },
      { value: "18", label: "signal detectors" },
    ],
  },
  {
    id: "consented-cart",
    name: "Consented Cart",
    tier: "deep",
    status: ["personal"],
    whatItIs:
      "A Shopify embedded app that recovers abandoned carts under GDPR opt-in, enforcing the consent rule at the database schema, not by UI convention.",
    stack: [
      "React Router v7",
      "TypeScript",
      "Prisma ORM",
      "Shopify Admin API",
      "Shopify App Proxy",
      "Polaris / App Bridge",
      "Liquid",
      "Resend",
      "Vitest",
    ],
    problem:
      "The industry-standard move is to auto-enrol every visitor into marketing lists, which is legally risky under GDPR and CCPA. Consented Cart captures explicit, timestamped, versioned consent at the point of interaction and only then triggers email flows.",
    architecture:
      "16 relational Prisma entities across 12 sequential migrations, including a zero-downtime idempotent backfill. Every submission writes two separately revocable consent records, marketing unchecked by default, enforced at the schema level so future features cannot silently bypass it. OAuth and embedded auth, App Proxy public APIs, webhook-driven pipelines, and a Polaris admin dashboard.",
    hardestProblem:
      "A revenue-attribution engine that matches Shopify orders-paid webhooks back to the originating capture event within a configurable window, with idempotency-keyed email dispatch so retried webhook deliveries cannot double-send.",
    tradeoffs:
      "Enforcing opt-in at the schema and hashing PII at rest adds friction to every feature, but it makes a legally significant business rule impossible to violate by accident.",
    limitations:
      "Built on the Shopify App Store distribution model. Live status and merchant adoption are still to be confirmed.",
    metrics: [
      { value: "~12,300", label: "lines of TypeScript" },
      { value: "16", label: "Prisma entities" },
      { value: "12", label: "migrations" },
      { value: "94", label: "files" },
    ],
  },
  {
    id: "lex-ai",
    name: "Lex-AI",
    tier: "deep",
    status: ["academic"],
    whatItIs:
      "A RAG chatbot over 87 official EU AI-policy documents, built on a vector database written from scratch in NumPy.",
    stack: [
      "Python",
      "BAAI/bge-small-en-v1.5",
      "NumPy",
      "MMR reranking",
      "Ollama + Llama 3.2 3B",
      "Streamlit",
    ],
    problem:
      "Answer natural-language questions about EU AI policy grounded in a curated corpus, without confabulating when the answer is not in the documents.",
    architecture:
      "A full pipeline built end to end: resilient document acquisition at 97.7% success across 403s, redirect walls, and scanned PDFs, sentence-aware overlapping chunking, BGE asymmetric query and passage prefixing, and a vector database written from scratch in NumPy with exact cosine search and a from-scratch MMR reranker for source diversity.",
    hardestProblem:
      "An empirically tuned evidence threshold of 0.55 cosine that refuses to call the LLM at all when retrieval confidence is too low, so the system says it does not have the answer instead of confabulating. Validated at 0.63 to 0.86 for on-topic queries versus below 0.20 for out-of-scope ones.",
    tradeoffs:
      "Writing the vector store and reranker by hand instead of using FAISS or Chroma is more work, but it demonstrates the underlying maths rather than tool familiarity, and every design constant came from measurement.",
    limitations:
      "Runs on a local 3B open-weight model, which trades some fluency for full self-hosted control. Corpus is 87 documents, 1,060 chunks.",
    metrics: [
      { value: "87", label: "policy documents" },
      { value: "1,060", label: "retrieval chunks" },
      { value: "0.55", label: "evidence threshold" },
      { value: "97.7%", label: "acquisition success" },
    ],
    diagram: [
      { label: "query", caption: "embed with BGE query prefix" },
      { label: "cosine search", caption: "exact search over NumPy store" },
      { label: "MMR rerank", caption: "balance relevance and diversity" },
      { label: "evidence gate", caption: "refuse below 0.55 cosine" },
      { label: "cited answer", caption: "4-part answer with citations" },
    ],
  },
  {
    id: "tulipvision",
    name: "TulipVision",
    tier: "deep",
    status: ["deployed", "adopted"],
    whatItIs:
      "A tulip-sprout detection platform: a YOLOv11 model track plus the full FastAPI, Vue, and Azure deployment, adopted by a university research group.",
    stack: [
      "Python",
      "PyTorch",
      "Ultralytics YOLO",
      "FastAPI",
      "Vue 3 / TypeScript",
      "Redis",
      "Docker",
      "Azure Container Apps",
    ],
    problem:
      "Detect and count tulip sprouts in raw field imagery for precision agriculture. Upload a field photo, choose a detector, and get an annotated image, a sprout count, and per-detection confidence.",
    architecture:
      "A FastAPI backend with JWT auth and a pluggable model-adapter registry, so one abstract detector interface backs all four benchmarked models behind the same endpoints. A typed Vue 3 SPA with 8 views, Redis caching keyed on image hash plus threshold plus model digest, and a storage abstraction that switches between local disk and Azure Blob by environment.",
    hardestProblem:
      "An adaptive tiled-inference pipeline that splits oversized images into overlapping 640x640 tiles, runs batched inference, remaps tile-local boxes back to original coordinates, and applies a custom global NMS pass to remove duplicates along tile seams, improving small-object recall with no retraining.",
    tradeoffs:
      "A shared evaluation protocol across four architectures made results comparable and switchable in the app, at the cost of building common dataset, metrics, and visualisation utilities up front.",
    limitations:
      "My YOLOv11 track reached mAP@50 around 0.63; the best model in the study, Faster R-CNN, reached around 0.86. The platform surfaces this honestly so users can compare detectors.",
    metrics: [
      { value: "4", label: "models benchmarked" },
      { value: "0.86", label: "best mAP@50" },
      { value: "8", label: "frontend views" },
      { value: "8/10", label: "project grade" },
    ],
  },
  {
    id: "locked-in",
    name: "Locked IN",
    tier: "deep",
    status: ["personal"],
    whatItIs:
      "A native iOS commitment tracker that enforces commitments through a rules-based domain engine rather than simple habit logging.",
    stack: [
      "Swift",
      "SwiftUI",
      "Swift Concurrency",
      "@MainActor",
      "Combine",
      "XCTest",
    ],
    problem:
      "Habit apps just log. Locked IN enforces user commitments with a real domain engine: 28-day locks, rolling 14-day evaluation windows, ISO-week scheduling, violation detection, streaks, and a multi-state recovery mode.",
    architecture:
      "Four strict layers, a pure-Swift domain with zero framework imports, @MainActor state stores, MVVM feature modules, and protocol-based persistence with atomic-write JSON repos plus in-memory doubles, so previews and unit tests never touch disk.",
    hardestProblem:
      "A policy-engine gatekeeper that is the single authority for allowed actions and returns a user-facing reason for every denied mutation, which centralises the rules and makes invalid state unrepresentable.",
    tradeoffs:
      "Keeping all business logic in framework-free engines means more protocol plumbing, but it makes the hardest logic testable in milliseconds and buys an injectable app clock that makes time-dependent behaviour reproducible.",
    limitations:
      "A personal-scope project. Dates and any TestFlight distribution are still to be confirmed.",
    metrics: [
      { value: "4", label: "architecture layers" },
      { value: "28-day", label: "commitment locks" },
      { value: "14-day", label: "evaluation window" },
    ],
  },
  {
    id: "digital-banking",
    name: "Digital Banking Platform",
    tier: "card",
    status: ["academic"],
    whatItIs:
      "A full-stack Java and Vue bank simulation with real financial domain logic, where I was top committer on a 5-person Scrum team.",
    stack: [
      "Java 21",
      "Spring Boot 3",
      "Spring Security + JWT",
      "Vue 3",
      "JUnit 5",
      "Cucumber",
    ],
    metrics: [
      { value: "~80/215", label: "commits (top committer)" },
      { value: "9", label: "BDD scenarios" },
    ],
    links: [
      {
        label: "GitHub",
        href: "https://github.com/Sorint-original/Code-Generation",
      },
    ],
  },
  {
    id: "kukis",
    name: "Kukis",
    tier: "card",
    status: ["live"],
    whatItIs:
      "A live product marketing site with a custom brand system and a canvas 96-frame scroll-scrub hero animation.",
    stack: [
      "React 18",
      "TypeScript",
      "Tailwind CSS v4",
      "Vite 6",
      "Framer Motion",
      "Canvas API",
    ],
    metrics: [
      { value: "96", label: "animation frames" },
      { value: "live", label: "on GitHub Pages" },
    ],
    links: [
      { label: "Live site", href: "https://zackalatrash.github.io/kukis-site" },
    ],
  },
  {
    id: "haarlem-festival",
    name: "Haarlem Festival",
    tier: "card",
    status: ["academic"],
    whatItIs:
      "A full-stack festival platform I led, with a 50+ endpoint REST API on Azure SQL.",
    stack: ["PHP", "JavaScript", "MVC", "Azure SQL", "Docker", "Figma"],
    metrics: [{ value: "50+", label: "API endpoints" }],
  },
  {
    id: "study-planner",
    name: "Study Planner",
    tier: "card",
    status: ["academic"],
    whatItIs:
      "A study planner I led for scheduling, progress tracking, and deadlines, with AJAX-powered real-time updates.",
    stack: ["PHP", "JavaScript", "AJAX", "MVC", "SQL"],
    metrics: [
      { value: "30+", label: "API endpoints" },
      { value: "~50%", label: "faster DB ops" },
    ],
  },
  {
    id: "chapeau",
    name: "Chapeau Ordering System",
    tier: "card",
    status: ["academic"],
    whatItIs:
      "A full-stack restaurant ordering system with real-time order tracking and automated kitchen management.",
    stack: ["C#", "Azure SQL"],
  },
  {
    id: "cello",
    name: "Cello Restaurant App",
    tier: "card",
    status: ["personal"],
    whatItIs:
      "A cross-platform mobile ordering app with a loyalty and referral system, built freelance at around 15.",
    stack: ["JavaScript", "iOS", "Android"],
    metrics: [
      { value: "~35%", label: "retention increase" },
      { value: "~20%", label: "more new customers" },
    ],
  },
];

export const deepProjects = projects.filter((p) => p.tier === "deep");
export const cardProjects = projects.filter((p) => p.tier === "card");

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}
