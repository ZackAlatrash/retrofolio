import { useEffect, useState } from "react";
import { ChatPanel } from "../chat/ChatPanel";

/**
 * Support-style floating chat. A `?` button bottom-right opens the grounded
 * assistant (reused from v1). Also opens on the global `zk:ask` event so
 * citation chips and other affordances can summon it.
 */
export function HelpWidget() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onAsk = () => setOpen(true);
    window.addEventListener("zk:ask", onAsk);
    return () => window.removeEventListener("zk:ask", onAsk);
  }, []);

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Ask about Zack's work"
          style={{
            position: "fixed",
            right: 18,
            bottom: 84,
            zIndex: 55,
            width: "min(380px, calc(100vw - 36px))",
            maxHeight: "min(560px, calc(100vh - 120px))",
            overflowY: "auto",
            background: "var(--term-bg)",
            border: "1px solid var(--term-dim)",
            borderRadius: 14,
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            padding: "14px 14px 16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span
              className="font-mono"
              style={{ fontSize: 12, color: "var(--term-dim)" }}
            >
              <span style={{ color: "var(--term-green)" }}>{"// "}</span>
              ask the knowledge base
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--term-dim)",
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
          <ChatPanel />
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Ask about Zack's work"}
        aria-expanded={open}
        className="font-mono"
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          zIndex: 55,
          width: 52,
          height: 52,
          borderRadius: "50%",
          cursor: "pointer",
          fontSize: 22,
          fontWeight: 500,
          background: "var(--term-green)",
          color: "var(--term-bg)",
          border: "none",
          boxShadow: "0 8px 22px rgba(0,0,0,0.4)",
        }}
      >
        {open ? "✕" : "?"}
      </button>
    </>
  );
}
