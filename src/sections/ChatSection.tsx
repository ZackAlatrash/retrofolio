import { ChatPanel } from "../chat/ChatPanel";

/**
 * The live grounded-chatbot demo block. This is the signature piece: it behaves
 * like the RAG systems on the resume, retrieving, gating on evidence, citing
 * sources, and refusing cleanly when a question falls outside the knowledge
 * base. The refusal is deliberate and is part of what the demo shows.
 */
export function ChatSection() {
  return (
    <section
      id="chat"
      aria-label="Ask about Zack"
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "72px 24px",
        scrollMarginTop: 24,
      }}
    >
      <h2
        className="font-mono"
        style={{
          fontSize: 13,
          fontWeight: 400,
          color: "var(--term-dim)",
          margin: "0 0 12px",
        }}
      >
        <span style={{ color: "var(--term-green)" }}>{"// "}</span>
        ask the knowledge base
      </h2>
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: "var(--term-dim)",
          maxWidth: 620,
          margin: "0 0 28px",
        }}
      >
        This chatbot only answers from a curated knowledge base about Zack's
        work, and it cites the exact section behind each answer. Ask something it
        does not cover and it refuses instead of guessing. That refusal is the
        point: it is the same evidence-gating behavior his RAG systems ship with.
      </p>
      <ChatPanel />
    </section>
  );
}
