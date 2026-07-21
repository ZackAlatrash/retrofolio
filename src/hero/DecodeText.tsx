import { useEffect, useState, type CSSProperties } from "react";

const GLYPHS = "01<>{}[]()=+*/#$%&;:!?".split("");

interface DecodeTextProps {
  text: string;
  /** Scrub progress 0..1. */
  progress: number;
  /** Progress at which the first letter locks. */
  start: number;
  /** Progress at which the last letter locks. */
  end: number;
  reduced: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * The hero twist: the title assembles out of the swirling code. Each letter
 * flickers through code glyphs, then locks (left to right) as scroll progresses,
 * so the name is literally decoded from the video's data stream. Under reduced
 * motion it renders as plain, immediate text.
 */
export function DecodeText({
  text,
  progress,
  start,
  end,
  reduced,
  className,
  style,
}: DecodeTextProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setTick((t) => (t + 1) % 100000), 55);
    return () => window.clearInterval(id);
  }, [reduced]);

  const chars = [...text];

  if (reduced) {
    return (
      <span className={className} style={style}>
        {text}
      </span>
    );
  }

  return (
    <span className={className} style={style} aria-label={text} role="text">
      {chars.map((ch, i) => {
        if (ch === " ") return <span key={i}>{" "}</span>;
        const lockAt = start + (end - start) * (i / chars.length);
        const locked = progress >= lockAt;
        const appeared = progress >= start - 0.06;
        const display = locked ? ch : GLYPHS[(i * 5 + tick) % GLYPHS.length];
        return (
          <span
            key={i}
            aria-hidden="true"
            style={{
              color: locked ? "inherit" : "var(--term-green)",
              opacity: appeared ? 1 : 0,
              transition: "opacity 0.2s ease",
            }}
          >
            {display}
          </span>
        );
      })}
    </span>
  );
}
