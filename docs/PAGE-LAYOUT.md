# Portfolio — Main Page Layout (Retro Game Redesign)

Last updated: 2026-07-16
Status: Agreed direction. This is the authoritative structure for the main page.
Supersedes: the recruiter-first clean-terminal scroll narrative in
MOTION-VISUALS.md §3 (that section list no longer applies).
Related: SHOWCASE-CONSOLE.md (screen 3), ASSETS.md, CHATBOT.md.

The entire site is one cohesive retro video game. Every section is a "screen."
The framing is playful; the content stays serious, legible, and honest. The
contrast (arcade wrapper, senior-engineer substance) is the whole point.

---

## 1. Navigation model

**Scrollable full-height screens plus a persistent level-select menu.**

- Each screen is a full-viewport panel (`min-height: 100vh`), but may grow taller
  if its content needs the room. Nothing is ever clipped to fit a viewport.
- Visitors scroll naturally through the screens, OR jump directly via the
  persistent HUD level-select. Both reach the same content.
- One page, one URL. Deep links per screen and per project (see §4). Good for
  SEO, skimming, and linking a recruiter to a specific screen.
- Optional gentle scroll-snap on desktop pointers only; disabled on touch and
  under reduced motion, and never if it prevents reading a taller screen.

This keeps the game feel without the downsides of a true screen-switching SPA
(recruiters can still scan everything, and there is one indexable page).

## 2. The HUD (persistent chrome)

Always on screen, low-profile, does not cover content:

- **Level select** — the menu: Title / About / Projects / Skills / Patch Notes /
  Contact. Marks the current screen. This is the primary navigation.
- **Theme toggle** — the existing palette switcher (tokyo-night default + others).
- **Sound toggle** — opt-in retro SFX, muted by default (ASSETS.md §5).
- **Language toggle** — EN / NL. Only the Dutch-enabled screens switch (§5).
- **`?` Help** — the floating support-style chatbot button (see §6, CHATBOT.md).

HUD is keyboard reachable, has visible focus, and collapses to a compact
menu button on mobile.

## 3. The six screens

Order is fixed. Each is built and perfected one at a time; assets are supplied
per screen as we go.

### Screen 1 — TITLE SCREEN (Hero) · NL
The first impression; it must look expensive. Pixel-art, and the console is
**alive from the first frame** (no dead-black off state, and it never powers
down since it runs the whole site).

- **Mechanic:** a scroll-scrub video, pinned (Kukis-style frame scrub). A Veo
  video (image-to-video, two Nano Banana pixel-art keyframes) plays as the user
  scrolls: streams of generic pixel code rain in and coalesce into a calm
  title-screen backdrop, and a row of blank cartridge silhouettes materializes
  along the lower third, bridging directly into the Projects showcase below.
- **Generic code only** (no project-specific imagery) so the hero never goes
  stale as the work grows. Cartridge silhouettes are unlabeled; the real labeled
  cartridges live in Screen 3.
- **Text is HTML overlay, never baked into the video** (crisp, translatable,
  accessible). Reveal choreography by scroll %: logo ~50%, tagline ~68%, menu
  ~87%, `PRESS START` blink ~90%.
- **Copy:** title `ZACK ALATRASH`; tagline `Grounded AI, shipped to production.`
  (NL `Gefundeerde AI, in productie gebracht.`); menu START · ABOUT · SKILLS ·
  CONTACT (NL START · OVER MIJ · VAARDIGHEDEN · CONTACT); `PRESS START` jumps to
  Projects; footer `© 2026 · Haarlem, NL · Available summer 2026`.
- **Assets (from Zack):** the Veo MP4 (pixel-art). I extract ~120 frames for
  jank-free scrubbing, with a static poster fallback for reduced motion.
- **Fallback:** under reduced motion or if the video is unavailable, show the
  settled title-screen poster frame with the text, no scrub.

### Screen 2 — PLAYER 1 (About, character card) · NL — BUILT 2026-07-23
- You as the playable character on a character-select card. The game framing
  lives in the visuals; the wording stays professional (recruiter-facing).
  Built as `src/screens/AboutScreen.tsx`, wired into the shell.
- Content (all from the master resume): a first-person PROFILE bio
  (`profile.bio`), a TRACK RECORD stat row (count-up on scroll), WHAT SETS ME
  APART (the three pillars), LANGUAGES with proficiency bars, identity facts
  (role, base, study, work permit), and a CERTIFICATIONS & COURSES row.
- Motion (hand-rolled rAF/CSS, no framer): staggered scroll-in entrance, a
  count-up on the numbers (shared `tween`, so it settles instantly in a hidden
  tab), and a subtle holographic tilt/sheen on hover-capable pointers. All
  reduced-motion and touch aware.
- Decisions: the Syria origin line was dropped (sensitive, unconfirmed) in
  favour of "Dutch work permit"; the AI-lecture-at-12 story is a possible
  future humanising addition. Still to do: pixel portrait asset (placeholder in
  place), NL translation of the bio, and the shared HUD mobile pass.
- Assets still needed: the pixel portrait.

### Screen 3 — GAME LIBRARY (Projects, cartridge showcase) · main event
- The console and 12 cartridges, flagship-first order (§7). Select a cartridge →
  CRT title screen with real stats → `PRESS START` opens the instruction-manual
  case study. Full spec: SHOWCASE-CONSOLE.md.
- Assets: 12 cartridge labels, 3D hero cartridge, CRT, title-screen key art.

### Screen 4 — SKILL CONSTELLATIONS (Skills) — BUILT 2026-07-25
- The night sky behind the About card turns out to be the skill map: the card
  lifts away and the stars shine into six real constellations, one per domain.
  Built as `src/screens/SkillsPage.tsx`, driven by the same pinned sequence
  (SKILLS_VH / S4); content in `src/content/skills.ts`.
- Real constellations, plotted from actual star coordinates (RA/Dec): AI · RAG
  = LEO (Zack's sign; RAG systems sits on Regulus), Architecture = LYRA,
  Testing = CRUX, Cloud = CORVUS, Backend = URSA MAJOR, Frontend = CANCER.
  Star counts match each branch's skill count exactly.
- Evidence, not self-rating: a star's brightness is how many shipped projects
  use that skill, and the proof panel deep-links to the cartridges that prove
  it. 35 abilities, curated from the master resume (the exhaustive keyword
  list stays on the resume).
- Reading model: calm default (six names only), a navigator rail that focuses
  and pans to a constellation, labels only for the focused one, a brightness
  legend, and a SKY/LIST toggle (LIST is the scannable/accessible view and
  what phones get).
- The sky pans horizontally by drag/wheel/arrows on a transformed layer (never
  a scroll container, which would trigger the browser's back gesture).
- Assets: the generated night-sky panorama (`public/game/sky.webp`). No pixel
  tech icons needed after all.

### Screen 5 — PATCH NOTES (Dev log)
- A changelog cartridge: what you are shipping now, newest first
  (e.g. "v2026.7 — Recomp Tracker heading to Play Store"). Styled as game update
  notes. Signals momentum.
- Content lives in the content model as dated entries.

### Screen 6 — CREDITS (Contact) · NL
- An end-of-game credits roll: GitHub, LinkedIn, email, resume download, and an
  `INSERT COIN TO CONTINUE` contact call to action. References placeholder.
- No fabricated links; real destinations only.

## 4. Routing and deep links

- Screen anchors: `#title`, `#about`, `#projects`, `#skills`, `#patch`, `#contact`.
- Project deep links: `#project-<id>` loads that cartridge; `#project-<id>/manual`
  opens its manual directly (SHOWCASE-CONSOLE.md §6). These anchors are required
  so the support chatbot's citations and application links land correctly.
- The old section id `work` maps to `#projects` for backward compatibility with
  existing commands and tests.

## 5. Language (EN / NL)

- Dutch is enabled on **Title, About, and Contact only**. Other screens stay
  English (technical content).
- All visitor copy for these screens lives in the content model as
  `{ en, nl }` pairs, never hardcoded in components, so the two locales stay in
  sync. The toggle swaps locale and persists to `localStorage` (`zk.lang`).

## 6. The chatbot (de-scoped to a support widget)

The grounded RAG chatbot is no longer a page section. It is a floating,
support-style help button (the `?` in the HUD) that opens a small chat panel,
exactly like a product support widget. The retrieval, evidence gate, citations,
and refusal behaviour are unchanged (CHATBOT.md); only its placement changes.
Citation chips still deep-link to `#project-<id>`.

## 7. Cartridge ordering

Flagships first, then grouped by category (agreed):
1. Omnipotence, Recomp Tracker, Consented Cart, Lex-AI, TulipVision, Locked IN
   (the six deep projects), then
2. the remaining six grouped by domain (full-stack, web, mobile).

## 8. Accessibility and performance

- Pixel display font for **titles, menu labels, and stat labels only** — never
  body copy or manuals.
- Every menu item, cartridge, and control is a real focusable element with an
  accessible name.
- `prefers-reduced-motion`: no power-on flicker, no scroll-snap, no cartridge
  tilt/insert, no idle shimmer; content renders in its final state.
- CRT/scanline overlays must never drop text contrast below WCAG AA.
- Lazy-load per screen and per asset; the 3D chunk never blocks first paint.
- Target Lighthouse 90+ on mobile despite the art; see ASSETS.md budgets.

## 9. Build approach

One screen at a time, perfected before moving on, assets supplied per screen.
Suggested build order (value-first): Title → Projects (the main event) → About →
Skills → Contact → Patch Notes. Shared foundations (HUD, level-select, routing,
the game visual layer in DESIGN-SYSTEM.md) are built alongside the Title screen.

## 10. Component plan (indicative)

```
src/game/
  GameShell.tsx        # page frame: screens + HUD + routing
  Hud.tsx              # level select, theme, sound, language, help
  levelSelect.ts       # screen registry (id, label, anchor)
  useGameRoute.ts      # hash routing + deep links + scroll sync
src/screens/
  TitleScreen.tsx      Hero
  AboutScreen.tsx      character card
  Skills­Screen.tsx     skill tree
  PatchNotesScreen.tsx dev log
  ContactScreen.tsx    credits
src/showcase/          # the cartridge showcase (SHOWCASE-CONSOLE.md §9)
src/chat/              # the support-widget chatbot (existing, re-placed)
```

## 11. What is retired from the previous build

The clean-terminal scroll narrative and its sections are superseded:
`src/sections/*` (Hero, ProofStrip, PipelineScene, SelectedWork, ProjectScene,
MoreWork, Skills, Contact, ScrollNarrative). Reusable pieces (the pipeline
animation, StatCounter, theme engine, content model, the chatbot backend) carry
forward. The content model (`src/content/*`) and the theme engine are kept.
