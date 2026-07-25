# retrofolio — Zack Alatrash

A portfolio built as one continuous retro video game. It opens on a title
screen, boots a console, lets you browse real projects as game cartridges,
tilts down to a handheld in your hands to meet the player, reveals the skill
set as a night sky of real constellations, and closes on a credits roll.

The framing is playful; the content is not. Every number, claim and link comes
from a real résumé, and the site's own help bot refuses anything it cannot
support with evidence.

**Live:** _not deployed yet_ · **Stack:** React 18 · TypeScript · Vite ·
Tailwind v4 · Vercel

## The screens

One pinned scroll sequence carries the first four screens on the same
television, so the camera never cuts:

1. **Title** — a 96-frame scroll-scrubbed hero that dies like a real CRT
   (vertical collapse into a scanline, then a dot, then a phosphor ember) as a
   dark room fades up and the set powers back on.
2. **Game library** — seven projects as labelled cartridges on a shelf. Click
   one and it arcs into the console, seats in the slot the way a top-loader
   really does, boots a splash on the CRT, and the camera dives through the
   glass into the project's detail screen.
3. **Player 01 (about)** — the view tilts down to a handheld held in both
   hands, it boots, and the camera pushes into its screen where the character
   card resolves.
4. **Skill constellations** — the card lifts away and the stars behind it turn
   out to be the skill map: six real constellations plotted from actual star
   coordinates (Leo, Lyra, Crux, Corvus, Ursa Major, Cancer). A star's
   brightness is how many shipped projects use that skill, and every skill
   deep-links to the cartridges that prove it.
5. **Credits** — the end of the game: the credits roll over the same sky and
   settle on the contact card.

## What is worth reading in the code

- `src/showcase/sequence.ts` — the phase map (S1–S4) every screen animates on.
  The HUD derives its active screen from the same numbers, so the navigation
  cannot drift out of sync with the visuals.
- `src/screens/TitleLibrary.tsx` — the pinned sequence: the CRT power-cycle,
  the cartridge boot flow, the tilt to the lap, the dive into the handheld.
- `src/showcase/bootFlow.ts` — a small rAF tween engine that completes
  instantly in a hidden tab, so an animation can never leave the UI stranded.
- `src/screens/SkillsPage.tsx` — the constellations, projected from right
  ascension and declination, panned by transform rather than a scroll
  container (a scroll container lets the trackpad reach the browser's
  back gesture).
- `api/ask.ts` + `src/rag/` — the grounded help bot: hybrid retrieval, an
  evidence gate, citation enforcement, and a retrieval-only fallback so it
  still answers honestly with no API key and no cost.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run build      # typecheck + production build
```

Useful debug parameters while developing:

| Parameter | Effect |
| --- | --- |
| `?seq=0..1` | Force the pinned sequence's progress |
| `?mock=skills` / `?mock=contact` | Render one screen on its own |
| `?cp=0..1` | Force the credits roll's progress |
| `?motion` | Ignore `prefers-reduced-motion` |

## Deploy (Vercel)

`api/ask.ts` is auto-detected as a serverless function; `vercel.json` sets its
runtime. Environment variables:

- `ANTHROPIC_API_KEY` (server-side only). Without it the endpoint degrades to
  retrieval-only cited answers, so the site still works at zero cost.
- `ASK_MONTHLY_CALL_CAP` (optional, default 5000) caps LLM calls per month.

## Accessibility and motion

`prefers-reduced-motion` is a first-class path, not an afterthought: the camera
moves are skipped and every screen renders in its final state as ordinary
sections. The constellation has a plain grouped list view, controls are real
focusable elements with accessible names, and clipboard actions announce
themselves to screen readers.

## Docs

- [`docs/PAGE-LAYOUT.md`](docs/PAGE-LAYOUT.md) — the authoritative screen
  structure, navigation, HUD and build order. Start here.
- [`docs/SHOWCASE-CONSOLE.md`](docs/SHOWCASE-CONSOLE.md) — the console, the
  cartridges and the click-to-detail flow.
- [`docs/DESIGN.md`](docs/DESIGN.md) — architecture, stack, data flow, testing.
- [`docs/CHATBOT.md`](docs/CHATBOT.md) — the grounded RAG spec: knowledge base,
  retrieval, evidence gate, serverless endpoint, safety.
- [`docs/CONTENT.md`](docs/CONTENT.md) — the content model, mapping the résumé
  to every surface.
- [`docs/ASSETS.md`](docs/ASSETS.md) — every asset, with generation prompts and
  specs.
- [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) — visual system and themes.

Some docs still describe the earlier CLI-themed build; `PAGE-LAYOUT.md` is the
current source of truth for structure.

## Principles

- **Grounded and honest.** Every claim traces to the résumé. Skill levels are
  derived from shipped projects, never self-assessed. The bot refuses rather
  than guesses.
- **No one locked out.** Nothing is gated behind an animation; reduced motion
  and the list views reach the same content.
- **The wrapper is arcade, the substance is not.** Visuals carry the theme;
  the writing stays professional.
