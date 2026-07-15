# Zack Alatrash — Portfolio

A CLI-themed personal portfolio, built recruiter-first. It boots like a terminal,
then renders into a modern animated scroll site (no typing required) with
count-up metrics, device mockups, and a signature scroll-built architecture
diagram. The terminal lives on as an optional `⌘K` command palette, with
switchable color themes and a grounded RAG chatbot that answers questions about
the work with citations and refuses anything outside its knowledge base.

## Status

Design approved, pre-implementation. See `docs/` for the full specification.

## Docs

- [`docs/DESIGN.md`](docs/DESIGN.md) — master design spec (architecture, stack,
  components, data flow, testing). Start here.
- [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) — terminal visual system,
  theme model, and the launch theme set.
- [`docs/COMMANDS.md`](docs/COMMANDS.md) — the CLI command reference.
- [`docs/MOTION-VISUALS.md`](docs/MOTION-VISUALS.md) — the recruiter-first scroll
  narrative, motion system (GSAP), the scroll-built RAG pipeline, and how backend
  projects are made visual. Read alongside DESIGN.md.
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
