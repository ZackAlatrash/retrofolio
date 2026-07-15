import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useReducedMotion } from "../motion/useReducedMotion";

const BOOT_FLAG = "zk.booted";
const CMD = "./launch-portfolio";
const INIT_LINES = [
  "loading content model ............ ok",
  "mounting theme engine (tokyo-night) ok",
  "warming grounded assistant ....... ok",
  "compositing scroll narrative ..... ok",
];
const PROGRESS_STEPS = 20;

function hasBootedBefore(): boolean {
  try {
    return localStorage.getItem(BOOT_FLAG) !== null;
  } catch {
    return false;
  }
}

function markBooted(): void {
  try {
    localStorage.setItem(BOOT_FLAG, "1");
  } catch {
    /* ignore persistence failures */
  }
}

function prefersReducedMotionNow(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Skippable cinematic terminal boot. Types `./launch-portfolio`, prints a few
 * init lines and a progress tick, then reveals children. Auto-skips (children
 * render immediately) under reduced motion or when the visitor has booted
 * before; sets the `zk.booted` flag after the first run. A persistent [skip]
 * control ends the sequence at any time.
 */
export function Boot({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();

  const [booting, setBooting] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (hasBootedBefore()) return false;
    if (prefersReducedMotionNow()) return false;
    return true;
  });

  const [charCount, setCharCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    markBooted();
    setBooting(false);
  }, []);

  // If the user switches to reduced motion mid-boot, skip immediately.
  useEffect(() => {
    if (booting && reduced) finish();
  }, [booting, reduced, finish]);

  // Drive the timed sequence while booting.
  useEffect(() => {
    if (!booting) return;
    const timers: number[] = [];
    let t = 0;

    for (let i = 1; i <= CMD.length; i++) {
      const n = i;
      timers.push(window.setTimeout(() => setCharCount(n), t));
      t += 45;
    }
    t += 250;
    for (let i = 1; i <= INIT_LINES.length; i++) {
      const n = i;
      timers.push(window.setTimeout(() => setLineCount(n), t));
      t += 320;
    }
    t += 150;
    for (let i = 1; i <= PROGRESS_STEPS; i++) {
      const pct = Math.round((i / PROGRESS_STEPS) * 100);
      timers.push(window.setTimeout(() => setProgress(pct), t));
      t += 32;
    }
    t += 260;
    timers.push(window.setTimeout(finish, t));

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [booting, finish]);

  const filled = Math.round((progress / 100) * PROGRESS_STEPS);
  const bar = "█".repeat(filled) + "░".repeat(PROGRESS_STEPS - filled);
  const commandDone = charCount >= CMD.length;

  return (
    <>
      {children}
      {booting && (
        <div
          className="font-mono"
          role="status"
          aria-label="Launching portfolio"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "var(--term-bg)",
            color: "var(--term-fg)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 clamp(20px, 8vw, 120px)",
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          <div>
            <span style={{ color: "var(--term-green)" }}>$ </span>
            <span>{CMD.slice(0, charCount)}</span>
            {!commandDone && (
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  width: "0.6em",
                  height: "1em",
                  transform: "translateY(0.12em)",
                  background: "var(--term-fg)",
                }}
              />
            )}
          </div>

          {INIT_LINES.slice(0, lineCount).map((l) => (
            <div key={l} style={{ color: "var(--term-dim)" }}>
              {l.replace(/ ok$/, "")}
              <span style={{ color: "var(--term-green)" }}>
                {l.endsWith("ok") ? " ok" : ""}
              </span>
            </div>
          ))}

          {commandDone && lineCount >= INIT_LINES.length && (
            <div style={{ marginTop: 10, color: "var(--term-accent)" }}>
              <span aria-hidden>[{bar}]</span>{" "}
              <span>{progress}%</span>
            </div>
          )}

          <button
            type="button"
            onClick={finish}
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              background: "transparent",
              border: "1px solid var(--term-dim)",
              color: "var(--term-dim)",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              padding: "4px 12px",
            }}
          >
            [skip]
          </button>
        </div>
      )}
    </>
  );
}
