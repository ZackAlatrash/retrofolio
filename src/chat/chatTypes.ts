/** Shared request/response contract for the grounded chatbot endpoint. */

export interface Citation {
  /** Project id for deep-linking, or null for a curated profile fact. */
  projectId: string | null;
  /** Stable knowledge-base chunk id the answer drew from. */
  sectionId: string;
  /** Human-readable label shown on the citation chip. */
  label: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AskRequest {
  question: string;
  history?: ChatTurn[];
}

/** Terminal states the UI must render, each visibly distinct. */
export type AskStatus =
  | "complete"
  | "refused"
  | "degraded"
  | "rate-limited"
  | "error";

export interface AskResponse {
  answer: string;
  citations: Citation[];
  /** Top retrieval similarity, shown honestly. 0..1. */
  confidence: number;
  refused: boolean;
  /** Retrieval-only answer (no LLM), from missing key or spend cap. */
  degraded: boolean;
  status: AskStatus;
  /** Present when rate-limited; seconds until the window resets. */
  retryAfter?: number;
  /** Present when status is "error". */
  error?: string;
}

/** The single refusal message, shared server and client side. */
export const REFUSAL_MESSAGE =
  "I don't have that in my knowledge base. I only answer questions grounded in Zack's work.";

/** Streamed metadata event sent before answer tokens. */
export interface AskMeta {
  citations: Citation[];
  confidence: number;
  refused: boolean;
  degraded: boolean;
  /** Fallback full answer for refused/degraded turns that do not stream tokens. */
  answer?: string;
}
