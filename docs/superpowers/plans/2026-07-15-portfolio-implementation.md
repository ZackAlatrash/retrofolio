# Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the recruiter-first, CLI-themed portfolio: a modern animated scroll site that boots from a terminal, with a `⌘K` command palette and a grounded RAG chatbot, exactly matching the specs in `docs/`.

**Architecture:** React 18 + TypeScript + Vite + Tailwind v4 SPA. A shared foundation (design tokens, theme engine, content model, typed data) is built first. Three parallel workstreams then build on non-overlapping directories: the scroll narrative + motion (`src/sections`, `src/motion`), the terminal layer (`src/terminal`), and the chatbot + serverless RAG (`src/chat`, `api/`, `scripts/`). Deployed on Vercel with one rate-limited serverless function.

**Tech Stack:** React 18, TypeScript (strict), Vite 6, Tailwind CSS v4, GSAP + ScrollTrigger, Lenis, Framer Motion, Vitest, Testing Library, Playwright, Vercel Functions, Anthropic Claude Haiku (chatbot), transformers.js (build-time embeddings).

---

## Source-of-truth specs

All work must match these exactly (and improve where it can without contradicting them):
- `docs/DESIGN.md` — architecture, components, data flow, testing.
- `docs/DESIGN-SYSTEM.md` — themes, tokens, terminal visual system.
- `docs/MOTION-VISUALS.md` — scroll narrative, motion, per-project visuals, model D.
- `docs/COMMANDS.md` — command palette + command reference.
- `docs/CHATBOT.md` — RAG knowledge base, retrieval, evidence gate, endpoint, safety.
- `docs/CONTENT.md` — copy and the project inventory (facts from the master resume only; no fabrication; no em dashes in visitor copy).

## File structure (locked decomposition)

```
portfolio/
  index.html
  package.json  vite.config.ts  tsconfig.json  tailwind.config.ts  vercel.json
  .github/workflows/ci.yml
  src/
    main.tsx  App.tsx  index.css
    theme/            themes.ts  ThemeProvider.tsx  useTheme.ts
    content/
      types.ts        # Project, Metric, KBChunk, SkillGroup types
      projects.ts     # all 12 projects (deep + card), resume-sourced
      profile.ts      # identity, metrics, skills, contact
      kb/             # generated knowledge base (index.json + embeddings)
    components/       # shared: DeviceFrame, CodeBlock, StatCounter, Badge, Section, Diagram
    sections/         # Hero, ProofStrip, PipelineScene, SelectedWork, ProjectScene, MoreWork, Skills, ChatSection, Contact
    motion/           # gsap.ts (register), useScrollReveal.ts, useReducedMotion.ts, pipelineTimeline.ts
    terminal/         # commandTypes.ts, registry.ts, CommandBus.ts, CommandPalette.tsx, Boot.tsx, output renderers
    chat/             # AskClient.ts, ChatPanel.tsx, chatTypes.ts
  api/
    ask.ts            # Vercel serverless RAG endpoint
    _lib/             retrieve.ts  gate.ts  llm.ts  ratelimit.ts  prompt.ts
  scripts/
    build-kb.ts       # chunk content -> embeddings -> src/content/kb/index.json
  tests/
    e2e/              smoke.spec.ts (Playwright)
```

**Ownership for parallel agents (no shared-file edits after foundation):**
- Foundation (Phase 0): shared, built first, single agent.
- Frontend/design agent: `src/sections`, `src/motion`, `src/components`.
- Terminal agent: `src/terminal`.
- Backend agent: `api/`, `src/chat`, `scripts/build-kb.ts`, `src/content/kb`.
Integration + CI + deploy (Phase 4): single agent.

## Testing note (honest, matches DESIGN.md §11)

Logic gets TDD with real assertions: theme engine, command bus/registry, retrieval ranking, evidence gate, ask client, content validation, form/validation helpers. Visual/motion components get a build + Testing Library render assertions + a Playwright smoke pass + a manual reduced-motion check. We do not write brittle pixel tests for animations; we assert structure, reduced-motion fallbacks, and that content renders without JS where the spec promises progressive enhancement.

---

## Phase 0 — Foundation (single agent, built first)

### Task 0.1: Scaffold the app

**Files:** Create `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`.

- [ ] **Step 1:** Scaffold with Vite React-TS, add deps.

```bash
cd /Users/zackalatrash/portfolio
npm create vite@latest . -- --template react-ts   # keep existing docs/, README, .git
npm i
npm i gsap lenis framer-motion
npm i -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test tsx
```

- [ ] **Step 2:** Configure Tailwind v4 via the Vite plugin in `vite.config.ts`; add `@import "tailwindcss";` to `src/index.css`. Configure Vitest (jsdom env, setup file importing `@testing-library/jest-dom`).
- [ ] **Step 3:** Verify: `npm run build` succeeds and `npm run dev` serves. Add a `test` script (`vitest`) and `test:e2e` (`playwright test`).
- [ ] **Step 4:** Commit `chore: scaffold vite react-ts + tailwind + test tooling`.

### Task 0.2: Content types + data (resume-sourced)

**Files:** Create `src/content/types.ts`, `src/content/projects.ts`, `src/content/profile.ts`, `tests/content.test.ts`.

- [ ] **Step 1 (TDD):** Write `tests/content.test.ts` asserting: 12 projects, exactly 6 with `tier: 'deep'`, every project has non-empty `id`, `name`, `whatItIs`, `stack`; deep projects also have `problem`, `architecture`, `hardestProblem`, `tradeoffs`, `metrics`, `limitations`; all copy strings contain no em dash (`—`).
- [ ] **Step 2:** Run, verify it fails (no data yet).
- [ ] **Step 3:** Define `types.ts` (`Project`, `ProjectTier`, `Metric`, `SkillGroup`, `KBChunk`, `Profile`) and populate `projects.ts` + `profile.ts` strictly from `docs/CONTENT.md` and the master resume. Keep the `[CONFIRM]` items as clearly-marked optional fields, not fabricated values.
- [ ] **Step 4:** Run tests, verify pass. Commit `feat(content): typed project + profile inventory from resume`.

### Task 0.3: Theme engine (TDD)

**Files:** Create `src/theme/themes.ts`, `src/theme/ThemeProvider.tsx`, `src/theme/useTheme.ts`, `tests/theme.test.ts`.

- [ ] **Step 1 (TDD):** Test that `themes` contains the 6 named palettes from DESIGN-SYSTEM.md §4, each defining all 9 tokens; `applyTheme(name)` sets the matching CSS custom properties on a target element; `ThemeProvider` defaults to `tokyo-night` and reads/writes `localStorage['zk.theme']`.
- [ ] **Step 2:** Run, verify fail.
- [ ] **Step 3:** Implement `themes.ts` (token values from DESIGN-SYSTEM.md §4), `ThemeProvider` (context, persistence, applies vars to `:root`), `useTheme` (`{theme, setTheme, themes}`).
- [ ] **Step 4:** Run, verify pass. Commit `feat(theme): switchable persisted terminal themes`.

### Task 0.4: Shared primitives + reduced-motion hook

**Files:** Create `src/components/{Section,Badge,StatCounter,DeviceFrame,CodeBlock,Diagram}.tsx`, `src/motion/useReducedMotion.ts`, `tests/components.test.tsx`.

- [ ] **Step 1 (TDD):** Test `useReducedMotion` returns true when `matchMedia('(prefers-reduced-motion: reduce)')` matches; `StatCounter` renders its final value immediately when reduced motion is on; `Badge` renders status text; `DeviceFrame` renders children inside a frame with an `aria-label`.
- [ ] **Step 2:** Run, verify fail.
- [ ] **Step 3:** Implement the primitives (presentational, token-driven, accessible). `StatCounter` count-up eased on in-view via IntersectionObserver, static under reduced motion.
- [ ] **Step 4:** Run, verify pass. Commit `feat(ui): shared primitives + reduced-motion hook`.

**Phase 0 gate:** `npm run build` + `npm test` green. Foundation frozen; parallel phases may start.

---

## Phase 1 — Scroll narrative + motion (frontend/design agent)

Owns `src/sections`, `src/motion`, extends `src/components`. Uses the frontend-design skill. Must match MOTION-VISUALS.md §3-§8.

### Task 1.1: Motion utilities
**Files:** `src/motion/gsap.ts` (register ScrollTrigger once), `src/motion/useScrollReveal.ts`, `tests/motion.test.tsx`.
- [ ] Register GSAP + ScrollTrigger centrally. `useScrollReveal` applies a reveal-on-enter, and is a no-op returning final state under reduced motion (assert this in a test). Commit.

### Task 1.2: Hero + ProofStrip
**Files:** `src/sections/Hero.tsx`, `src/sections/ProofStrip.tsx`.
- [ ] Hero: typewriter `$ whoami`, name, positioning line, docked `ask` affordance + `⌘K` hint, restrained animated background (MOTION-VISUALS.md §7), reduced-motion static. ProofStrip: `StatCounter`s for the metrics in CONTENT.md §1. Testing Library asserts text + reduced-motion static render. Commit.

### Task 1.3: Signature PipelineScene (the centerpiece)
**Files:** `src/sections/PipelineScene.tsx`, `src/motion/pipelineTimeline.ts`.
- [ ] Pinned, scrubbed GSAP timeline assembling the 6 Omnipotence stages with captions and a flowing token, final stage in success color with a sample citation (MOTION-VISUALS.md §5). Reduced motion shows the full diagram statically with all captions (assert in test). Commit.

### Task 1.4: SelectedWork + ProjectScene (deep 6)
**Files:** `src/sections/SelectedWork.tsx`, `src/sections/ProjectScene.tsx`.
- [ ] Render each deep project as a scene using the per-project visual from MOTION-VISUALS.md §6 (DeviceFrame / Diagram / CodeBlock / annotated image), scroll reveals, per-project metric counters, status Badge, honest limitations. Data from `projects.ts`. Commit.

### Task 1.5: MoreWork + Skills + Contact
**Files:** `src/sections/MoreWork.tsx`, `src/sections/Skills.tsx`, `src/sections/Contact.tsx`.
- [ ] MoreWork: the 6 card-tier projects in a bento grid with hover motion. Skills: grouped inventory (CONTENT.md §5). Contact: email/GitHub/LinkedIn + resume download, no fabricated links. Commit.

### Task 1.6: Assemble the scroll page
**Files:** `src/App.tsx` (compose sections in order), `src/index.css`.
- [ ] Compose all sections in the MOTION-VISUALS.md §3 order under `ThemeProvider`. Lenis smooth scroll with native fallback. Verify against the approved mockup; the real thing must equal or exceed it. Commit.

---

## Phase 2 — Terminal layer (terminal agent)

Owns `src/terminal`. Must match COMMANDS.md + DESIGN.md §6 + MOTION-VISUALS.md §2.

### Task 2.1: Command bus + registry (TDD)
**Files:** `src/terminal/commandTypes.ts`, `src/terminal/registry.ts`, `src/terminal/CommandBus.ts`, `tests/command-bus.test.ts`.
- [ ] Tests: parses `cat omnipotence` and quoted `ask "does he know AWS?"`; resolves aliases (`codelens`->`omnipotence`); unknown command returns a nearest-match suggestion, never throws; every registry command has help text. Implement to green. Commit.

### Task 2.2: Command palette (⌘K)
**Files:** `src/terminal/CommandPalette.tsx`, output renderers.
- [ ] `Cmd/Ctrl-K` and backtick open a real overlay; commands scroll-animate to sections or open chat; empty state lists grouped commands + suggested `ask` questions; full keyboard nav, focus trap, `aria` roles. Testing Library asserts open/close, command run, focus management. Commit.

### Task 2.3: Boot sequence
**Files:** `src/terminal/Boot.tsx`.
- [ ] Skippable cinematic boot -> renders scroll site; auto-skips on return (localStorage flag) and under reduced motion (assert both). Persistent `[skip]`. Commit.

---

## Phase 3 — Chatbot + serverless RAG (backend agent)

Owns `api/`, `src/chat`, `scripts/build-kb.ts`, `src/content/kb`. Must match CHATBOT.md.

### Task 3.1: Knowledge base builder
**Files:** `scripts/build-kb.ts`, `src/content/kb/index.json` (generated), `tests/kb.test.ts`.
- [ ] Chunk `projects.ts` + `profile.ts` into `KBChunk`s (sentence-aware, per-project cap-friendly, stable `id`s like `omnipotence:pipeline`), embed at build time with transformers.js (`all-MiniLM-L6-v2`), L2-normalize, write `index.json`. Test: every chunk has an id, projectId, sectionLabel, non-empty text, and a vector of the expected dimension. `npm run build:kb` script. Commit.

### Task 3.2: Retrieval + evidence gate (TDD, pure functions)
**Files:** `api/_lib/retrieve.ts`, `api/_lib/gate.ts`, `tests/retrieve.test.ts`.
- [ ] Tests: cosine ranking returns top-k with a per-project cap (max 2/project); `gate(score, threshold)` returns refuse below threshold; a curated benchmark (on-topic questions retrieve their expected project; off-topic questions fall below threshold). Implement pure functions to green. Commit.

### Task 3.3: LLM adapter + prompt
**Files:** `api/_lib/llm.ts`, `api/_lib/prompt.ts`, `tests/prompt.test.ts`.
- [ ] Grounded system prompt (answer only from chunks, cite section ids, refuse if unsupported, no fabricated numbers, no em dashes). `llm.ts` behind an adapter interface (Claude Haiku default via `ANTHROPIC_API_KEY`), streaming. Test prompt construction includes chunks + citation instruction and excludes anything else. Commit.

### Task 3.4: Serverless endpoint
**Files:** `api/ask.ts`, `api/_lib/ratelimit.ts`, `tests/ask-handler.test.ts`.
- [ ] `POST /api/ask`: IP fixed-window rate limit (429 with message), input length cap + injection hygiene (user text is data, never instructions), embed query, retrieve, gate (refuse without LLM below threshold), else stream grounded answer with `citations` + `confidence`; spend-cap/no-key degradation returns retrieval-only cited chunks. Test the handler logic with a mocked LLM: refusal path makes no LLM call; rate-limit path returns 429; degraded path returns retrieval-only shape. Commit.

### Task 3.5: Ask client + chat UI
**Files:** `src/chat/chatTypes.ts`, `src/chat/AskClient.ts`, `src/chat/ChatPanel.tsx`, `src/sections/ChatSection.tsx`, `tests/ask-client.test.ts`.
- [ ] `AskClient`: typed request, SSE stream parsing, single retry, timeout, refusal/error/rate-limited handling (TDD). `ChatPanel`: streaming, complete-with-citations (chips deep-link to the cited project scene), refusal state visibly distinct, error, rate-limited, degraded; suggested starter questions. `ChatSection` embeds it as the live demo. Commit.

---

## Phase 4 — Integration, tests, deploy (single agent)

### Task 4.1: Wire terminal + chat into App
**Files:** `src/App.tsx`.
- [ ] Mount `Boot`, `CommandPalette`, and the docked `ask` bar around the scroll page; palette commands scroll to sections and open chat; citation chips navigate to scenes. Commit.

### Task 4.2: E2E smoke (Playwright)
**Files:** `tests/e2e/smoke.spec.ts`.
- [ ] boot -> skip -> hero visible; open `⌘K` -> run a command -> scrolls to section; switch theme -> persists on reload; open chat -> grounded question shows a citation chip; off-topic question shows the refusal state; axe accessibility pass; reduced-motion run renders content statically. Commit.

### Task 4.3: CI + Vercel deploy config
**Files:** `.github/workflows/ci.yml`, `vercel.json`, `README` run notes.
- [ ] CI: `tsc` typecheck + Vitest + build (+ optionally Playwright) gate on push. `vercel.json` routes `/api/ask` and sets the function runtime; env vars documented (`ANTHROPIC_API_KEY`, embed/config, spend cap). Commit.

### Task 4.4: Final verification
- [ ] Run the `verify` skill / full local run: build, tests, dev server, drive the flow in a browser (boot, scroll, theme switch, palette, grounded + refusal chat), confirm reduced-motion and Lighthouse targets (MOTION-VISUALS.md §8). Fix issues, re-verify. Commit.

---

## Open items to confirm with Zack during build (do not block; use placeholders + flag)
- Public email address; which repos are public/linkable; resume PDF to host.
- Consented Cart / Lex-AI / Locked IN / Kukis dates.
- LLM spend cap value and embed-query provider for prod.
- Custom domain vs `*.vercel.app`; Kukis site keep-or-redirect.
- Real screenshots for Recomp Tracker, Locked IN, Consented Cart, TulipVision, Lex-AI, dashboards (diagram/code stands in until supplied).
