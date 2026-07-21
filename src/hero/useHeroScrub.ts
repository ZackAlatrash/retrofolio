import { useEffect, useRef, useState } from "react";

export const FRAME_COUNT = 96;
const base = import.meta.env.BASE_URL;

export const frameUrl = (i: number) =>
  `${base}hero/frame_${String(i + 1).padStart(3, "0")}.webp`;
export const posterUrl = `${base}hero/poster.webp`;

/**
 * Kukis-style scroll-scrub: preloads the frame sequence, maps scroll progress
 * through a tall pinned container to a frame, and draws it cover-fit to a canvas.
 * Returns `progress` (0..1) for the text overlay to react to.
 */
export function useHeroScrub(enabled: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const imgs: HTMLImageElement[] = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = frameUrl(i);
      imgs[i] = img;
    }
    imagesRef.current = imgs;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;

    const currentProgress = () => {
      const total = container.offsetHeight - window.innerHeight;
      const top = container.getBoundingClientRect().top;
      const p = total > 0 ? -top / total : 0;
      return Math.max(0, Math.min(1, p));
    };

    const pickImage = (idx: number): HTMLImageElement | null => {
      const imgs = imagesRef.current;
      const ok = (im?: HTMLImageElement) =>
        !!im && im.complete && im.naturalWidth > 0;
      if (ok(imgs[idx])) return imgs[idx];
      for (let d = 1; d < FRAME_COUNT; d++) {
        if (ok(imgs[idx - d])) return imgs[idx - d];
        if (ok(imgs[idx + d])) return imgs[idx + d];
      }
      return null;
    };

    const draw = () => {
      const p = currentProgress();
      const idx = Math.round(p * (FRAME_COUNT - 1));
      const img = pickImage(idx);
      const cw = canvas.width;
      const ch = canvas.height;
      ctx.clearRect(0, 0, cw, ch);
      if (img) {
        const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      }
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      draw();
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        draw();
        const p = currentProgress();
        setProgress((prev) => (Math.abs(p - prev) > 0.004 ? p : prev));
      });
    };

    resize();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
    // Redraw briefly while frames are still decoding so late frames appear.
    const warm = window.setInterval(draw, 120);
    window.setTimeout(() => window.clearInterval(warm), 5000);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
      window.clearInterval(warm);
    };
  }, [enabled]);

  return { containerRef, canvasRef, progress };
}
