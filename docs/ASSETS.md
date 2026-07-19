# Portfolio — Asset Inventory & Generation Briefs

Last updated: 2026-07-16
Refines: SHOWCASE-CONSOLE.md, MOTION-VISUALS.md §6

Every asset the site needs, what to generate it with, and the technical specs.
Work top-down: Tier 1 assets carry the personality and the shareability, Tier 3
is delight. Nothing here is faked: generated art is used for *illustration and
identity*, never to imitate a screenshot or a metric that does not exist.

---

## 0. Global rules

- **No baked-in text in generated images.** All labels, titles, and captions are
  rendered in HTML so they stay crisp, accessible, translatable (Dutch toggle),
  and themeable. Generated art is illustration only.
- **Formats:** author at 2x, ship AVIF + WebP with a PNG/JPG fallback, via
  `<picture>` and responsive `srcset`. Explicit `width`/`height` to avoid layout
  shift. Everything below the fold is lazy-loaded.
- **Budget:** the cartridge shelf must not exceed ~600 KB total on first paint.
  Labels are small (they render at ~120 px); do not ship 2 MB PNGs.
- **Naming:** `public/assets/<category>/<project-id>.<ext>`, e.g.
  `public/assets/cartridges/omnipotence.webp`.
- **Placeholders:** until real art exists, the current coded placeholders stay.
  A missing asset must degrade gracefully, never render a broken image.

---

## 1. Tier 1 — do these first

### 1.1 Cartridge label art (12)

The core of the site's personality. Use ONE prompt template for all twelve so
the shelf reads as a single product line.

```
16-bit era video game cartridge label art. [SUBJECT]. Bold graphic composition,
limited retro palette, flat vector-illustration style, slight print grain,
centered focal subject, high contrast, NO text or lettering, square crop.
```

| Project | SUBJECT |
|---|---|
| omnipotence | a satellite beaming a scanning ray over a canyon of glowing code blocks |
| recomp-tracker | a pixel athlete silhouette with orbiting HUD rings, charts and a dumbbell |
| consented-cart | a shopping cart behind a shield and padlock crest, ring of stars motif |
| lex-ai | marble scales of justice over a wall of legal documents, deep EU blue |
| tulipvision | aerial rows of a tulip field with cyan detection brackets |
| locked-in | a heavy vault door with a 28-day dial and chains |
| digital-banking | a fortress vault with stacked coins and a card motif |
| kukis | a cookie breaking apart to reveal a shape in the cleared centre |
| haarlem-festival | festival tents and a stage against Dutch canal houses |
| study-planner | a clock tower made of stacked books and a calendar grid |
| chapeau | a chef's hat above a bustling kitchen pass |
| cello | a cello beside a delivery scooter and a menu |

**Spec:** 640×640 source, ship 256×256 (@2x 512). AVIF + WebP.
**Path:** `public/assets/cartridges/<project-id>.*`

### 1.2 OG / social share image (1)

The most-forgotten, highest-leverage asset: it renders every time the link is
pasted into LinkedIn, an email, or a job application.

```
Retro game console and a fanned row of cartridges on a dark desk, dramatic
side lighting, 16-bit poster illustration style, limited palette, cinematic,
generous empty space on the left for text overlay, NO text.
```
Name, one-line pitch, and URL are overlaid in HTML-to-image or in the design
tool, not generated. **Spec:** 1200×630 PNG/JPG. **Path:** `public/og.png`.

### 1.3 Pixel-art portrait (1)

Recruiters want a face; a stylized portrait keeps the theme and avoids a stiff
headshot. Keep a real photo available for LinkedIn parity.

```
16-bit pixel art portrait of a young man, front facing, friendly neutral
expression, short dark hair, simple flat background, limited palette,
clean pixel edges, NO text.
```
**Spec:** 512×512. **Path:** `public/assets/portrait.*`

### 1.4 Favicon (1)

A single cartridge silhouette or a "ZA" sprite mark. **Spec:** 512×512 source →
`favicon.ico` + 180×180 apple-touch-icon + 192/512 PWA icons.

---

## 2. Tier 2 — depth

### 2.1 Title-screen key art (12)

Shown on the CRT when a cartridge loads. Larger and more cinematic than the
label, and deliberately low-contrast so overlaid title text stays readable.

```
16-bit video game title screen key art, [SUBJECT from 1.1], wide cinematic
composition, muted low-contrast palette so text can overlay, subtle scanline
feel, NO text or lettering.
```
**Spec:** 1280×720, ship AVIF/WebP, lazy-loaded. **Path:**
`public/assets/titlescreens/<project-id>.*`

### 2.2 Instruction-manual illustrations

Where the architecture story becomes beautiful. Diagrams are authored as SVG
(crisp, themeable, accessible) with a generated *paper/print texture* behind
them, rather than generating the diagrams themselves. Generated diagrams cannot
be trusted to be technically accurate, and accuracy is the whole point.

- Generate: aged manual paper texture, print grain, staple/fold marks.
- Author by hand: the architecture SVGs (ports and adapters, clean layers, the
  tiled-inference flow, the consent write-path).

### 2.3 Pixel tech icons (~20)

One per stack item (Kotlin, Python, AWS, Vue, Swift…), reused across cartridges,
manuals, and the skills sheet. Generate as one sheet, slice, or source a
consistent open-licence pixel icon set. **Spec:** 64×64 each.

### 2.4 Skills "character sheet" (1)

Your skills laid out as an RPG stat sheet. Frame/parchment generated; all stats
and labels rendered in HTML so they stay accurate and translatable.

---

## 3. Video & motion

**The highest-value video is real, not generated.** Screen recordings are proof;
generated clips are decoration. Priority order:

1. **Real captures** (do these): Recomp Tracker in use, TulipVision detecting
   sprouts on a field photo, Lex-AI refusing an out-of-scope question, the
   Consented Cart merchant dashboard. Short, muted, looping.
   **Spec:** ≤8 s, WebM (VP9) + MP4 (H.264) fallback, ≤1.5 MB each, `poster`
   image, `preload="none"`, lazy, `playsinline`, no audio track.
2. **Coded animation** (no files needed): console power-on for the boot (CRT
   flicker, degauss wobble, logo resolve), cartridge-insert transition,
   title-screen idle shimmer, chatbot typing indicator.
3. **Generated loops** (optional): subtle parallax backdrops behind title
   screens. Use sparingly; they cost weight for little credibility.

All motion honors `prefers-reduced-motion`: static poster frames, no autoplay.

---

## 4. 3D — one hero moment only

**Decision: a single 3D cartridge, built as a Three.js box mesh textured with
the generated label art.** Hover tilts it; clicking slides it into the console
slot and triggers the load. This buys the "wow" for a few KB of geometry, since
the visual richness comes from the texture we already have.

- Library: `three` (+ `@react-three/fiber` if it stays simple).
- Lazy-load the 3D chunk; never block first paint.
- Fallbacks: a static rendered image on mobile, on reduced motion, on
  `save-data`, and on WebGL failure. The site is fully usable without 3D.
- Explicitly out of scope: a modelled console/room scene. Too much weight and
  mobile risk for an AI-systems role, where the payoff is credibility, not spectacle.

---

## 5. Audio — opt-in only

Retro SFX (cartridge select blip, power-on chime, PRESS START confirm).

- **Muted by default. Never autoplay.** A visible speaker toggle in the chrome,
  persisted to `localStorage` (`zk.sound`).
- Tiny files: ≤20 KB each, WebM/Opus + MP3 fallback, preloaded only after the
  user opts in.
- Sourced from an open-licence retro SFX pack or generated; attribute if required.

---

## 6. Asset checklist

Tier 1: 12 cartridge labels · OG image · portrait · favicon set
Tier 2: 12 title screens · manual paper texture · ~20 tech icons · character-sheet frame
Real captures: Recomp · TulipVision · Lex-AI refusal · Consented Cart dashboard
Also needed (not generated): real app screenshots for the manuals, the resume
PDF, and the AWS credential link.
