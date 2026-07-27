import { useEffect, useState } from "react";

/**
 * Viewport capabilities the station's layout depends on.
 *
 * Both are media queries rather than width thresholds on purpose:
 * - `portrait` is an aspect ratio, so a rotated phone stops being portrait
 *   without us guessing at device widths.
 * - `hoverless` is the capability actually in question when deciding whether a
 *   tap needs a selection step of its own. It matches the
 *   `(hover: hover) and (pointer: fine)` predicate index.css already uses.
 */
export interface LayoutProfile {
  portrait: boolean;
  hoverless: boolean;
  /** The television's width as a fraction of the viewport. */
  tvWidthFactor: number;
}

/** Taller than 4:3. Every phone held upright, no desktop window. */
const PORTRAIT = "(max-aspect-ratio: 3/4)";
const HOVERLESS = "(hover: none)";

/**
 * On a desktop the television takes just over half the width so the room reads
 * around it. On a phone there is no room to read: the set has to carry the
 * frame, so it goes very nearly full-bleed.
 */
const TV_WIDTH_DESKTOP = 0.56;
const TV_WIDTH_PORTRAIT = 0.96;

const matches = (q: string) =>
  typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(q).matches;

/**
 * `?touch` forces the hoverless path. A desktop browser reports
 * `(hover: hover)` whatever size its window is, so without this the touch
 * shelf cannot be looked at, or tested, anywhere but a real device.
 */
const forcedTouch = () =>
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("touch");

const read = (): LayoutProfile => {
  const portrait = matches(PORTRAIT);
  return {
    portrait,
    hoverless: matches(HOVERLESS) || forcedTouch(),
    tvWidthFactor: portrait ? TV_WIDTH_PORTRAIT : TV_WIDTH_DESKTOP,
  };
};

/** SSR-safe, and re-reads on rotation. */
export function useLayoutProfile(): LayoutProfile {
  const [profile, setProfile] = useState<LayoutProfile>(read);

  useEffect(() => {
    if (!window.matchMedia) return;
    const queries = [window.matchMedia(PORTRAIT), window.matchMedia(HOVERLESS)];
    const onChange = () =>
      setProfile((prev) => {
        const next = read();
        return prev.portrait === next.portrait && prev.hoverless === next.hoverless
          ? prev
          : next;
      });
    onChange();
    queries.forEach((q) => q.addEventListener?.("change", onChange));
    return () => queries.forEach((q) => q.removeEventListener?.("change", onChange));
  }, []);

  // Published to the document so stylesheets can size touch targets off the
  // same flag the components use, `?touch` included. A bare
  // `@media (pointer: coarse)` would be untestable anywhere but a real device.
  useEffect(() => {
    const root = document.documentElement;
    if (profile.hoverless) root.dataset.touch = "1";
    else delete root.dataset.touch;
  }, [profile.hoverless]);

  return profile;
}

/**
 * How the cartridge rack divides up the cabinet.
 *
 * Cartridges are sized in pixels rather than fractions so that every one is
 * identical: with `1fr` (which is `minmax(auto, 1fr)`) each column's floor is
 * its own name tag, so a long plaque made a wider cartridge and the shelf could
 * not shrink below the sum of its labels.
 *
 * The shelf is one row that scrolls, never several rows that wrap. The station
 * has a fixed height budget inside the pinned viewport, so a second row is paid
 * for out of the television: at 1280x720 a single orphan cartridge on row two
 * cost the set 14% of its width. One scrolling row costs the same height at
 * seven projects as at forty, which is what keeps the television's size stable
 * as the library grows.
 */

/** The size a cartridge wants to be. Fewer, larger beats more, smaller. */
export const TARGET_CART_W = 104;
/** Past this they stop reading as cartridges on a shelf and start as posters. */
export const MAX_CART_W = 120;

export interface RackMetrics {
  /** Fixed cartridge width in px. */
  cartW: number;
  /** Cartridge width plus one gap: the scroll-snap pitch. */
  pitch: number;
  gap: number;
  pad: number;
  /** Fractional when the shelf scrolls, so the next cartridge peeks. */
  visible: number;
  /** The shelf cannot show every cartridge at a readable size. */
  overflows: boolean;
}

export function rackMetrics(cabW: number, count: number): RackMetrics {
  const pad = Math.max(14, cabW * 0.03);
  const gap = Math.max(8, cabW * 0.016);
  const inner = Math.max(0, cabW - pad * 2);
  const atTarget = Math.floor((inner + gap) / (TARGET_CART_W + gap));
  const overflows = atTarget < count;

  if (!overflows) {
    // They all fit: spread them to fill the shelf, up to the point where a
    // cartridge stops looking like one.
    const cartW = Math.min(MAX_CART_W, (inner - gap * (count - 1)) / count);
    return { cartW, pitch: cartW + gap, gap, pad, visible: count, overflows };
  }

  // The half is the peek: the only thing that says the shelf continues.
  const visible = Math.max(2.5, atTarget + 0.5);
  const pitch = (inner + gap) / visible;
  return { cartW: Math.max(1, pitch - gap), pitch, gap, pad, visible, overflows };
}
