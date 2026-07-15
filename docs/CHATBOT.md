# Portfolio — Grounded Chatbot (RAG) Spec

Last updated: 2026-07-15
Refines: DESIGN.md §4, §7 (the `ask` path)

The chatbot is the signature piece. It must behave like the RAG systems on the
resume: retrieve, gate on evidence, answer only from grounded context, cite
sources, and refuse cleanly when the question is outside the knowledge base. The
refusal is not a failure mode to hide; it is the demonstration.

---

## 1. Behavior contract

- Answers **only** from the curated knowledge base about Zack and his work.
- Every substantive answer includes **citations** to the exact project section
  it drew from. Citations are clickable and scroll/open that section.
- If retrieval confidence is below threshold, the system **refuses without
  calling the LLM**: "I don't have that in my knowledge base. I only answer
  questions grounded in Zack's work." This path must be visibly distinct in the
  UI (its own state, not styled as a normal answer).
- The model may never invent a metric, employer, date, or claim. Numbers come
  from the knowledge base text, not the model.
- Tone: concise, factual, first-person-about-Zack in the third person ("He
  built...", "His strongest..."). No hype words, no em dashes.

## 2. Knowledge base

Authored as versioned JSON in the repo (`src/content/kb/`), the single source of
truth shared by the project pages and the RAG endpoint.

Chunk record:
```jsonc
{
  "id": "omnipotence:pipeline",      // stable citation id
  "projectId": "omnipotence",
  "sectionLabel": "Six-stage query pipeline",
  "text": "…retrieval-ready prose derived strictly from the master resume…",
  "tags": ["rag", "retrieval", "aws", "architecture"],
  "embedding": [/* precomputed at build time */]
}
```

Content is derived strictly from the master resume (defensible, no fabrication).
Chunking follows the Lex-AI lesson: sentence-aware, no mid-sentence starts,
per-project cap so top-k is not five near-duplicate chunks from one project.

Coverage must include, at minimum: identity/positioning, each of the 12
projects, the skills inventory, education, experience, and a set of curated
"about the candidate" facts (availability, location, work permit, languages)
so common recruiter questions are answerable.

## 3. Retrieval

- Embeddings precomputed at build time (one model, stored in the KB JSON) so the
  serverless function does no heavy work beyond embedding the incoming query.
- Query embedding at request time; **asymmetric prefixing** if the embedding
  model requires it (the BGE lesson from Lex-AI: queries get the instruction
  prefix, passages do not).
- Score: cosine over L2-normalized vectors (dot product). Take top-k (start
  k=6), apply a per-project cap (max 2 chunks/project) for source diversity, in
  the spirit of Lex-AI's MMR/diversity handling. A full MMR reranker is a nice-
  to-have, not required for launch.

## 4. Evidence gate

- A tuned cosine threshold (start ~0.35–0.55, calibrate against real questions;
  the exact number is empirical, like Lex-AI's 0.55). Below threshold → refusal,
  no LLM call.
- Calibrate with a small benchmark: a set of on-topic questions (should answer)
  and clearly off-topic ones (should refuse), stored in the repo and runnable in
  CI so the threshold is justified by measurement, not a guess.

## 5. Generation

- Model: a cheap hosted model behind an adapter interface (swap without touching
  callers, mirroring Zack's model-adapter pattern). Candidates: a small
  GPT-class model or Claude Haiku. Configurable via env.
- Streaming (SSE) so answers appear token by token.
- System prompt enforces: answer only from provided chunks; cite section ids;
  say "not in my knowledge base" if the chunks don't support an answer; never
  speculate; no fabricated numbers; concise; no em dashes.
- The endpoint returns `{ answer, citations: [{projectId, sectionId, label}],
  confidence }`.

## 6. Serverless endpoint `/api/ask`

- Holds the LLM API key server-side (never shipped to the client).
- **Rate limiting**: fixed-window per IP (e.g. 10 questions / 10 min) to cap
  cost and abuse. Over limit → 429 with a friendly message.
- **Spend cap**: a hard monthly budget; if exceeded, the endpoint degrades to a
  retrieval-only answer (returns the top cited chunks with a short templated
  lead-in) instead of failing. This keeps the site useful with zero risk of a
  surprise bill.
- Input hygiene: length cap on the question, reject obviously abusive payloads,
  strip prompt-injection attempts (the KB is the only trusted content; user
  input is data, never instructions).
- No logging of PII; if conversations are logged for improvement, log anonymized
  question text only, and say so.

## 7. Client (`AskClient` + `ChatPanel`)

- Typed request/stream parsing, single retry on transient failure, timeout.
- UI states, each explicitly designed: streaming, complete-with-citations,
  refusal, error, rate-limited, degraded (retrieval-only).
- Citation chips deep-link to the cited project section.
- Suggested starter questions to reduce blank-input friction.

## 8. Safety & honesty

- The chatbot must not claim anything not in the KB. If asked to speculate
  ("Would he be good at X?"), it grounds in evidence or declines.
- No impersonation beyond answering factually about Zack's public professional
  record.
- The refusal behavior is a feature and should be gently surfaced in the UI copy
  so a knowledgeable visitor recognizes what it is demonstrating.

## 9. Test plan (chatbot-specific)

- Unit: retrieval ranking, per-project cap, evidence-gate threshold boundary,
  refusal path returns no LLM call, citation extraction.
- Benchmark (CI): on-topic questions produce grounded answers with citations;
  off-topic questions refuse. Threshold change that breaks the benchmark fails
  CI.
- Endpoint: rate-limit returns 429; spend-cap degradation returns retrieval-only
  shape; malformed input rejected.
- E2E smoke: ask grounded → citation chip appears and links; ask off-topic →
  refusal state shown.
