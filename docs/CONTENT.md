# Portfolio — Content Model & Copy

Last updated: 2026-07-15
Refines: DESIGN.md §8, §9
Source of truth for facts: the master resume (Ziad_Alatrash_MASTER_RESUME.docx).

Rules for all visitor-facing copy:
- Every claim traces to the master resume. No fabricated metrics, testimonials,
  logos, or dates. Where the resume marks a value as an estimate (`~`), keep it
  honest or omit.
- No em dashes (Zack's standing preference). Use commas, colons, or new
  sentences.
- Sentence case. Concise. Verb-first where natural.
- Placeholders below marked `[CONFIRM]` need a value from Zack before launch.

---

## 1. Identity (Home / `whoami`)

- Name: Ziad "Zack" Alatrash
- Positioning line: "AI/LLM systems engineer, not an API caller. I build grounded
  RAG systems and ship them to production."
- Location: Haarlem, Netherlands. Status: valid Dutch residence and work permit.
- Languages: Arabic (native), English (C1), Dutch (B1, improving).
- Seeking: part-time junior software developer role, summer 2026 onward.
- Education: BSc Information Technology, Hogeschool Inholland, 4th year, expected
  2027. Propedeuse obtained. Minor: Data & AI (completed).
- Cert highlight: AWS Certified AI Practitioner.
- Links: GitHub github.com/ZackAlatrash, LinkedIn (from resume), email.

Key metrics readout (from the metrics bank, all resume-sourced):
- 3 independent RAG systems
- Omnipotence deployed company-wide (~7.2k LOC, 14 ports, 28 test modules)
- Recomp Tracker ~65k LOC, ~1,300 tests, closed beta
- Internship graded 9/10; TulipVision 8/10, university-adopted
- AWS-deployed (CloudFormation IaC)

## 2. Positioning pillars (used on Home and by the chatbot)

1. Grounded AI / anti-hallucination — three RAG systems, all about evidence
   gating, citation enforcement, deterministic boundaries.
2. Architecture as the differentiator — hexagonal, clean architecture, pure
   domain layers, boundary tests that fail the build.
3. Ships to production end to end — deployed, adopted, live, with CI/CD.

## 3. Projects — display tier and one-liners

Deep case studies (tier 1):

| id | name | status | one-liner |
|----|------|--------|-----------|
| `omnipotence` | Omnipotence / CodeLens | deployed, adopted | Code-aware RAG engine: ask a plain-English question about a large codebase, get a source-cited answer. |
| `recomp-tracker` | Recomp Tracker | beta | ~65k-LOC Android app with a deterministic weekly adjustment engine and a cited AI coach that cannot fabricate a metric. |
| `consented-cart` | Consented Cart | [CONFIRM status] | Shopify app that recovers abandoned carts under GDPR opt-in, enforcing the consent rule at the database schema, not by UI convention. |
| `lex-ai` | Lex-AI | academic | RAG chatbot over 87 EU AI-policy documents with a vector database written from scratch in NumPy. |
| `tulipvision` | TulipVision | deployed, adopted | Tulip-sprout detection platform: YOLOv11 track plus the full FastAPI + Vue + Azure deployment. |
| `locked-in` | Locked IN | personal | Native iOS commitment tracker with a 4-layer architecture and a rules-based policy engine. |

Concise cards (tier 2):

| id | name | one-liner |
|----|------|-----------|
| `digital-banking` | Digital Banking Platform | Full-stack Java/Spring + Vue bank simulation; top committer on a 5-person Scrum team. |
| `kukis` | Kukis | Live product marketing site with a canvas 96-frame scroll-scrub hero. |
| `haarlem-festival` | Haarlem Festival | Project-led PHP MVC platform, 50+ endpoint REST API on Azure SQL. |
| `study-planner` | Study Planner | PHP/AJAX planner, 30+ endpoints, ~50% faster DB operations. |
| `chapeau` | Chapeau Ordering System | C# restaurant ordering system with real-time tracking. |
| `cello` | Cello Restaurant App | Cross-platform mobile ordering app built freelance at ~15. |

Per-project deep-dive content (problem, architecture, hardest problem,
trade-offs, metrics, limitations, links) is drawn section by section from
resume §3.1–3.13. The knowledge-base chunks in CHATBOT.md §2 mirror these
sections so the page and the chatbot never disagree.

## 4. Deep case study — required fields per project

For each tier-1 project, author these before build (all resume-sourced):
- `whatItIs` (1 line) + `status` badge
- `problem` (2–4 sentences)
- `architecture` (diagram + 2–4 sentences)
- `hardestProblem` (the single most interesting decision; e.g. Recomp's plan-
  version ledger, Omnipotence's swappable-core proof, Lex-AI's evidence
  threshold, TulipVision's tiled inference + global NMS)
- `tradeoffs` (what was chosen and given up)
- `metrics` (from the metrics bank)
- `limitations` (honest boundaries)
- `stack` (chips)
- `links` (repo/live/case-study where they exist; otherwise omit, do not fake)

## 5. Skills (`skills`)

Grouped exactly as in resume §6, condensed:
- AI/ML/LLM: RAG (x3), vector search, hybrid retrieval (kNN+BM25), cross-encoder
  reranking, MMR, evidence gating, anti-hallucination prompting, tool calling,
  SSE streaming, self-hosted inference, Bedrock, Tree-sitter, PyTorch, YOLO.
- Architecture: hexagonal, clean architecture, MVVM, DDD, state machines, policy
  engines, boundary tests, dependency inversion.
- Cloud/DevOps: AWS (CloudFormation, ECS/ECR, Lambda, API Gateway, ALB,
  OpenSearch, S3, Bedrock), Azure (Container Apps, SQL, Blob), Docker, GitHub
  Actions CI/CD.
- Backend: FastAPI, Spring Boot, React Router v7, REST design, OAuth/webhooks,
  Prisma, Redis, JWT/BCrypt, AES-256-GCM.
- Frontend/mobile: Android (Kotlin, Compose), iOS (Swift, SwiftUI), React, Vue 3,
  Vite, Tailwind, design systems, accessibility.
- Testing: TDD, unit/integration/contract/E2E, BDD (Cucumber), pytest, JUnit,
  Vitest, XCTest.

## 6. Resume (`resume`)

- Inline readable summary + a download button for the tailored PDF.
- The site does not expose personal contact numbers or date of birth. Email and
  professional links only. [CONFIRM which email to show publicly.]

## 7. Contact (`contact`)

- Email [CONFIRM public address], GitHub, LinkedIn.
- No form required. If a form is wanted, reuse Kukis's backend-less static-form
  pattern (provider-agnostic POST with mailto fallback).

## 8. Facts the chatbot should answer (curated `about` chunks)

- Availability and role sought; location and relocation/work-permit status.
- "Strongest project" → Omnipotence (deployed, adopted) with the reasoning.
- "Does he know AWS / RAG / architecture / testing?" → grounded yes with
  specific evidence.
- "Is he a student?" → yes, 4th-year, but the work is production-grade; frame
  honestly.
- Weakness handled honestly: no full-time commercial engineering role yet; the
  6-month internship (graded 9) plus self-directed production work is the
  substitute.

## 9. Placeholders to confirm before launch

- Public email address to display.
- Consented Cart status/dates; Lex-AI, Locked IN, Kukis dates.
- Which repos are public and linkable.
- Custom domain choice.
- Final resume PDF to host.
