import type { Profile } from "./types";

/** Identity and cross-cutting facts. Sourced from the master resume. */
export const profile: Profile = {
  name: "Ziad Alatrash",
  goesBy: "Zack",
  positioning:
    "AI/LLM systems engineer, not an API caller. I build grounded RAG systems and ship them to production.",
  location: "Haarlem, Netherlands",
  status: "Valid Dutch residence and work permit",
  languages: ["Arabic (native)", "English (C1)", "Dutch (B1, improving)"],
  seeking: "Part-time junior software developer role, summer 2026 onward",
  education:
    "BSc Information Technology, Hogeschool Inholland, 4th year, expected 2027. Propedeuse obtained. Minor: Data & AI.",
  certHighlight: "AWS Certified AI Practitioner",
  github: "https://github.com/ZackAlatrash",
  linkedin: "https://linkedin.com/in/ziad-alatrash-4295b733",
  email: "ziad.atrash@gmail.com",
  headlineMetrics: [
    { value: "3", label: "RAG systems" },
    { value: "~65k", label: "LOC shipped" },
    { value: "~1,300", label: "tests written" },
    { value: "9/10", label: "internship grade" },
  ],
  pillars: [
    {
      title: "Grounded AI, not hype",
      body: "Three independent RAG systems, all built around evidence gating, citation enforcement, and deterministic boundaries so the model cannot fabricate.",
    },
    {
      title: "Architecture is the differentiator",
      body: "Hexagonal ports-and-adapters, clean architecture, pure domain layers, and boundary tests that fail the build.",
    },
    {
      title: "Ships to production",
      body: "Deployed company-wide, adopted by a university research group, a closed beta heading to the Play Store, and live sites with CI/CD.",
    },
  ],
  skillGroups: [
    {
      name: "AI / ML / LLM",
      skills: [
        "RAG (three implementations)",
        "vector search & embeddings",
        "hybrid retrieval (k-NN + BM25)",
        "cross-encoder reranking",
        "MMR",
        "evidence gating",
        "anti-hallucination prompting",
        "LLM tool calling",
        "SSE streaming",
        "self-hosted inference (Ollama)",
        "Amazon Bedrock",
        "Tree-sitter",
        "PyTorch",
        "Ultralytics YOLO",
      ],
    },
    {
      name: "Architecture & practices",
      skills: [
        "hexagonal / ports-and-adapters",
        "clean architecture",
        "MVVM",
        "domain-driven design",
        "state machines",
        "policy engines",
        "boundary tests",
        "TDD",
        "BDD (Cucumber)",
      ],
    },
    {
      name: "Cloud & DevOps",
      skills: [
        "AWS (CloudFormation, ECS/ECR, Lambda, API Gateway, OpenSearch, S3, Bedrock)",
        "Azure (Container Apps, SQL, Blob)",
        "Docker",
        "GitHub Actions CI/CD",
      ],
    },
    {
      name: "Backend",
      skills: [
        "FastAPI",
        "Spring Boot 3",
        "React Router v7",
        "REST design",
        "OAuth / webhooks",
        "Prisma",
        "Redis",
        "JWT / BCrypt",
        "AES-256-GCM",
      ],
    },
    {
      name: "Frontend & mobile",
      skills: [
        "Android (Kotlin, Compose)",
        "iOS (Swift, SwiftUI)",
        "React 18",
        "Vue 3",
        "Vite",
        "Tailwind CSS",
        "design systems",
        "accessibility",
      ],
    },
    {
      name: "Testing",
      skills: [
        "TDD",
        "unit / integration / contract / E2E",
        "pytest",
        "JUnit 5",
        "Vitest",
        "XCTest",
        "Playwright",
      ],
    },
  ],
};
