import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { useReducedMotion } from "./useReducedMotion";

export interface ScrollRevealResult<T extends HTMLElement> {
  ref: RefObject<T>;
  visible: boolean;
}

/**
 * Reveal-on-enter hook. Returns a ref to attach and a `visible` flag that flips
 * true the first time the element scrolls into view (revealed once, never
 * re-triggered). Under prefers-reduced-motion, or without IntersectionObserver,
 * it returns visible=true immediately so content renders in its final state.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: { threshold?: number; rootMargin?: string } = {},
): ScrollRevealResult<T> {
  const reduced = useReducedMotion();
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState<boolean>(reduced);

  const { threshold = 0.15, rootMargin = "0px 0px -10% 0px" } = options;

  useEffect(() => {
    if (reduced) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, threshold, rootMargin]);

  return { ref, visible };
}

/** Standard reveal transform, applied by consumers of useScrollReveal. */
export function revealStyle(visible: boolean, offset = 24): CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : `translateY(${offset}px)`,
    transition:
      "opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
    willChange: "opacity, transform",
  };
}
