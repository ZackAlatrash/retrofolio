# Mobile hero design

Date: 2026-07-27
Status: approved, not yet implemented (blocked on new art)

## Problem

The pinned sequence's first phase draws a 96-frame WebP sequence cover-fit to a
canvas ([TitleLibrary.tsx](../../../src/screens/TitleLibrary.tsx) `draw`). The
frames are 1280x720. On a 390x844 phone the cover scale is driven by height
(1.172x), so the frame renders 1500px wide into a 390px window: **26% of the
frame's width is visible**.

That matters more than a normal crop would, because the art *is* a CRT
television with a bezel. On desktop the whole set is in frame. On a phone the
bezel is cropped away entirely and the opening vortex reads as the corner of a
swirl rather than a swirl.

Three further problems, measured:

- **Payload.** 96 frames x ~68 KB = 6.5 MB, and all 96 are requested on mount
  (confirmed in the network log). Fully decoded that is ~354 MB of bitmaps. iOS
  Safari evicts under that pressure, which is what the `pickImage` neighbour
  search is quietly absorbing today.
- **Scroll length.** `SCRUB_VH = 220` is 2.2 screen-heights for the title alone;
  `CONTAINER_VH` is 1270vh, about 10,700px on a phone.
- **Text.** The title is already at its clamp floor (20px) at 390px, and the
  footer clips at the right edge where it also collides with the help FAB.

The aspect gap is the governing constraint: 16:9 into 9:19.5 is a 3.9x
mismatch, so **no zoom level both fills a phone screen and keeps the television
intact**. Contain gives a band 26% of the screen height; a 62%-width crop gives
42% but loses the bezel. Neither is good. The source art is re-renderable, so
the answer is portrait-composed art rather than damage control on landscape art.

## Design

### 1. Portrait art set

Render at **9:21 aspect** with the television composed inside the central
**9:16 safe box**.

The ordering is deliberate. Because the art is taller than the tallest phone,
cover-fit is driven by width on every device from 9:16 through 9:21, so the set
is never clipped horizontally and the crop only ever eats ambient room above and
below. Rendering at exactly 9:19.5 would clip the television sideways on a
20.5:9 Android.

### 2. Payload budget

Starting point: **540x1260, 32 frames, AVIF with WebP fallback**, targeting
**<= 1.2 MB** against today's 6.5 MB.

Resolution is the biggest lever and the cheapest to give up: the picture is
pixel art behind a CRT scanline overlay, so 540 wide on a 2x phone reads as
grain rather than blur.

The trade to watch is scrub density. Desktop advances a frame every ~20px of
scroll. 32 frames over a 110vh scrub is ~29px per frame. If that reads as
steppy on a device, **frames are the knob, not resolution**.

### 3. Loading order

Keep the eager-decode structure, change the fetch order: request every 4th frame
first (8 frames, ~300 KB), then backfill.

`pickImage`'s neighbour search already tolerates missing frames by design, so
this needs no new fallback machinery. It turns an existing safety net into the
intended loading strategy.

### 4. Viewport-aware timeline

Convert [sequence.ts](../../../src/showcase/sequence.ts) from constants to a
profile function plus a `useSequence()` hook returning the same shape. Both
consumers ([useGameRoute.ts](../../../src/game/useGameRoute.ts) and
`TitleLibrary`) read the hook. No test imports the module today, so the refactor
is contained to those two files.

Selection is by **aspect ratio, not width** (`innerWidth / innerHeight < 0.75`),
which handles rotation and keeps landscape phones on the desktop treatment.

The mobile profile shortens `SCRUB_VH` from 220 to ~110.

This preserves the invariant in CLAUDE.md that S1-S4 derive from the phase
heights in exactly one place.

**Edge case:** rotating mid-sequence changes the container height. The profile
switch must preserve progress `p` by adjusting `scrollY`, or the visitor is
thrown to a different point in the timeline.

### 5. Text

With full-bleed portrait art the title block stays overlaid. Two fixes:

- The footer wraps to two lines instead of clipping.
- The footer clears the help FAB (bottom padding on the footer, or the FAB
  shifting up while the title screen is showing).

### 6. Viewport units

Move the sticky stage and the phase heights from `vh` to `svh`/`dvh`, so the
collapsing mobile URL bar stops shifting the pinned math mid-scrub.

### 7. Reduced motion

`ReducedTitleLibrary` uses `posterUrl`, so the portrait set needs its own
poster. Reduced motion and mobile stay **separate paths**: a phone user who has
not asked for reduced motion still gets the scrub.

## Testing

- Unit: the sequence profile boundaries. S1-S4 still derive correctly under both
  profiles, and each profile's phases sum to 1.
- Playwright: the aspect switch preserves scroll position.

## Open until measured

- Whether 32 frames is enough at the shortened scrub length.
- Whether 540px wide holds up on a 3x screen.

Both are cheap to retune once a real set exists.

## Dependency

This spec cannot be implemented until the portrait frame set is rendered. The
parts that do not depend on new art (the sequence profile refactor, `svh`/`dvh`,
the footer and FAB fixes, windowed loading) can land first.
