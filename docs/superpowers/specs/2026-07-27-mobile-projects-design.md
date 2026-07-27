# Mobile projects section design

Date: 2026-07-27
Status: approved

## Audit

Measured against the running dev server at a range of viewports. The station is
the pinned sequence's second phase: a television, a console, and a shelf of 7
cartridges ([TitleLibrary.tsx](../../../src/screens/TitleLibrary.tsx),
[Cartridge.tsx](../../../src/showcase/Cartridge.tsx)).

### Blocking

**1. The shelf overflows every viewport under 700px.**

The shelf is `gridTemplateColumns: repeat(showcase.length, 1fr)`. `1fr` means
`minmax(auto, 1fr)`, so each column's floor is its own min-content, and
min-content here is the name tag, which is `whiteSpace: nowrap`. The grid
therefore has a hard 553px minimum and never shrinks. Nothing scrolls
horizontally: `document.scrollWidth` always equals the viewport.

| Viewport | Cabinet | Grid | Overflow | Unreachable from shelf |
| --- | --- | --- | --- | --- |
| 320x568 | 269 | 553 | 288px | lex-ai, tulipvision, locked-in, kukis |
| 360x640 | 302 | 553 | 255px | tulipvision, locked-in, kukis |
| 390x844 | 328 | 553 | 229px | tulipvision, locked-in, kukis |
| 430x932 | 361 | 553 | 196px | tulipvision, locked-in, kukis |
| 600x1024 | 504 | 554 | 54px | kukis |
| 700x1024 | 588 | 584 | 0 | none |
| 768x1024 | 645 | 641 | 0 | none |

Those projects are not wholly lost: a visitor can open a visible cartridge and
press NEXT through to them. But nothing on screen indicates they exist, and they
cannot be reached from the shelf by touch at all.

**2. Landscape shows zero cartridges.** At 844x390 the cabinet's bottom sits
156px below the viewport. The visitor sees a television and a console and no
shelf, with no indication the section has projects.

**3. A dead-tap window of roughly 220px of scrolling.** `boot()` requires the
pull-back to be >= 90% complete, but cartridges reach full opacity at 70%
(`settle = smooth(t, 0.5 + i*0.02, 0.7 + i*0.02)`). Measured, one data point per
fresh page load:

| Pull-back progress | Tap result |
| --- | --- |
| 0.50 | nothing |
| 0.70 | nothing |
| 0.85 | nothing |
| 0.92 | boots |

On desktop the hover lift still gives feedback. On touch it is a silent dead
zone.

**4. Eject throws the cartridge off-screen.** `popOut` measures
`cartEl.getBoundingClientRect()` to arc the flying clone home. When the target is
off-screen the clone flies off with it. Sampled during a real KUKIS eject at
390px: the clone travelled from cx=195 to **cx=543**, 153px past the right edge,
and vanished.

### Significant

- **Cartridges render at different sizes** (53px to 86px wide at 390px), with
  name tags at staggered heights. Same `1fr` root cause: the plaque text sets
  the column width.
- **No hover means no preview.** Selection is `onMouseEnter` only, so on touch
  the first tap goes straight to boot and the television never previews. The
  caption still reads "HOVER A CARTRIDGE".
- **Touch targets.** PREV, NEXT and EJECT are 29px tall. Every detail screen has
  3-8 controls under 44px. The EvidenceGate slider is a 16px drag target.
- **Module headers wrap badly below ~420px.** `PanelHead` (and two inline copies
  in `SystemMap`) put a title and a `flex: 1` subtitle on one row. With no
  flex-basis the subtitle shrinks to min-content and stays inline as a ragged
  narrow column instead of wrapping. Worst in `CoachBoundary`.
- **SystemMap breaks long identifiers mid-word**: "OllamaRouterAutho / r",
  "QueryEmbeddingSer / vice".
- **`.stage-node:hover` and `.coach-chip:hover`** are not behind a hover media
  query, so they latch on after a tap.

### What already works

The detail overlay is solid on mobile. All seven screens show **zero**
horizontally-overflowing elements and zero horizontal scroll at 390px.
`.detail-grid` already collapses to one column below 780px. Every signature
module renders legibly, and both drag interactions are native
`<input type="range">`, so touch works with no changes.

The reduced-motion shelf already uses `repeat(auto-fit, minmax(110px, 1fr))` at
`min(680px, 96vw)` and wraps correctly. The motion path simply never received
the same treatment.

## Design

### 1. A much bigger television

`endW = Math.min(0.56 * W, ...)` pins the television to just over half the
viewport width. That 0.56 is a desktop framing choice, so the room reads around
it. It becomes a profile value at **~0.96 on portrait**.

At 390x844:

| | Now | After |
| --- | --- | --- |
| Television | 218 x 178 | 374 x 305 |
| Glass (the picture) | 179 x 134 | 307 x 229 |
| Station height | ~400 of 844 (47%) | ~600 of 844 (71%) |

The glass carries the splash art and the boot card, so it going from 179px to
307px wide is the point of the change. The `dive` transition improves for free,
since it computes its zoom from the glass rect.

### 2. Station fit-scale

In landscape the height term binds instead, and the station is still 156px too
tall. So the station takes a measured uniform scale against available height,
`min(1, availableH / naturalH)`.

This guarantees fit everywhere, and it is what allows the portrait television to
be sized aggressively rather than conservatively to avoid clipping. There is
precedent in the file: the About card already measures itself and scales down
when it exceeds the viewport.

### 3. Uniform cartridges

Drop fractional tracks. Each cartridge becomes `flex: 0 0 <fixed px>`, so all
cartridges are identical by construction and the plaque text can no longer
influence layout. The name tag gets `max-width: 100%` with ellipsis so a long
plaque truncates instead of pushing.

### 4. Swipe rack

The shelf becomes a horizontal `overflow-x: auto` rack with
`scroll-snap-type: x mandatory` and `scroll-snap-align` per cartridge.

At 390px the cabinet's inner width is 346px, so a 91px cartridge on a 99px pitch
shows 3.5 at a time. The half-cartridge at the right edge is the affordance that
says there are more.

Two details that matter:

- `overscroll-behavior-x: contain`, or a horizontal swipe near the left edge
  triggers iOS back-navigation.
- **No `touch-action: pan-x`** on the rack. The rack is a wide band across the
  screen and visitors will start vertical page scrolls on it; the browser's own
  axis arbitration is what we want.

Discovery: wrapping would have shown all 7 at once, swiping shows 3.5, so the
peek does real work. Add a position indicator under the rack. The caption
changes to carry both the swipe affordance and the two-tap model.

### 5. Two-tap selection

Gate on `matchMedia('(hover: none)')` rather than width or user-agent. That is
the capability actually in question, and it matches the
`@media (hover: hover) and (pointer: fine)` predicate already used in
`index.css`.

On touch: `onClick` selects when the cartridge is not the current selection, and
boots when it is. Hover-capable devices keep today's `mouseenter` then `click`
path untouched.

Keyboard already works out: `onFocus` selects, so by the time Enter fires the
cartridge is the selection and Enter boots it.

### 6. No silent taps

The settle guard is wrong, not just unfriendly: cartridges must not look ready
20% of the phase before they are. Move the guard down to match when the shelf
actually looks usable, since that is what the visitor responds to. `boot()`
falls through to selecting rather than returning, so a tap is never a no-op.

### 7. Eject with a scrolled rack

`popOut` must scroll the target cartridge into view within the rack (instantly)
before measuring, and keep an on-screen guard as a fallback that fades the clone
home rather than flying it off-screen.

### 8. Detail screen polish

- `BarButton` and the in-module controls get a 44px minimum touch target.
- `PanelHead`'s subtitle gets a flex-basis so it wraps to its own line instead of
  shrinking to min-content. Same fix for the two inline copies in `SystemMap`.
- `SystemMap` stops breaking identifiers mid-word.
- The detail hero gradient starts higher on narrow viewports, where the wrapped
  genre and description climb into the bright part of the artwork.
- `.stage-node:hover` and `.coach-chip:hover` move behind `@media (hover: hover)`.

## Testing

- Playwright at 390px: every `[data-cart-id]` has `right <= innerWidth`. This is
  the exact check that surfaced the bug and it fails on the current build.
- Playwright: the swipe rack scrolls and snaps, and a vertical scroll starting
  over the rack still moves the page.
- Unit: the layout profile (television width factor, cartridge sizing, columns).
- Unit: two-tap selection logic under `(hover: none)`.

## Known limit

Genuine touch axis-arbitration inside a pinned sticky sequence only proves itself
on a real device. The rack is built so the failure mode is benign: the page still
scrolls, the rack simply does not capture. It wants a check on a physical phone
before this is called done.
