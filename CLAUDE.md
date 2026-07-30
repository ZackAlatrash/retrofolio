# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Vite dev server on :5173
npm test               # unit tests (Vitest, jsdom)
npm run test:watch     # Vitest watch mode
npm run typecheck      # tsc -b --noEmit
npm run build          # typecheck + production build
npm run test:e2e       # Playwright (needs `npx playwright install` once)
```

Run a single unit test file or a single case:

```bash
npx vitest run tests/system-map.test.tsx
npx vitest run -t "refuses off-topic"
```

Playwright starts the dev server itself (`playwright.config.ts`) and reuses a running one locally.

## Debug query parameters

These exist because the whole site is one scroll-scrubbed sequence, and there is no other way to land on a mid-animation frame:

| Parameter | Effect |
| --- | --- |
| `?seq=0..1` | Force the pinned sequence's progress |
| `?mock=skills` / `?mock=contact` | Render one screen standalone (bypasses the shell) |
| `?cp=0..1` | Force the credits roll progress |
| `?m=0..1` | Force the HUD nav's morph value |
| `?motion` | Ignore `prefers-reduced-motion` |
| `?touch` | Force the hoverless path (swipe rack, two-tap load, 44px targets) |

## Architecture

### The pinned sequence is the app

`GameShell` renders essentially one thing: `TitleLibrary`, a single pinned container whose scroll progress drives four screens on the same television without a cut (title scrub → camera pull-back to the shelf → tilt down to the handheld → constellation reveal). Contact/credits is a real section after it.

`src/showcase/sequence.ts` is the **single source of truth** for that timeline. It defines the per-phase heights in viewport units and derives the `S1`–`S4` boundary fractions from them. Both the visuals and `src/game/useGameRoute.ts` (which drives the HUD's active-screen highlight) read the same constants, so the nav cannot drift out of sync with what is on screen. Change a phase's length by editing the `*_VH` constants; never hardcode a boundary fraction anywhere else.

An IntersectionObserver cannot replace this: inside the pinned sequence `#about` and `#skills` are one-pixel anchors, not sections.

### Live code vs. legacy code

The repo contains an earlier CLI/scroll-narrative build that is **no longer rendered**. Nothing in `App.tsx` reaches it.

- **Live:** `src/game/`, `src/screens/`, `src/showcase/`, `src/hero/`, `src/motion/`, `src/theme/`, `src/content/`
- **Legacy, reachable only from tests:** `src/sections/`, `src/terminal/`, `src/components/`

`tests/sections.test.tsx`, `tests/command-bus.test.ts` and `tests/palette.test.tsx` still cover the legacy trees. Some docs (notably `docs/COMMANDS.md`) also describe that older model. `docs/PAGE-LAYOUT.md` is the current source of truth for structure. Before editing anything under the legacy trees, check whether the change belongs in the live equivalent instead.

### Content is résumé-derived, one direction only

```
src/content/profile.ts + projects.ts  →  showcaseData.ts  →  cartridges
                                      →  skills.ts        →  constellations
```

Never add a claim, metric, or link to a screen that isn't in `profile.ts`/`projects.ts`.

`showcaseData.ts` throws at import time if a cartridge references an unknown project id.

### Motion

- `src/motion/gsap.ts` registers ScrollTrigger exactly once and returns `null` outside a real browser (it explicitly detects jsdom). Callers must handle `null`; this is what keeps GSAP code testable under Vitest.
- Continuous animation goes through the rAF tween engine in `src/showcase/bootFlow.ts`, which mutates styles directly rather than re-rendering React per frame. It **completes instantly when `document.hidden`**, so a flow can never strand the UI in a background tab. `useGameRoute` does the same for scroll. Preserve that property in any new animation.
- `prefers-reduced-motion` is a real second rendering path, not a toggle: under it `GameShell` renders About and Skills as ordinary sections outside the pinned sequence, and `useGameRoute` switches to geometry-based active detection. Any new screen inside the sequence needs a reduced-motion path too.

### Assets and base path

The site deploys to two places with different roots, so **every asset URL must be built from `import.meta.env.BASE_URL`** (see `showcaseData.ts`, `useHeroScrub.ts`, `AboutCard.tsx`). A leading-slash path will 404 on GitHub Pages, which serves from `/<repo>/`. `vite.config.ts` reads `VITE_BASE`, which the Pages workflow sets.

## Conventions

- **No em dashes (U+2014) anywhere in `src/`.** Enforced by `tests/no-em-dash.test.ts`. Use a colon, a comma, or parentheses.
- **Grounded and honest.** Every claim traces to the résumé; skill strength is derived from shipped projects, never self-assessed; links must be real. The bot refuses rather than guesses, and the site's own copy is held to the same bar.
- **Nothing gated behind an animation.** Reduced motion and the list views must reach the same content.
- `tsconfig.json` has `noUnusedLocals`/`noUnusedParameters` on and covers `src`, `api`, `scripts`, `tests`. `npm test` does not typecheck; run `npm run typecheck` separately.

## Deployment

**GitHub Pages** (`.github/workflows/pages.yml`) — runs typecheck + unit tests before building, touches `.nojekyll`, deploys. Retry a failed deploy with `workflow_dispatch`.

Served from **zackalatrash.com**, so the workflow builds with `VITE_BASE="/"`
and `public/CNAME` carries the domain (Vite copies `public/` into `dist/`, and
Pages reads that file to claim the custom domain). If the domain ever goes away,
set `VITE_BASE` back to `"/${GITHUB_REPOSITORY#*/}/"` and delete the CNAME, or
every asset URL will 404 against a project-site path. DNS is on Cloudflare with
the Pages records set to DNS-only, not proxied.

The site is fully static: there is no server and no API. The help chatbot, its
`/api/ask` endpoint and the retrieval/gate code were removed, so nothing here
needs a key or a serverless runtime.

`.github/workflows/ci.yml` runs typecheck, unit tests, and build on every push and PR. The Playwright suite is **not** in CI.
