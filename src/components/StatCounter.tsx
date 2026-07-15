import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../motion/useReducedMotion";

interface StatCounterProps {
  value: string;
  label: string;
}

/** Parses the leading integer out of a value like "~1,300" or "50+". */
function parseTarget(value: string): { num: number | null; render: (n: number) => string } {
  const match = value.match(/[\d,]+/);
  if (!match) return { num: null, render: () => value };
  const digits = match[0].replace(/,/g, "");
  const num = Number(digits);
  if (!Number.isFinite(num)) return { num: null, render: () => value };
  const [prefix, suffix] = value.split(match[0]);
  return {
    num,
    render: (n: number) => `${prefix}${n.toLocaleString()}${suffix}`,
  };
}

export function StatCounter({ value, label }: StatCounterProps) {
  const reduced = useReducedMotion();
  const { num, render } = parseTarget(value);
  const [display, setDisplay] = useState(() =>
    reduced || num === null ? value : render(0),
  );
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (reduced || num === null) {
      setDisplay(value);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1100;
          let raf = 0;
          let t0: number | null = null;
          const step = (ts: number) => {
            if (t0 === null) t0 = ts;
            const p = Math.min((ts - t0) / duration, 1);
            const eased = 0.5 - Math.cos(p * Math.PI) / 2;
            setDisplay(render(Math.round(num * eased)));
            if (p < 1) raf = requestAnimationFrame(step);
          };
          raf = requestAnimationFrame(step);
          io.disconnect();
          return () => cancelAnimationFrame(raf);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, num, render, value]);

  return (
    <div ref={ref}>
      <div
        className="font-mono"
        style={{ fontSize: 26, fontWeight: 500, color: "var(--term-accent)" }}
      >
        {display}
      </div>
      <div style={{ fontSize: 12, color: "var(--term-dim)", marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}
