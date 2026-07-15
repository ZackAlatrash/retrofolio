# Portfolio — Motion & Visuals Spec

Last updated: 2026-07-15
Refines: DESIGN.md §1, §3, §8, §9; DESIGN-SYSTEM.md §6
Resolves: "make it appealing for recruiters who don't know CLI."

The default experience is a modern, animated, image-rich scroll site (recruiter
first). The terminal is a signature layer on top, not the price of entry. This
doc defines how the site looks and moves, and how backend/AI projects with no
pretty UI are made genuinely visual.

---

## 1. The resolving principle: progressive disclosure

- **Layer 0 — default:** a polished scroll narrative. No typing required. Images,
  device mockups, animated diagrams, count-up metrics, the live chatbot.
- **Layer 1 — power user:** a real command palette (`Cmd/Ctrl-K`, or the backtick
  key) that drives the same content, plus the boot sequence and easter eggs.
- **Layer 2 — the chatbot:** always-available grounded `ask`.

Nobody is locked out; nobody is bored. The CLI adds delight without being a wall.

## 2. Chosen model: D (boot into scroll site + command palette)

1. **Boot sequence** on first load: a short, skippable cinematic terminal boot
   (types `./launch-portfolio`, a couple of init lines, a progress tick) that
   then "renders" into the full scroll site. ~1.5-2.5s, with a persistent
   `[skip]` control. Skipped automatically on return visits and under
   `prefers-reduced-motion`.
2. **Default view:** the animated scroll portfolio (this doc).
3. **Command palette:** `Cmd/Ctrl-K` or backtick opens a real terminal/palette
   overlay. Commands (COMMANDS.md) navigate by scroll-animating to the relevant
   section, or open the chatbot. It is a genuine command layer, not decoration.
4. **Default mood:** dark, terminal-authentic (tokyo-night default from
   DESIGN-SYSTEM.md §4). The theme switcher still lets any visitor go light
   (`paper`) or pick another palette; choice persists.

## 3. Page = a scroll narrative (section order)

A guided, GSAP-paced walk-through (the Awwwards "guided walk, not a grid"
pattern), each section a scene:

1. **Hero** — typewriter `$ whoami`, name, one-line positioning, subtle docked
   `ask` bar and a `⌘K` hint. Background is a restrained animated field (see §7).
2. **Proof strip** — count-up metrics (3 RAG systems, ~65k LOC, ~1,300 tests,
   9/10, AWS-deployed) that animate when scrolled into view.
3. **Signature: the RAG pipeline** — the pinned, scroll-built Omnipotence
   six-stage pipeline (§5). The centerpiece animation.
4. **Selected work** — the 6 deep projects as full scenes: device mockups /
   dashboards / diagrams, scroll reveals, per-project metric counters. Optional
   horizontal-scroll gallery for screenshots.
5. **The rest** — the 6 concise project cards in a bento/grid with hover motion.
6. **Skills** — grouped, with a light reveal.
7. **The chatbot** — a full interactive `ask` block (the live demo).
8. **Contact** — email, GitHub, LinkedIn, resume download.

## 4. Motion system

- **Scroll engine:** GSAP + ScrollTrigger for pinned, scrubbed, step-built
  sequences (the pipeline, any build-as-you-scroll diagram). This is the
  research-backed standard for scrollytelling.
- **Smooth scroll:** Lenis (or GSAP ScrollSmoother) for a premium feel. Optional;
  must degrade to native scroll gracefully.
- **Component reveals:** Framer Motion or IntersectionObserver + CSS for simpler
  fade/slide/scale-in on enter. Reveal once, never re-trigger jitter.
- **Count-ups:** eased integer count animation on first in-view.
- **Budgets:** target 60fps on a mid-range phone. No animation blocks input or
  scroll. No parallax on text. GPU-friendly transforms/opacity only.
- **Reduced motion:** `prefers-reduced-motion` disables the boot, typewriter,
  pinning/scrub, count-ups, and background motion; all content renders
  immediately in final state. This path is a first-class requirement, tested.

## 5. The signature animation: scroll-built RAG pipeline

The one animation to get perfect. As the user scrolls through a pinned section,
the Omnipotence pipeline assembles stage by stage:

`query -> route to repos -> hybrid retrieve (kNN + BM25) -> LLM relevance filter
-> cross-encoder rerank -> cited answer`

- Each stage fades/slides in on its scroll beat, with a one-line caption of what
  it does.
- A token/box visibly "flows" through the completed stages.
- The final stage highlights in the success color and shows a sample citation.
- Reduced-motion: the full diagram is shown statically with all captions.
- Reused (smaller, non-pinned) for other architecture diagrams.

## 6. Making backend/AI projects visual (the real constraint)

Research is explicit: for backend/AI, diagrams + metrics + live demos beat
screenshots. Per project, choose from this toolkit so nothing looks empty:

| Project | Primary visual |
|---------|----------------|
| Omnipotence | Scroll-built 6-stage pipeline + AWS deployment diagram (ECS/Bedrock/OpenSearch/Lambda) |
| Recomp Tracker | Phone device mockups (real screenshots) + a diagram of the deterministic AI boundary |
| Consented Cart | Browser-framed dashboard screenshot + the schema-level consent flow diagram |
| Lex-AI | Streamlit screenshot + an animated "evidence gate" (confidence bar crossing the threshold, answer vs refusal) |
| TulipVision | Annotated tulip detection image (boxes + counts) + the tiled-inference diagram |
| Locked IN | iOS device mockups + the 4-layer architecture diagram |
| Card-tier | One clean image or motif each; Kukis can embed its live scroll-scrub hero |

Supporting visual devices:
- **Device frames** (phone/laptop/browser chrome) around real screenshots.
- **Syntax-highlighted code snippets** as artifacts: a boundary test, the
  evidence-gate function, the deterministic-AI guard.
- **Animated diagrams** for abstract concepts (embeddings, hybrid retrieval).
- **The live chatbot** as the interactive proof.

Asset gap to fill before build: collect real screenshots for Recomp Tracker,
Locked IN, Consented Cart, TulipVision, Lex-AI, and the dashboards. Where a
screenshot cannot be shared, a diagram or code artifact stands in. Never fake a
screenshot.

## 7. Hero background (restrained)

A subtle technical motif, not a gimmick: e.g. a faint animated grid, a slow
drift of embedding-like points, or a gentle scanline. Low contrast, low CPU,
paused under reduced-motion, and never competing with the text. The CRT toggle
(DESIGN-SYSTEM.md §5) can intensify it for fun, off by default.

## 8. Performance & accessibility guardrails

- Images: responsive `srcset`, lazy-loaded below the fold, width/height set to
  avoid layout shift, modern formats (AVIF/WebP).
- Lighthouse target: 90+ performance and accessibility on mobile.
- All motion honors reduced-motion. All interactive palette/chips are real
  buttons. `aria-live` for chatbot and command output.
- The site is fully readable and navigable with animation entirely disabled.

## 9. Build order implication

The scroll narrative and the pipeline animation are core, not polish. Sequence:
content model + static sections first (works with zero JS), then layer motion,
then the boot + command palette, then wire the chatbot. Each layer degrades
gracefully to the one below.
