# Portfolio — Design System

Last updated: 2026-07-15
Refines: DESIGN.md §3, §6 (ThemeEngine), §12

The visual language is "a real terminal, done tastefully." Monospace, generous
line-height, restrained motion, and switchable authentic color themes. Nothing
neon, nothing that flashes. The terminal is the product; the chrome around it is
near-invisible.

---

## 1. Layout

- Single centered column, max content width ~880px, comfortable side padding.
- The terminal window has the familiar three-dot title bar and a titled prompt.
- Vertical rhythm in `rem`; component-internal gaps in `px`.
- Mobile: the terminal fills the width, font scales down one step, command chips
  wrap. Everything remains tap-friendly (min 40px targets).

## 2. Typography

- **Mono everywhere in the shell:** a crisp programming font stack, e.g.
  `"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, monospace`.
  Ligatures off by default (a `ligatures on` easter-egg command is fine).
- Base terminal size 14px desktop / 13px mobile, line-height ~1.65.
- Deep case-study long-form body may use a slightly larger mono or a readable
  sans for multi-paragraph prose, decided during build; default is mono for
  identity, sans only if readability testing demands it.
- Sentence case for all UI labels and headings. No ALL CAPS except an optional
  ASCII banner logo.

## 3. Theme model

A theme is a small token set. `ThemeEngine.setTheme(name)` writes these as CSS
custom properties on `:root` and persists `name` to `localStorage`
(`zk.theme`). The confirmed default mood is dark, terminal-authentic: default to
`tokyo-night`. On load, read the stored value first; if none, use `tokyo-night`
(a returning visitor who chose `paper` keeps it). The theme switcher lets any
visitor move to `paper` (light) or another palette at any time.

Token contract (every theme must define all of these):

```
--term-bg          terminal background
--term-fg          default foreground text
--term-dim         de-emphasized text (hints, timestamps, paths)
--term-accent      primary accent (prompts links, project names)
--term-green       success / prompt symbol / "deployed" status
--term-amber       warning / titles / "beta" status
--term-red         errors / "command not found"
--term-cite        citation chips + retrieval highlights (distinct hue)
--term-selection   text selection background
```

Contrast: `--term-fg` on `--term-bg` must meet WCAG AA for body text in every
shipped theme. `--term-cite` must be visibly distinct from `--term-accent` so
citations read as their own thing.

## 4. Launch theme set (proposed)

Authentic, recognizable terminal palettes. Ship these; more can be added later
since a theme is just one token block.

| name           | mode  | vibe |
|----------------|-------|------|
| `tokyo-night`  | dark  | default; calm blue/purple |
| `dracula`      | dark  | high-recognition purple/pink |
| `gruvbox`      | dark  | warm retro |
| `nord`         | dark  | cool muted |
| `catppuccin`   | dark  | soft pastel (mocha) |
| `paper`        | light | high-contrast light, accessibility-friendly default for light mode |

Reference values used in the mockup (tune during build for AA):

```
tokyo-night: bg #1a1b26  fg #a9b1d6  dim #565f89  accent #7aa2f7
             green #9ece6a  amber #e0af68  red #f7768e  cite #bb9af7
dracula:     bg #282a36  fg #f8f8f2  dim #6272a4  accent #bd93f9
             green #50fa7b  amber #f1fa8c  red #ff5555  cite #ff79c6
gruvbox:     bg #282828  fg #ebdbb2  dim #928374  accent #83a598
             green #b8bb26  amber #fabd2f  red #fb4934  cite #d3869b
nord:        bg #2e3440  fg #d8dee9  dim #4c566a  accent #88c0d0
             green #a3be8c  amber #ebcb8b  red #bf616a  cite #b48ead
catppuccin:  bg #1e1e2e  fg #cdd6f4  dim #6c7086  accent #89b4fa
             green #a6e3a1  amber #f9e2af  red #f38ba8  cite #cba6f7
paper:       bg #f6f5ee  fg #33322c  dim #8a887e  accent #1d6fa5
             green #3b6d11  amber #a5670b  red #b3261e  cite #6a3fb0
```

## 5. Optional CRT / scanline toggle

`crt on|off` command and a settings toggle. Adds a subtle scanline overlay and a
faint flicker. Off by default (professional first impression). Disabled entirely
under `prefers-reduced-motion`.

## 6. Motion

See MOTION-VISUALS.md for the full scroll-narrative motion system (GSAP
ScrollTrigger, the scroll-built pipeline, count-ups, reduced-motion). Terminal-
local motion below.

- **Boot sequence:** a short, skippable cinematic boot (`./launch-portfolio`) that
  renders into the scroll site. Skips instantly on reduced-motion or on a second
  visit (respect returning users). Full spec in MOTION-VISUALS.md §2.
- **Cursor:** blinking block cursor at the prompt; steady under reduced-motion.
- **Command output:** appears with a 120ms fade/slide; instant under
  reduced-motion.
- **Scroll reveals** on deep case-study sections: gentle, once, never parallax.
- Target 60fps; no animation blocks input. Typing is always immediately
  responsive even mid-boot (input is live; boot animation is skippable).

## 7. Status badges

Small mono pills used in project views, colored by `--term-green/amber/accent`:

- `deployed` (green) — Omnipotence, TulipVision
- `beta` (amber) — Recomp Tracker
- `live` (green) — Kukis
- `adopted` (accent) — TulipVision (university), Omnipotence (company-wide)
- `academic` / `personal` (dim) — neutral context tags

Never rely on color alone; the word carries the meaning.

## 8. ASCII / schematic diagrams

Deep case studies include an in-terminal ASCII architecture diagram (on brand,
lightweight) that can expand into a cleaner boxed schematic. Keep diagrams to
2–3 color roles max (accent + dim + one status color). Diagrams must have a text
description for screen readers.

## 9. Iconography

Minimal. Prefer text and glyphs native to a terminal (`$`, `~`, `>`, `✓`, `✗`,
`»`). If UI icons are needed (external-link, download), use a single outline set,
sized 16–18px, inheriting color.

## 10. Component states to design explicitly

- Prompt: idle, focused, typing, disabled (during a streaming answer).
- Command chip: default, hover, active, focus-visible.
- Chat answer: streaming, complete-with-citations, refusal, error, rate-limited.
- Theme switcher: current selection clearly marked.
- Project view: deep (full), card (compact), loading (if lazy-loaded).
