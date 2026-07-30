# Mobile skills design

Date: 2026-07-28
Status: implemented

## Audit

The skills screen is the pinned sequence's last phase: the About card lifts away
and the stars behind it turn out to have been the skill constellations all
along. It offers a SKY view (a pannable starfield, one constellation per skill
branch) and a LIST view, with a toggle between them.

### The transition is fine

Verified at the reveal: the card dissolves and the stars shine through it. It
reads on a phone exactly as intended. Nothing was changed here.

### The screen is a set of lanes built for a wide frame

The chrome is absolutely positioned at fixed sizes: a legend rail, a proof
panel, a sky-chart minimap, a languages bar, the stage badge and the toggle. On
a phone they land on top of each other.

| | Desktop 1280x800 | Phone 390x844 |
| --- | --- | --- |
| Legend rail width | 15% of screen | **48%** |
| Languages bar height | 74px | **145px** |
| Chrome collisions | none | badge, toggle, rail and languages all overlap |
| Panning to cross the sky | 1.72 screens | **5.97 screens** |

In LIST view the same thing happened: the badge printed over the toggle, and the
languages bar sat directly on top of the list. The list reserved 74px at the
bottom for it, which is the desktop height.

The 316px floor in the list grid (`minmax(316px, 1fr)`) also overflowed a 320px
phone by 36px.

### The sky cannot be made to work at that width

`skyW = max(vpW, vpH * SKY_W / SKY_H)`: the sky is scaled to fill the frame
**height**, so a tall narrow viewport makes it enormous, 2327px inside a 390px
window. It is legible only because it is that big, and being that big means
hunting across six screens to read a skill. Shrinking it to two screens of
travel puts the 10px labels at roughly 4px.

There is no scale that is both readable and traversable on a phone.

### What already worked

This screen was the most touch-aware of the four. Drag panning with
`touch-action: pan-y`, `onClick` on stars and constellation names guarded by
`wasDrag()`, and a wheel handler that routes vertical deltas to the page: the
same problem the cartridge shelf had, already solved here. The LIST view's
content was already good, at full size and readable.

## Design

**Portrait gets the list and nothing else.** The toggle is not rendered, and
neither is the sky: `view === "list" && interactive` already gates the starfield,
so a phone never builds the 2040-unit SVG at all.

The constellation is not lost. The list only mounts once the reveal is nearly
finished (`interactive={skillsP > 0.75}`), so the sky is exactly what the reveal
shows, uncluttered by chrome, and the list takes over once it has landed. The
signature moment survives; the content arrives in the form that can carry it.

**The badge and the languages move into the list's flow.** Both were floating
over it. On a phone the badge's subtitle wraps to three lines, which collides
with the list and spends height a phone does not have, and the languages bar is
content rather than chrome. In flow they scroll with the list, and the list's
padding drops from `78px 0 74px` to `16px 0 28px` because there is nothing left
to leave room for.

Both are extracted as `StageBadge` and `LanguagesRow` so the sky can keep its
floating versions unchanged.

**The grid floor becomes `minmax(min(316px, 100%), 1fr)`.**

The predicate is `portrait`, which is an aspect ratio (taller than 4:3) rather
than a width. A tablet held upright therefore also gets the list. That is
deliberate: at 768 the sky still pans 3.7 screens, and the rail and proof panel
together want 65% of the width.

## Results

| Viewport | Toggle | Sky built | List columns | Collisions | Sideways overflow |
| --- | --- | --- | --- | --- | --- |
| 320x568 | no | no | 1 | none | none |
| 390x844 | no | no | 1 | none | none |
| 430x932 | no | no | 1 | none | none |
| 768x1024 | no | no | 2 | none | none |
| 1280x800 | yes | yes | n/a | none | none |
| 1920x1080 | yes | yes | n/a | none | none |

At 390x844 all 155 text blocks in the list are reachable.

Desktop is unchanged.

## Testing

`tests/e2e/mobile-skills.spec.ts`, at 320, 390 and 430:

- the list is the only view, and the starfield is not built
- no absolutely-positioned block overlaps another
- every skill can be reached and the languages sit at the end of the list
- nothing overflows sideways

Plus: the sky is what the reveal shows at `?seq=0.86` and is gone by `?seq=0.93`,
and a 1280x800 window keeps both the sky and the toggle.

13 of the 14 tests fail on the pre-change code.

## Known limit

A phone visitor never explores the constellation interactively. That is the
point of the change rather than a regression: the alternative was six screens of
panning to read a skill list. If it should ever come back, the workable shape is
stepping between constellations with `focusBranch(bi, true)`, which already pans
to one and centres it, rather than free panning.
