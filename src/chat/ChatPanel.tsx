import { useCallback, useEffect, useRef, useState } from "react";
import { ask } from "./AskClient";
import type { AskMeta, AskStatus, Citation } from "./chatTypes";
import { useReducedMotion } from "../motion/useReducedMotion";

/**
 * The grounded chat demo. Each terminal state is visibly distinct: streaming,
 * complete-with-citations, refusal, error, rate-limited, and degraded
 * (retrieval-only). Citation chips deep-link to the cited project section.
 * Listens for a global `zk:ask` event so other parts of the site can drive it.
 */

interface Exchange {
  id: number;
  question: string;
  answer: string;
  citations: Citation[];
  confidence: number;
  status: AskStatus | "streaming";
  retryAfter?: number;
}

const STARTERS = [
  "What is his strongest project?",
  "Does he have production AWS experience?",
  "Show me his testing discipline.",
];

const REFUSAL_STATUSES: (Exchange["status"])[] = ["refused"];

export function ChatPanel() {
  const [input, setInput] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const reducedMotion = useReducedMotion();

  const submit = useCallback(
    async (raw: string) => {
      const question = raw.trim();
      if (!question || busy) return;

      const id = nextId.current++;
      setBusy(true);
      setInput("");
      setExchanges((prev) => [
        ...prev,
        { id, question, answer: "", citations: [], confidence: 0, status: "streaming" },
      ]);

      const update = (patch: Partial<Exchange>) =>
        setExchanges((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

      const onMeta = (meta: AskMeta) =>
        update({ citations: meta.citations, confidence: meta.confidence });
      const onToken = (text: string) =>
        setExchanges((prev) =>
          prev.map((e) => (e.id === id ? { ...e, answer: e.answer + text } : e)),
        );

      try {
        const res = await ask(question, { onMeta, onToken });
        update({
          answer: res.answer,
          citations: res.citations,
          confidence: res.confidence,
          status: res.status,
          retryAfter: res.retryAfter,
        });
      } catch {
        update({
          answer: "Something went wrong answering that. Please try again.",
          status: "error",
        });
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  // Global driver: scroll to the chat, focus the input, optionally submit.
  useEffect(() => {
    const handler = (evt: Event) => {
      const detail = (evt as CustomEvent<{ question?: string }>).detail;
      document
        .getElementById("chat")
        ?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
      inputRef.current?.focus();
      if (detail?.question) void submit(detail.question);
    };
    window.addEventListener("zk:ask", handler as EventListener);
    return () => window.removeEventListener("zk:ask", handler as EventListener);
  }, [submit, reducedMotion]);

  const onCitationClick = (c: Citation) => {
    if (!c.projectId) return;
    document
      .getElementById(`project-${c.projectId}`)
      ?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <div
      className="font-mono"
      style={{ maxWidth: 760, margin: "0 auto", fontSize: 14 }}
    >
      <div
        role="log"
        aria-live="polite"
        aria-label="Chat answers"
        style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 20 }}
      >
        {exchanges.length === 0 && (
          <p style={{ color: "var(--term-dim)", margin: 0, lineHeight: 1.6 }}>
            Ask a question about Zack's work. Answers are grounded in a curated
            knowledge base. If a question falls outside it, the assistant refuses
            instead of guessing.
          </p>
        )}
        {exchanges.map((e) => (
          <ExchangeView key={e.id} exchange={e} onCitationClick={onCitationClick} />
        ))}
      </div>

      {exchanges.length === 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: "var(--term-dim)", fontSize: 12, marginBottom: 8 }}>
            Try one of these:
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STARTERS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => void submit(q)}
                disabled={busy}
                style={{
                  fontFamily: "inherit",
                  fontSize: 12,
                  padding: "6px 12px",
                  borderRadius: 6,
                  cursor: busy ? "default" : "pointer",
                  background: "transparent",
                  color: "var(--term-accent)",
                  border: "1px solid var(--term-dim)",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          void submit(input);
        }}
        style={{ display: "flex", gap: 8, alignItems: "stretch" }}
      >
        <label htmlFor="chat-input" style={{ position: "absolute", left: -9999 }}>
          Ask a question about Zack
        </label>
        <span
          aria-hidden="true"
          style={{ color: "var(--term-green)", alignSelf: "center" }}
        >
          {"ask>"}
        </span>
        <input
          id="chat-input"
          ref={inputRef}
          type="text"
          value={input}
          onChange={(ev) => setInput(ev.target.value)}
          placeholder="e.g. Does he know AWS?"
          disabled={busy}
          maxLength={500}
          autoComplete="off"
          style={{
            flex: 1,
            fontFamily: "inherit",
            fontSize: 14,
            padding: "8px 10px",
            borderRadius: 6,
            background: "color-mix(in srgb, var(--term-fg) 6%, transparent)",
            color: "var(--term-fg)",
            border: "1px solid var(--term-dim)",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={busy || input.trim().length === 0}
          style={{
            fontFamily: "inherit",
            fontSize: 14,
            padding: "8px 16px",
            borderRadius: 6,
            cursor: busy || input.trim().length === 0 ? "default" : "pointer",
            background: "color-mix(in srgb, var(--term-accent) 16%, transparent)",
            color: "var(--term-accent)",
            border: "1px solid var(--term-accent)",
            opacity: busy || input.trim().length === 0 ? 0.5 : 1,
          }}
        >
          {busy ? "..." : "send"}
        </button>
      </form>
    </div>
  );
}

function ExchangeView({
  exchange,
  onCitationClick,
}: {
  exchange: Exchange;
  onCitationClick: (c: Citation) => void;
}) {
  const { question, answer, citations, confidence, status } = exchange;
  const isRefusal = REFUSAL_STATUSES.includes(status);
  const isError = status === "error";
  const isRateLimited = status === "rate-limited";
  const isDegraded = status === "degraded";
  const isStreaming = status === "streaming";

  const accent = isError
    ? "var(--term-red)"
    : isRefusal || isRateLimited
      ? "var(--term-amber)"
      : "var(--term-accent)";

  return (
    <div>
      <div style={{ color: "var(--term-dim)", marginBottom: 6 }}>
        <span style={{ color: "var(--term-green)" }}>{"ask> "}</span>
        <span style={{ color: "var(--term-fg)" }}>{question}</span>
      </div>

      <div
        style={{
          borderLeft: `2px solid ${accent}`,
          paddingLeft: 12,
          lineHeight: 1.6,
          color: "var(--term-fg)",
        }}
      >
        {(isRefusal || isRateLimited || isError) && (
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: accent,
              marginBottom: 4,
            }}
          >
            {isRefusal
              ? "Outside knowledge base"
              : isRateLimited
                ? "Rate limited"
                : "Error"}
          </div>
        )}

        <span>{answer}</span>
        {isStreaming && (
          <span aria-hidden="true" style={{ color: "var(--term-accent)" }}>
            {" █"}
          </span>
        )}

        {isDegraded && (
          <div style={{ fontSize: 11, color: "var(--term-dim)", marginTop: 6 }}>
            retrieval-only, answered without a model call
          </div>
        )}

        {!isRefusal && !isError && !isRateLimited && citations.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: "var(--term-dim)", marginBottom: 6 }}>
              sources{" "}
              {confidence > 0 && (
                <span>(confidence {confidence.toFixed(2)})</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {citations.map((c) =>
                c.projectId ? (
                  <button
                    key={c.sectionId}
                    type="button"
                    onClick={() => onCitationClick(c)}
                    style={citationChipStyle(true)}
                  >
                    {c.label}
                  </button>
                ) : (
                  <span key={c.sectionId} style={citationChipStyle(false)}>
                    {c.label}
                  </span>
                ),
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function citationChipStyle(clickable: boolean): React.CSSProperties {
  return {
    fontFamily: "inherit",
    fontSize: 11,
    padding: "3px 9px",
    borderRadius: 5,
    background: "color-mix(in srgb, var(--term-cite) 14%, transparent)",
    color: "var(--term-cite)",
    border: "1px solid color-mix(in srgb, var(--term-cite) 45%, transparent)",
    cursor: clickable ? "pointer" : "default",
  };
}
