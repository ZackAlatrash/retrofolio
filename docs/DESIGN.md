# Portfolio — Design Spec

Last updated: 2026-07-15
Owner: Ziad "Zack" Alatrash
Status: Approved concept, pre-implementation

This is the source-of-truth design document. Every other doc in `docs/` refines
one slice of what is decided here. If an implementation choice is not covered
here, it should be added here first so the site stays consistent.

---

## 1. The idea in one paragraph

A CLI-themed personal portfolio. The site boots like a terminal and can be
driven two ways at once: power users type commands (`ls projects`,
`cat omnipotence`, `ask "..."`), and everyone else clicks and scrolls the exact
same content. Terminal color themes are switchable and remembered. Projects are
presented as terminal-native deep-dives rather than a card grid. The signature
piece is a real, grounded RAG chatbot that answers questions about Zack's work
with citations and refuses anything outside its knowledge base — a working demo
of the anti-hallucination engineering that defines his portfolio.

## 2. Why this concept (positioning)

The concept must *demonstrate* the candidate, not just decorate a page. Zack's
three differentiators, in order:

1. Grounded AI / anti-hallucination — three independent RAG systems, all built
   around evidence gating, citation enforcement, and deterministic boundaries.
2. Architecture as the differentiator — hexagonal/ports-and-adapters, clean
   architecture, pure domain layers, boundary tests that fail the build.
3. Ships to production end to end — deployed company-wide, university-adopted,
   closed beta to Play Store, live with CI/CD.

The CLI shell speaks to (2) and (3) — it reads as an engineer's site, keyboard
first, fast, no gimmicks. The grounded chatbot *is* a live instance of (1): the
same evidence-gating and refusal behavior his RAG systems use, running on his
own portfolio. Nobody claiming "RAG experience" can match a site that runs one.

Explicitly rejected: 3D/WebGL worlds (misrepresents his specialty as creative
frontend), and a generic "Hero → Projects grid → Contact" template (invisible).

## 3. Non-negotiable principles

- **Dual input, single content.** Anything reachable by a typed command is
  reachable by a click, and vice versa. No content is locked behind the CLI.
- **No one locked out.** A first-time, non-technical visitor must understand
  within 3 seconds that they can just click. A visible hint + clickable command
  chips guarantee this.
- **Grounded, honest, defensible.** Every claim on the site traces to the master
  resume. No fabricated metrics, testimonials, or logos. The chatbot answers
  only from a curated knowledge base and refuses otherwise. This mirrors the
  Kukis "every claim is defensible" discipline.
- **Fast and accessible.** Static-fast pages, ~60fps interactions, full keyboard
  support, `prefers-reduced-motion` honored, screen-reader path, visible focus.
- **Prose avoids em dashes.** Per Zack's standing preference, all visitor-facing
  copy uses commas, colons, or sentence breaks instead of em dashes.

## 4. Architecture overview

```
Browser (React SPA, static)                    Vercel Edge/Serverless
┌───────────────────────────────┐             ┌──────────────────────────┐
│ Terminal shell (command bus)  │             │ /api/ask  (RAG endpoint) │
│  ├─ command registry          │  POST /ask  │  ├─ rate limit (IP)      │
│  ├─ output renderer           │────────────▶│  ├─ retrieve over corpus │
│  ├─ theme engine (persisted)  │◀────────────│  ├─ evidence gate        │
│  ├─ project views (deep+card) │   SSE/JSON  │  ├─ LLM call (cheap model)│
│  └─ chatbot panel (ask)       │             │  └─ cited answer / refuse │
└───────────────────────────────┘             └──────────────────────────┘
        │                                               │
   static assets                                  knowledge base
   (Vite build, Vercel CDN)                       (versioned JSON, bundled)
```

- The whole site is a static React build except one serverless endpoint.
- The knowledge base (project corpus) is authored as structured JSON, committed
  to the repo, and used by both the static project pages and the RAG endpoint.
- No database. No user accounts. No cookies beyond a single `localStorage` key
  for the chosen theme.

## 5. Tech stack

| Layer        | Choice                                   | Why |
|--------------|------------------------------------------|-----|
| Framework    | React 18 + TypeScript (strict)           | Consistent with Kukis; Zack's strongest web stack |
| Build        | Vite 6                                    | Same as Kukis; fast, simple |
| Styling      | Tailwind CSS v4 (`@theme` tokens)         | Theme palettes map cleanly to CSS custom properties |
| Animation    | CSS + minimal Framer Motion               | Typewriter, cursor, scroll reveals; reduced-motion aware |
| Serverless   | Vercel Functions (`/api/ask`)             | Native to Vercel deploy; holds the LLM key server-side |
| LLM          | Cheap hosted model (e.g. small GPT-class or Claude Haiku) | Low cost per answer; swap behind an adapter |
| Retrieval    | In-memory cosine over precomputed embeddings (build-time) | Mirrors Lex-AI's from-scratch approach; no vector DB service needed |
| Tests        | Vitest (unit) + Playwright (smoke)        | Vitest matches Kukis; Playwright for command-bus + a11y smoke |
| CI/CD        | GitHub Actions → Vercel                    | Typecheck + test + build gate on every push |

Decision to confirm with Zack: React Router v7 framework mode (which he shipped
in Consented Cart) is an alternative that natively provides the serverless
endpoint. Default recommendation is plain Vite + React + Vercel functions for
simplicity, since the site is content-static and needs only one API route.

## 6. Core components

Each has one purpose, a clear interface, and is independently testable.

- **CommandBus** — parses input, resolves a command from the registry, returns a
  structured `CommandResult` (never raw HTML). Depends on: registry only.
- **CommandRegistry** — declarative map of command name → handler + help text +
  aliases + tab-completion metadata. Adding a command touches only this file.
- **OutputRenderer** — renders `CommandResult` nodes (text, list, project view,
  chatbot turn, ascii-diagram) to themed DOM. Depends on: theme tokens only.
- **ThemeEngine** — holds the active palette, writes CSS custom properties,
  persists to `localStorage`, exposes `setTheme(name)`. See DESIGN-SYSTEM.md.
- **ProjectView** — renders a project in `deep` or `card` mode from a single
  `Project` record in the content model. Depends on: content model only.
- **ChatPanel** — the `ask` experience: input, streaming answer, citation chips
  that deep-link to the cited project section, confidence + refusal states.
  Depends on: `/api/ask` client.
- **AskClient** — thin typed client for the serverless endpoint (request,
  stream parsing, error/refusal handling, timeout, retry-once).

## 7. Data flow — the `ask` path (the important one)

1. User submits a question (typed `ask "..."` or via the chat input).
2. `AskClient` POSTs `{ question, history }` to `/api/ask`.
3. Endpoint rate-limits by IP (fixed window). Over limit → friendly 429.
4. Retrieval: embed the question, cosine-rank against precomputed corpus chunk
   embeddings, take top-k with a per-project cap for source diversity.
5. **Evidence gate**: if the top similarity is below the threshold, return a
   structured `refusal` (no LLM call) — "not in my knowledge base." This is the
   headline behavior and must be visibly distinct in the UI.
6. Otherwise call the LLM with a strict grounded prompt (answer only from the
   provided chunks, cite section ids, no speculation).
7. Response streams back with `citations: [{projectId, sectionId, label}]`.
8. `ChatPanel` renders the answer; citation chips scroll/open the exact cited
   project section. Confidence is shown honestly.

The knowledge base, thresholds, prompt, and safety rules live in CHATBOT.md.

## 8. Site structure (content surfaces)

All are reachable by command and by click:

- `whoami` / **Home** — identity, one-line positioning, key metrics readout.
- `ls projects` / **Projects index** — the 12 projects; top 6 flagged as deep.
- `cat <project>` / **Project view** — deep case study or concise card.
- `ask "..."` / **Chatbot** — grounded Q&A, always accessible (also a persistent
  affordance, not only a command).
- `skills` / **Skills** — grouped inventory (AI/ML, architecture, cloud, etc.).
- `resume` / **Resume** — view + download the tailored PDF.
- `contact` / **Contact** — email, GitHub, LinkedIn; no form needed (mailto), or
  a static-form provider like Kukis used.
- `help` — discoverable command list. `theme`, `clear`, history, tab-complete.

Full command spec: COMMANDS.md. Full copy + project mapping: CONTENT.md.

## 9. Project view: `deep` vs `card`

**Deep** (Omnipotence, Recomp Tracker, Consented Cart, Lex-AI, TulipVision,
Locked IN). Structure, in order:
1. One-line what-it-is + status badge (deployed / beta / live / adopted).
2. Problem — the real problem being solved.
3. Architecture — an ASCII/schematic diagram, expandable to a richer view.
4. Hardest problem — the single most interesting engineering decision.
5. Trade-offs — what was chosen and what was given up.
6. Metrics — pulled from the resume metrics bank.
7. Limitations — honest boundaries (builds credibility, matches backend-case-
   study best practice).
8. Links — repo / live / case-study, where they exist.

**Card** (Digital Banking, Kukis, Haarlem Festival, Study Planner, Chapeau,
Cello, GI portal). One-line what-it-is, stack, one standout detail, 1–3 metrics,
links. No diagram, no limitations section.

## 10. Error handling

- Unknown command → suggest nearest match + point to `help`. Never a dead end.
- `/api/ask` down / timeout → chat shows a calm inline error and offers to retry;
  the rest of the site is unaffected (static).
- Rate limited → explain the limit plainly, suggest browsing projects directly.
- No JS / JS error boundary → a static, readable fallback of the core content so
  the site is never blank (progressive enhancement for the shell).

## 11. Testing strategy

- **Unit (Vitest):** CommandBus parsing (quotes, flags, unknown commands),
  CommandRegistry resolution + aliases, ThemeEngine persistence, AskClient
  stream/refusal/error handling, retrieval ranking + evidence-gate threshold.
- **Component:** ProjectView renders deep vs card from a record; ChatPanel
  renders answer / refusal / error / rate-limited states.
- **Smoke (Playwright):** boot → run a command → switch theme (persists on
  reload) → open a project → ask a grounded question (citation appears) → ask an
  off-topic question (refusal appears). Plus an axe accessibility pass.
- CI gates: `tsc` typecheck + Vitest + build must pass before deploy.

## 12. Accessibility

- Terminal input is a real focusable field; every command chip is a real button.
- All interactive elements keyboard reachable, visible focus rings.
- `aria-live="polite"` region announces command output and streamed answers.
- `prefers-reduced-motion`: disable typewriter/cursor/scroll animation, show
  content immediately.
- Color themes must each pass contrast for body text; the `paper` light theme is
  the high-contrast default-friendly option. Theme choice never encodes meaning
  by color alone.

## 13. Out of scope (YAGNI)

- No CMS, no blog engine at launch (a `blog` command can come later).
- No auth, no analytics dashboards, no comment system.
- No multi-language site (content is English; languages are listed as a fact).
- No 3D, no WebGL, no audio.

## 14. Open decisions to confirm before build

- Vite + React + Vercel functions (default) vs. React Router v7 framework mode.
- LLM provider for `/api/ask` and the monthly spend cap.
- Custom domain vs. `*.vercel.app` (and whether to keep the Kukis GitHub Pages
  site or redirect it here).
- Which themes ship at launch (proposed set in DESIGN-SYSTEM.md).
