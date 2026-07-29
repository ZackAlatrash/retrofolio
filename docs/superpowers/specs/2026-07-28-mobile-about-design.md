# Mobile About design

Date: 2026-07-28
Status: implemented, except the portrait lap art

## Audit

The About beat is the third phase of the pinned sequence: the view tilts down to
a lap where a handheld is held in both hands, the handheld boots, the camera
pushes into its screen, and the character card resolves inside it.

### Blocking: the card was cut off and unreadable

The card's grid collapses to one column on a narrow viewport, so its natural
height nearly triples. It was scaled to fit with a hard floor of 0.55, which was
not enough, and there was no scroll container to reach the rest.

| Viewport | Card natural height | Cut off |
| --- | --- | --- |
| 390x844 | 2300px | 210px top + 210px bottom |
| 430x932 | 2199px | 139 + 139 |
| 768x1024 | 1936px | 20 + 20 |
| 1280x720 and wider | 831px | none |

At 390x844 fitting the card would have needed a scale of 0.325 against a floor
of 0.55, so it rendered 1265px tall inside an 844px pinned stage. About a third
of it could never be seen, and the prose that did show rendered at an effective
**7.2px**.

This is the résumé copy, which makes it the most valuable content on the site
and, before this, the least reachable.

### Blocking: the handheld's screen was placed against the wrong box

`LAP_SCREEN` is a rect measured as a percentage **of the source art**, but the
art was laid out with `object-fit: cover` on a layer of the viewport's shape.
The two agree on a 16:9 desktop and diverge the moment the art crops.

At 390x844 the 1376x768 art renders 1512px wide, so 26% of its width is visible.
The real screen in the picture spans x = 13 to 376, while the overlay div sat at
x = 148 to 242: **26% of the real screen, centred inside it**. The boot logo,
the backlight and the loading bar all rendered in that strip, and because the
same rect is the camera's zoom target, the dive pushed into the wrong region.

### Not fixed here: the art itself

Cover-cropping to portrait removes the hands entirely, and "held in both hands"
is the whole subject of the shot. During the tilt, where a desktop shows the
room's floor, chair and rug, a phone shows a featureless dark band, because the
room art's detail is all in the sides that get cropped.

Both need portrait-composed art, the same dependency as the hero.

### Already correct

Under `prefers-reduced-motion` About renders as an ordinary scrolling section:
2440px tall, 13px text, no scale transform, no overflow. A working mobile About
already existed in the tree, gated behind a preference.

## Design

### 1. The card scrolls instead of shrinking past readability

Below `CARD_MIN_SCALE` the card is shown at full size and its container scrolls,
the way the project detail screen already does. That pattern is proven on mobile
in this codebase: all seven detail screens scroll comfortably at 3000px+.

`CARD_MIN_SCALE` is 0.7, set just under the tightest desktop case. A 1280x720
laptop needs 0.75 and therefore still scales exactly as before, so only the
viewports that were genuinely cut off change behaviour, and every one of those
is a phone or a small tablet.

**Chaining is the handoff.** `overscroll-behavior` is deliberately left at its
default. Read to the end of the card and the next push carries on into the
constellation, exactly as it would without the card. Setting `contain` here
would trap the visitor in the card with no way onward.

The card is only interactive once `cardIn > 0.6`, so during the dive the page
scroll still drives the camera; the card takes over only once it has resolved.

### 2. The art gets a box of its own aspect

The lap art, the screen overlay and the screen's glow now live inside a wrapper
sized to cover the layer while keeping the art's aspect ratio:

```
width: max(100%, calc(100vh * <art aspect>));
aspect-ratio: <art width> / <art height>;
```

Everything positioned by `LAP_SCREEN` percentages is inside that box, so the
screen, its glow and the camera's zoom target all track the picture when it
crops rather than sliding off it. No measurement, no resize handler.

`LAP_ART` records the source dimensions next to `LAP_SCREEN`, since the two are
only meaningful together.

### 3. Smaller corrections

- The card's header row (`// PLAYER 01 · ABOUT` and `AVAILABLE FROM SUMMER
  2026`) wraps instead of colliding. Two pixel-font labels do not survive a
  phone's width on one row.
- The portrait's affordance label reads `DRAG` on touch instead of `HOVER`. The
  effect runs off `pointermove`, which a finger produces too, so only the word
  was wrong.

## Results

| Viewport | Scale | Scrolls | Prose | Blocks reachable |
| --- | --- | --- | --- | --- |
| 390x844 | 1 | yes | 13px | 39/39 |
| 430x932 | 1 | yes | 13px | 39/39 |
| 768x1024 | 1 | yes | 13px | 39/39 |
| 1280x720 | 0.75 | no | 9.8px | 39/39 |
| 1280x800 | 0.85 | no | 11px | 39/39 |
| 1920x1080 | 1 | no | 13px | 39/39 |

Desktop is unchanged.

## Testing

`tests/e2e/mobile-about.spec.ts` covers, at 320, 390, 430 and 768:

- every block of the card can be brought into view
- the prose renders at 12px or more
- the screen overlay agrees with the art's own screen rect, within 1.5px
- a 1280x720 window still scales to fit rather than scrolling

11 of its 12 tests fail on the pre-change code. The reachability assertion is
that the *start* of every block can be brought into view, not that a block fits
on one screen: at 320x568 the profile paragraph alone is 786px tall and never
could.

## Known limits

- The portrait lap art is still outstanding, so the hands remain cropped and the
  tilt still passes through an empty band on a phone.
- The help button floats over the scrolling card, as it does over any scrolling
  content. Inherent to a persistent floating control rather than specific to
  this beat.
