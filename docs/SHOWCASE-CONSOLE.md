# Portfolio — Console & Cartridge Showcase

Last updated: 2026-07-16
Replaces: the long-scroll `SelectedWork` / `MoreWork` sections
Refines: MOTION-VISUALS.md §3, §6; DESIGN.md §9
Assets: ASSETS.md

The project showcase is a retro game console. All 12 projects are cartridges on
a shelf, visible in roughly one screen. Selecting one loads it on a CRT as a
title screen with real metrics as stats; PRESS START opens the case study as a
game instruction manual.

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
