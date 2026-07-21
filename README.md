# Zack Alatrash — Portfolio

A CLI-themed personal portfolio, built recruiter-first. It boots like a terminal,
then renders into a modern animated scroll site (no typing required) with
count-up metrics, device mockups, and a signature scroll-built architecture
diagram. The terminal lives on as an optional `⌘K` command palette, with
switchable color themes and a grounded RAG chatbot that answers questions about
the work with citations and refuses anything outside its knowledge base.

## Status

Built and verified. The full scroll site, terminal command palette, boot
sequence, and grounded RAG chatbot are implemented against the specs in `docs/`.
114 unit tests pass; production build is clean.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run build      # typecheck + production build
```

The chatbot works offline in dev via a client-side retrieval fallback (real
answers with citations and refusals, no LLM call). With a serverless deploy and
an API key it streams full LLM answers.

## E2E smoke (optional)

```bash
npx playwright install
npm run test:e2e
```

## Deploy (Vercel)

Push to a Vercel project. `api/ask.ts` is auto-detected as a serverless
function; `vercel.json` sets its runtime. Environment variables:

- `ANTHROPIC_API_KEY` (server-side only). Absent, the endpoint degrades to
  retrieval-only cited answers, so the site still works with zero cost.
- `ASK_MONTHLY_CALL_CAP` (optional, default 5000) caps LLM calls per month.

## Verified behavior

Boot, theme switching with persistence, count-up metrics, the scroll-built RAG
pipeline animation, project scenes with code artifacts, the command palette
(backtick or the hero control), grounded chat answers with citation chips, and
the off-topic refusal state.

> Redesign in progress (2026-07-16): the site is being rebuilt as one cohesive
> retro video game. See `docs/PAGE-LAYOUT.md` for the new structure. The docs
> below are current; the previously built clean-terminal sections are retired
> (PAGE-LAYOUT.md §11).

## Docs

- [`docs/DESIGN.md`](docs/DESIGN.md) — master design spec (architecture, stack,
  components, data flow, testing). Start here.
- [`docs/PAGE-LAYOUT.md`](docs/PAGE-LAYOUT.md) — the retro-game main-page layout:
  the six screens, navigation, HUD, deep links, and build order. Read second.
- [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) — terminal visual system,
  theme model, and the launch theme set.
- [`docs/COMMANDS.md`](docs/COMMANDS.md) — the CLI command reference.
- [`docs/MOTION-VISUALS.md`](docs/MOTION-VISUALS.md) — the recruiter-first scroll
  narrative, motion system (GSAP), the scroll-built RAG pipeline, and how backend
  projects are made visual. Read alongside DESIGN.md.
- [`docs/SHOWCASE-CONSOLE.md`](docs/SHOWCASE-CONSOLE.md) — the retro console and
  cartridge project showcase that replaces the long project scroll, including
  the instruction-manual case studies and the 3D cartridge.
- [`docs/ASSETS.md`](docs/ASSETS.md) — every asset to generate, with prompt
  templates, technical specs, and priority tiers.
- [`docs/CHATBOT.md`](docs/CHATBOT.md) — the grounded RAG chatbot spec
  (knowledge base, retrieval, evidence gate, serverless endpoint, safety).
- [`docs/CONTENT.md`](docs/CONTENT.md) — content model and copy, mapping the
  master resume to every site surface.

## Concept in one line

The site *demonstrates* the candidate: a keyboard-first engineer's shell that
runs a live, cited, refusal-capable RAG assistant, the same anti-hallucination
engineering that defines the portfolio.

## Stack (planned)

React 18 + TypeScript + Vite + Tailwind CSS v4, with GSAP ScrollTrigger + Lenis
for the scroll narrative, deployed on Vercel with a single rate-limited
serverless function for the chatbot. Vitest + Playwright for tests, GitHub
Actions for CI.

## Principles

- Dual input, single content: nothing is locked behind the CLI.
- No one locked out: non-technical visitors can click everything.
- Grounded and honest: every claim traces to the resume; the chatbot only
  answers from a curated knowledge base.
- Fast and accessible: reduced-motion aware, keyboard-first, WCAG-AA themes.
- Visitor-facing copy avoids em dashes.
