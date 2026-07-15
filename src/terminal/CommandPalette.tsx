import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useTheme } from "../theme/useTheme";
import { projects } from "../content/projects";
import { run } from "./CommandBus";
import {
  allCommandWords,
  commandGroups,
  SUGGESTED_QUESTIONS,
} from "./registry";
import type {
  CommandEffect,
  CommandResult,
  OutputKind,
} from "./commandTypes";

const KIND_COLOR: Record<OutputKind, string> = {
  text: "var(--term-fg)",
  dim: "var(--term-dim)",
  accent: "var(--term-accent)",
  success: "var(--term-green)",
  error: "var(--term-red)",
  warn: "var(--term-amber)",
  heading: "var(--term-amber)",
  cite: "var(--term-cite)",
};

interface TranscriptEntry {
  id: number;
  input: string;
  result: CommandResult;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

function focusableIn(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("disabled"));
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { theme, setTheme } = useTheme();
  const [input, setInput] = useState("");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  // Focus the input whenever the palette opens.
  useEffect(() => {
    if (open) {
      setHistoryIndex(null);
      // Defer to ensure the element is mounted.
      const t = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  // Keep the newest output in view.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const applyEffects = useCallback(
    (result: CommandResult): boolean => {
      const effects: CommandEffect[] = result.effects ?? [];
      for (const e of effects) {
        switch (e.type) {
          case "scroll":
            document
              .getElementById(e.target)
              ?.scrollIntoView({ behavior: "smooth" });
            break;
          case "ask":
            window.dispatchEvent(
              new CustomEvent("zk:ask", {
                detail: { question: e.question },
              }),
            );
            break;
          case "theme":
            setTheme(e.name);
            break;
          case "clear":
            setTranscript([]);
            break;
          case "download": {
            const a = document.createElement("a");
            a.href = e.url;
            if (e.filename) a.download = e.filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            break;
          }
          case "openUrl":
            window.open(e.url, "_blank", "noopener,noreferrer");
            break;
        }
      }
      return result.closeAfter ?? false;
    },
    [setTheme],
  );

  const execute = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      const result = run(trimmed, { history, currentTheme: theme });
      const isClear = (result.effects ?? []).some((e) => e.type === "clear");

      if (!isClear) {
        setTranscript((t) => [
          ...t,
          { id: nextId.current++, input: trimmed, result },
        ]);
      }
      setHistory((h) => [...h, trimmed]);
      setHistoryIndex(null);
      setInput("");

      const shouldClose = applyEffects(result);
      if (shouldClose) onClose();
    },
    [applyEffects, history, onClose, theme],
  );

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      execute(input);
    },
    [execute, input],
  );

  const completeTab = useCallback(() => {
    const parts = input.split(/\s+/);
    if (parts.length <= 1) {
      const pre = parts[0].toLowerCase();
      if (!pre) return;
      const match = allCommandWords.find((w) => w.startsWith(pre) && w !== pre);
      if (match) setInput(match + " ");
      return;
    }
    const cmd = parts[0].toLowerCase();
    if (cmd === "cat" || cmd === "open") {
      const pre = parts[parts.length - 1].toLowerCase();
      const match = projects
        .map((p) => p.id)
        .find((id) => id.startsWith(pre) && id !== pre);
      if (match) {
        parts[parts.length - 1] = match;
        setInput(parts.join(" "));
      }
    }
  }, [input]);

  const onInputKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        completeTab();
        return;
      }
      if (e.key === "ArrowUp") {
        if (history.length === 0) return;
        e.preventDefault();
        const idx =
          historyIndex === null
            ? history.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(idx);
        setInput(history[idx]);
        return;
      }
      if (e.key === "ArrowDown") {
        if (historyIndex === null) return;
        e.preventDefault();
        const idx = historyIndex + 1;
        if (idx > history.length - 1) {
          setHistoryIndex(null);
          setInput("");
        } else {
          setHistoryIndex(idx);
          setInput(history[idx]);
        }
      }
    },
    [completeTab, history, historyIndex],
  );

  // Escape closes; Tab is trapped within the dialog (input keeps Tab for
  // completion, so wrapping only kicks in from other focusables).
  const onContainerKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = focusableIn(containerRef.current);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (active === inputRef.current && !e.shiftKey) return; // completion
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  const isEmpty = transcript.length === 0;

  const overlayStyle = useMemo(
    () => ({
      position: "fixed" as const,
      inset: 0,
      zIndex: 1000,
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "10vh 16px 16px",
      background: "color-mix(in srgb, var(--term-bg) 72%, transparent)",
      backdropFilter: "blur(2px)",
    }),
    [],
  );

  if (!open) return null;

  return (
    <div
      style={overlayStyle}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="font-mono"
        onKeyDown={onContainerKeyDown}
        style={{
          width: "min(720px, 100%)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--term-bg)",
          color: "var(--term-fg)",
          border: "1px solid var(--term-dim)",
          borderRadius: 10,
          boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            borderBottom: "1px solid var(--term-dim)",
            fontSize: 12,
            color: "var(--term-dim)",
          }}
        >
          <span>portfolio · command palette</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            style={{
              background: "transparent",
              border: "1px solid var(--term-dim)",
              borderRadius: 5,
              color: "var(--term-dim)",
              cursor: "pointer",
              fontSize: 11,
              padding: "2px 8px",
            }}
          >
            esc
          </button>
        </div>

        <div
          ref={scrollRef}
          aria-live="polite"
          style={{ overflowY: "auto", padding: "12px 14px", flex: "1 1 auto" }}
        >
          {isEmpty ? (
            <EmptyState onRun={execute} />
          ) : (
            transcript.map((entry) => (
              <div key={entry.id} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: "var(--term-green)" }}>
                  <span style={{ color: "var(--term-dim)" }}>$ </span>
                  {entry.input}
                </div>
                {entry.result.lines.map((l, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 13,
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      color: KIND_COLOR[l.kind ?? "text"],
                      fontWeight: l.kind === "heading" ? 600 : 400,
                      minHeight: l.text ? undefined : "0.6em",
                    }}
                  >
                    {l.text}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <form
          onSubmit={onSubmit}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderTop: "1px solid var(--term-dim)",
          }}
        >
          <span aria-hidden style={{ color: "var(--term-green)", fontSize: 14 }}>
            ❯
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onInputKeyDown}
            aria-label="Terminal input"
            placeholder="type a command, or `help`. try `ask` or `ls projects`"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="font-mono"
            style={{
              flex: "1 1 auto",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--term-fg)",
              fontSize: 14,
            }}
          />
        </form>
      </div>
    </div>
  );
}

function EmptyState({ onRun }: { onRun: (value: string) => void }) {
  const chipStyle = {
    background: "color-mix(in srgb, var(--term-accent) 12%, transparent)",
    border: "1px solid color-mix(in srgb, var(--term-accent) 40%, transparent)",
    color: "var(--term-accent)",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    padding: "3px 9px",
  } as const;

  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--term-dim)", marginBottom: 10 }}>
        Everything here is also reachable by scrolling the page. Pick a command:
      </div>
      {commandGroups.map((g) => (
        <div key={g.group} style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--term-amber)",
              marginBottom: 6,
            }}
          >
            {g.group}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {g.commands.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => onRun(c.name)}
                title={c.help}
                className="font-mono"
                style={{
                  background: "transparent",
                  border: "1px solid var(--term-dim)",
                  color: "var(--term-fg)",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  padding: "3px 9px",
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div style={{ marginTop: 4 }}>
        <div
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--term-cite)",
            marginBottom: 6,
          }}
        >
          suggested questions
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              className="font-mono"
              onClick={() => onRun(`ask "${q}"`)}
              style={chipStyle}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
