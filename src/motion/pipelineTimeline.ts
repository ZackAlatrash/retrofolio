import { getGsap } from "./gsap";

export interface PipelineTimelineRefs {
  /** The tall outer section that acts as the ScrollTrigger. */
  section: HTMLElement;
  /** The sticky inner content that gets pinned. */
  pin: HTMLElement;
  /** The stage cards, in pipeline order. */
  stages: HTMLElement[];
  /** The token/dot that flows down the rail. Optional. */
  token: HTMLElement | null;
  /** Fired on scrub with the number of stages that should read as revealed. */
  onProgress?: (revealed: number) => void;
}

/**
 * Builds the pinned, scrubbed GSAP timeline for the signature RAG pipeline.
 * Stages assemble one-by-one as the user scrolls, a token flows down the rail,
 * and `onProgress` drives the React-side reveal count (final stage + citation).
 *
 * Returns a cleanup function. No-ops (and returns a no-op cleanup) outside the
 * browser, so it is safe to call unconditionally from an effect.
 */
export function buildPipelineTimeline(refs: PipelineTimelineRefs): () => void {
  const ctx = getGsap();
  if (!ctx || refs.stages.length === 0) return () => {};

  const { gsap } = ctx;
  const stages = refs.stages;
  const n = stages.length;

  const gctx = gsap.context(() => {
    gsap.set(stages, { opacity: 0, y: 28 });
    if (refs.token) gsap.set(refs.token, { top: "0%", opacity: 0 });

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      scrollTrigger: {
        trigger: refs.section,
        start: "top top",
        end: () => "+=" + n * 320,
        scrub: 0.6,
        pin: refs.pin,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const revealed = Math.max(
            1,
            Math.min(n, Math.floor(self.progress * n) + 1),
          );
          refs.onProgress?.(revealed);
        },
      },
    });

    if (refs.token) {
      tl.to(refs.token, { opacity: 1, duration: 0.12, ease: "none" }, 0);
    }

    stages.forEach((card, i) => {
      const at = i / n;
      tl.to(card, { opacity: 1, y: 0, duration: 0.6 / n }, at);
      if (refs.token) {
        const pos = n === 1 ? 0 : (i / (n - 1)) * 100;
        tl.to(refs.token, { top: pos + "%", duration: 0.6 / n, ease: "none" }, at);
      }
    });
  });

  return () => gctx.revert();
}
