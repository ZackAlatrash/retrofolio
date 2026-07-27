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

## Changed during implementation

Two things the design got wrong, both found by measuring.

**The swipe rack is gated on touch, and hover-capable narrow windows wrap
instead.** A container with `overflow-x: auto` and nothing to scroll vertically
also absorbs vertical wheel deltas, so on a narrow desktop window a mouse scroll
over the shelf dragged the rack sideways instead of advancing the pinned
sequence. Touch has no such fallback: a pan is resolved to one axis. So
`swipes = overflows && hoverless` and `wraps = overflows && !hoverless`; the
wrapping layout reaches the same cartridges by other means. This is why
`rackMetrics` returns both a fractional `visible` (for the peek) and an integer
`cols` (for the rows).

**The rack must be measured from the cabinet's content box, not its width.** The
cabinet carries a 2px border, so the rack has 4px less than the cabinet is wide.
Passing the border-box width cost a whole column: three cartridges needed 346px
where only 342px existed, so the row wrapped at two. `CABINET_BORDER` is now a
named constant used by both the geometry and the border itself.

Also added: `?touch` forces the hoverless path. A desktop browser reports
`(hover: hover)` at any window size, so without it the touch shelf could not be
looked at or tested anywhere but a real device. Touch target sizes hang off a
`data-touch` attribute on the document root, set from the same flag, for the
same reason.

## Revision: one scrolling row everywhere

The shelf now scrolls on every device rather than wrapping on hover-capable
ones, because wrapping does not survive the library growing.

**Why.** The station has a fixed height budget inside the pinned viewport, so a
second row of cartridges is paid for out of the television. Measured at
1280x720 with only seven projects, the shelf already wrapped to 6 + 1, and that
single orphan cartridge cost the set 14% of its width: 396px against a natural
462px. Modelled forward, wrapping reaches four rows at twenty projects on a
720p laptop. One scrolling row costs the same height at seven projects as at
forty, so the television's size stops depending on how much work has been
shipped. After the change the same viewport shows one row of seven and a 444px
television.

**The wheel problem is handled, not avoided.** A non-passive `wheel` listener on
the rack forwards dominant-vertical deltas to the page and leaves
dominant-horizontal ones to the rack. Plus `‹ ›` arrows and Left/Right keys for
a mouse, which cannot pan. The arrows are hidden on touch, where a finger can
pan directly and they would sit on top of the cartridges they exist to reach.

**Cartridges are sized to a target, not crammed.** `TARGET_CART_W` decides how
many fit; a scrolling shelf has no reason to shrink cartridges to squeeze in one
more. At 1280x720 they went from 98px to 109px.

**Three implementation details that only surfaced by testing:**

- Native `scrollBy({ behavior: "smooth" })` does not reliably run under
  `scroll-snap-type: mandatory`. The arrows animate with the file's own rAF
  `tween` instead, which also inherits its finish-instantly-in-a-hidden-tab
  behaviour. Snap is suspended for the duration or it fights the tween.
- The last cartridge snaps to `end`, not `start`. The shelf's final scroll
  position is not a "start" snap point for anything, so mandatory snapping
  dragged it back and the last cartridge could never be fully reached.
- Rounding a scroll target to the nearest pitch stops short of both ends
  (179 rounds to 120 at a 120 pitch), after which every further click computes
  the same target and does nothing. Both ends are now taken as-is.

**A "now selected" strip was built and removed.** The intent was to say in words
what the shelf never said. It turned out to duplicate the CRT splash exactly:
same name, same genre, same headline, and the television says it larger. The
~42px went back to the television instead.

**The position indicator is a bar, not dots.** Seven dots beside seven
cartridges reads as "which one is selected" rather than "how far along am I",
and dots stop working at all once the library is long enough for them to blur
together.

## Known limit

Genuine touch axis-arbitration inside a pinned sticky sequence only proves itself
on a real device. The rack is built so the failure mode is benign: the page still
scrolls, the rack simply does not capture. It wants a check on a physical phone
before this is called done.
