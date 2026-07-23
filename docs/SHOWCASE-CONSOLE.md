# Portfolio — Console & Cartridge Showcase

Last updated: 2026-07-16
Replaces: the long-scroll `SelectedWork` / `MoreWork` sections
Refines: MOTION-VISUALS.md §3, §6; DESIGN.md §9
Assets: ASSETS.md

The project showcase is a retro game console. All 12 projects are cartridges on
a shelf, visible in roughly one screen. Selecting one loads it on a CRT as a
title screen with real metrics as stats; PRESS START opens the case study.

## Agreed design (2026-07-16, brainstormed with Zack)

- **Layout = "game station":** a CRT/console on TOP shows a live title-screen
  preview; the 12 cartridges sit in a flagship-first GRID below it. Everything
  in one screen, no scroll. Cohesive with the hero (whose CRT ends on cartridge
  silhouettes that become these carts).
- **Interaction:** hovering a cartridge live-updates the CRT preview; clicking
  plays an insert + boot into that project's detail screen.
- **Cartridge:** a labelled cart (ridged top, printed label) carrying the
  generated 16-bit label art (ASSETS.md §1.1) + project name; a status dot
  (green=deployed/live, amber=beta, purple=personal, dim=academic).
- **CRT preview content:** box art, project name (pixel), genre/category, one
  headline stat, blinking PRESS START.
- **Detail screen = a dedicated "game" screen** booted from the cartridge
  (insert -> boot -> screen -> EJECT back; prev/next to flip projects). Its
  content is MODULAR per project (each shows only the blocks that fit): title
  card, stats panel, screenshot gallery OR architecture diagram, code snippet,
  short demo video/GIF, briefing text (as game sections), links. Internal layout
  (tabbed vs scroll vs dashboard) is DEFERRED - decide when we build the detail
  content.

## Cartridge click -> project detail (agreed 2026-07-22)

Three acts, all in-world:

1. **Boot ritual (full insert + fast-path).** Click: the cartridge lifts off
   the shelf, arcs to the console and slides into the slot; the power LEDs flip
   red -> green; the TV static-pops into the project's splash (title + art +
   LOADING). Full ritual ~1.2s on first insert; a shortened fast-path (~0.5s)
   on repeat inserts; a second click skips.
2. **Dive through the glass.** The camera pushes into the TV until the screen
   fills the viewport - the detail view IS what's playing on the TV. Faint CRT
   dressing (scanlines, corner curvature) persists. `EJECT` reverses the zoom
   back into the room; the cartridge pops back to the shelf.
3. **Detail screen (hybrid uniqueness).** One consistent in-game UI shell:
   title bar (project name, EJECT, PREV/NEXT), content area. Per-project skin:
   the project's label art as hero backdrop, its shell colour as accent.
   Modular content blocks per project (gallery, demo GIF, architecture diagram,
   code artifact, stats, story sections, links) PLUS one signature interactive
   module per flagship:
   - Omnipotence: mock query -> pipeline -> cited answer demo
   - Recomp Tracker: animated weekly-stats dashboard + phone gallery
   - TulipVision: before/after detection slider on a real field photo
   - Lex-AI: evidence-gate demo (confidence bar -> answer vs refusal)
   - Kukis: the live site embedded
   - Consented Cart / Locked IN: diagram-led (consent write path / policy engine)

Routing: `#project-<id>/detail` deep-links straight into a booted detail view.
Reduced motion: no flight/dive; the detail opens as a plain view.
Asset needs: real captures per project (phone screenshots, detection results,
dashboard shots, short muted demo clips) - generated art is identity, captures
are proof.

---

## 1. Why this and not the alternatives

The long vertical scroll buried the work. Trading cards and a museum gallery had
flair but spoke a different visual language than the terminal and would have
made the site feel like two designs stitched together. The console resolves it:
retro gaming and the command line belong to the same era and palette, and the
site **already boots** and **already ships a CRT/scanline toggle**, so this
extends the existing design rather than competing with it.

## 2. Scope discipline (important)

The console theme applies to **the project showcase and the boot sequence only**.

- Stays clean terminal: hero, proof strip, the scroll-built RAG pipeline, the
  grounded chatbot, skills, contact.
- Becomes console: the showcase, and the boot gains a power-on flavour.

One bold set piece reads as art direction. Theming every surface reads as a
novelty site, and Zack is applying for AI systems roles where the work must stay
legible and serious.

## 3. Structure

```
┌──────────────────────────────────────────────┐
│  CRT screen: title art + stats + PRESS START │   <- selected cartridge
└──────────────────────────────────────────────┘
   ▸ SELECT CARTRIDGE
   ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
   │ 01 │ │ 02 │ │ 03 │ │ 04 │ │ 05 │ │ 06 │      <- 12 cartridges, one screen
   └────┘ └────┘ └────┘ └────┘ └────┘ └────┘
   ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
   └────┘ └────┘ └────┘ └────┘ └────┘ └────┘
```

No page scrolling to browse the catalogue. The manual (case study) opens as a
full view, not an inline expansion, so the shelf never turns back into a wall.

## 4. The three states

### 4.1 Shelf (default)
- 12 cartridges in a responsive grid. Each: shell colour, ridged top, label art
  (ASSETS.md §1.1), project name, and a status dot.
- Status dot carries the same instant signal the old badges did:
  green = deployed/live, amber = beta, purple = personal, dim = academic.
- Hover lifts the cartridge; focus does the same for keyboard users.
- Flagship (tier-1) projects are visually weighted slightly larger or ordered first.

### 4.2 Loaded (CRT title screen)
- Title-screen key art as backdrop, project name in the pixel display face,
  subtitle, and a stat readout using **real metrics only** from the metrics bank
  (LOC, tests, ports, mAP, grade), formatted as a game stat block.
- `PRESS START ▸ READ CASE STUDY` blinking prompt (and a real button).
- A short load flicker between selections. Never longer than ~200 ms.

### 4.3 Manual (case study)
The instruction-booklet spread. Retro manuals were text-dense, diagram-heavy and
serious, which is exactly what a technical reader needs. Sections map to the
existing deep-dive content (DESIGN.md §9):

| Manual section | Content |
|---|---|
| The story | `problem` |
| How it works | `architecture` + the authored SVG diagram |
| Boss fight | `hardestProblem` |
| Trade-offs | `tradeoffs` |
| Stats | `metrics` |
| Known issues | `limitations` (honest, and it builds trust) |
| Equipment | `stack` chips |
| Links | repo / live / store, only where real |

Paper texture is generated; the diagrams are authored SVG so they are accurate,
themeable, translatable, and screen-reader describable.

## 5. The 3D cartridge

A single Three.js box mesh textured with the selected cartridge's label.
Hover tilts it; selecting slides it into the console slot and triggers the load.

- Lazy-loaded chunk, never blocking first paint.
- Static image fallback on mobile, reduced motion, `save-data`, or WebGL failure.
- The shelf and manual are fully usable with 3D disabled.

## 6. Interaction and routing

- **Deep links are required**: `#project-<id>` opens the shelf with that
  cartridge loaded, and `#project-<id>/manual` opens its manual directly. This is
  what lets Zack link a recruiter straight to one project from an application,
  and it keeps the chatbot's existing citation anchors working.
- Keyboard: arrow keys move along the shelf, Enter loads, Enter again opens the
  manual, Escape returns. Every cartridge is a real focusable button.
- The `cat <project>` command and chatbot citation chips both route here.

## 7. Accessibility

- Pixel display font is for **titles and stat labels only**, never body copy.
- Each cartridge button has an accessible name: project, status, one-liner.
- Label art is decorative (`alt=""`); the name is real text beside it.
- The CRT scanline/vignette overlay must never drop text contrast below WCAG AA.
- Reduced motion: no flicker, no tilt, no insert animation, no idle shimmer.
- The manual is a normal document: headings, lists, and readable line length.

## 8. Sound (opt-in)

Cartridge select blip, power-on chime, PRESS START confirm. Muted by default,
visible toggle, persisted to `localStorage` (`zk.sound`). See ASSETS.md §5.

## 9. Component plan

```
src/showcase/
  ConsoleShowcase.tsx     # owns state: shelf | loaded | manual
  CartridgeShelf.tsx      # the 12 cartridges, keyboard grid
  Cartridge.tsx           # one cartridge (2D)
  Cartridge3D.tsx         # lazy Three.js hero cartridge + fallback
  CrtScreen.tsx           # title art, stat block, PRESS START
  Manual.tsx              # instruction-booklet case study
  useShowcaseRoute.ts     # hash routing + deep links
```
Data comes from the existing `src/content/projects.ts`; no duplicate content.

## 10. What this replaces

`src/sections/SelectedWork.tsx`, `ProjectScene.tsx`, and `MoreWork.tsx` are
retired. `ScrollNarrative` renders `<ConsoleShowcase/>` in their place, keeping
the section id `work` and all `project-<id>` anchors intact so commands,
citations, and existing tests keep working.
