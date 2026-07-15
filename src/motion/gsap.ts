import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * True only in a real, layout-capable browser. jsdom (vitest) reports a
 * userAgent containing "jsdom" and has no real layout engine, so ScrollTrigger
 * would misbehave there. SSR has no window at all. Guarding here keeps every
 * caller a no-op outside the browser.
 */
export const isBrowser =
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  typeof navigator !== "undefined" &&
  !/jsdom/i.test(navigator.userAgent);

let registered = false;

/**
 * Returns the gsap + ScrollTrigger pair with the plugin registered exactly
 * once, or null when not in a browser. Callers must handle null.
 */
export function getGsap(): { gsap: typeof gsap; ScrollTrigger: typeof ScrollTrigger } | null {
  if (!isBrowser) return null;
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return { gsap, ScrollTrigger };
}
