import { buildKb } from "../content/kb";
import {
  buildIndex,
  retrieve,
  topScore,
  topOverlap,
  toCitations,
  retrievalOnlyText,
  type RetrievalIndex,
} from "../../api/_lib/retrieve";
import { evidenceGate } from "../../api/_lib/gate";
import {
  REFUSAL_MESSAGE,
  type AskMeta,
  type AskResponse,
  type ChatTurn,
} from "./chatTypes";

/**
 * Typed client for POST /api/ask. Parses the SSE stream, retries once on a
 * transient network failure, and enforces a timeout. If the endpoint is
 * unreachable or 404s (vite dev has no serverless runtime), it falls back to
 * running retrieve + gate CLIENT-SIDE so the grounded-answer / refusal demo
 * still works locally, returning a retrieval-only cited answer or a refusal.
 */

export interface AskOptions {
  history?: ChatTurn[];
  onMeta?: (meta: AskMeta) => void;
  onToken?: (text: string) => void;
  signal?: AbortSignal;
  timeoutMs?: number;
  endpoint?: string;
  fetchImpl?: typeof fetch;
}

const DEFAULT_TIMEOUT_MS = 20000;

let localIndex: RetrievalIndex | null = null;
function getLocalIndex(): RetrievalIndex {
  if (!localIndex) localIndex = buildIndex(buildKb());
  return localIndex;
}

/** Computes an answer entirely client-side (dev fallback / offline). */
export function localAnswer(question: string, opts: AskOptions = {}): AskResponse {
  const hits = retrieve(question, getLocalIndex(), { k: 6, perProjectCap: 2 });
  const confidence = topScore(hits);
  const decision = evidenceGate({ topScore: confidence, topOverlap: topOverlap(hits) });

  if (!decision.pass) {
    const meta: AskMeta = {
      citations: [],
      confidence,
      refused: true,
      degraded: false,
      answer: REFUSAL_MESSAGE,
    };
    opts.onMeta?.(meta);
    opts.onToken?.(REFUSAL_MESSAGE);
    return {
      answer: REFUSAL_MESSAGE,
      citations: [],
      confidence,
      refused: true,
      degraded: false,
      status: "refused",
    };
  }

  const citations = toCitations(hits);
  const answer = retrievalOnlyText(hits);
  const meta: AskMeta = { citations, confidence, refused: false, degraded: true, answer };
  opts.onMeta?.(meta);
  opts.onToken?.(answer);
  return {
    answer,
    citations,
    confidence,
    refused: false,
    degraded: true,
    status: "degraded",
  };
}

interface ParsedStream {
  meta: AskMeta | null;
  tokens: string[];
}

async function parseSseStream(
  body: ReadableStream<Uint8Array>,
  opts: AskOptions,
): Promise<ParsedStream> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let meta: AskMeta | null = null;
  const tokens: string[] = [];

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const evt of events) {
      const lines = evt.split("\n");
      const eventType = lines.find((l) => l.startsWith("event:"))?.slice(6).trim();
      const dataLine = lines.find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      let data: unknown;
      try {
        data = JSON.parse(dataLine.slice(5).trim());
      } catch {
        continue;
      }
      if (eventType === "meta") {
        meta = data as AskMeta;
        opts.onMeta?.(meta);
      } else if (eventType === "token") {
        const text = (data as { text?: string }).text ?? "";
        if (text) {
          tokens.push(text);
          opts.onToken?.(text);
        }
      }
    }
  }
  return { meta, tokens };
}

function streamToResponse(parsed: ParsedStream): AskResponse {
  const meta = parsed.meta;
  const streamed = parsed.tokens.join("");
  const answer = streamed || meta?.answer || "";
  const refused = meta?.refused ?? false;
  const degraded = meta?.degraded ?? false;
  return {
    answer,
    citations: meta?.citations ?? [],
    confidence: meta?.confidence ?? 0,
    refused,
    degraded,
    status: refused ? "refused" : degraded ? "degraded" : "complete",
  };
}

async function postOnce(question: string, opts: AskOptions): Promise<Response> {
  const doFetch = opts.fetchImpl ?? fetch;
  // Base-relative: on a project host the site lives under a subpath. A static
  // host has no serverless runtime at all, so this 404s there and `ask` falls
  // back to the local answer, which is the intended behaviour.
  const endpoint = opts.endpoint ?? `${import.meta.env.BASE_URL}api/ask`;
  return doFetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, history: opts.history ?? [] }),
    signal: opts.signal,
  });
}

/**
 * Asks a grounded question. Streams tokens via callbacks and resolves to the
 * final response. Handles complete, refusal, degraded, rate-limited, and error
 * states, and falls back to a local answer when the endpoint is unavailable.
 */
export async function ask(question: string, opts: AskOptions = {}): Promise<AskResponse> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Chain a caller-provided signal to our timeout controller.
  if (opts.signal) {
    if (opts.signal.aborted) controller.abort();
    else opts.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  const callOpts: AskOptions = { ...opts, signal: controller.signal };

  let usedRetry = false;
  try {
    for (;;) {
      let res: Response;
      try {
        res = await postOnce(question, callOpts);
      } catch {
        // Transient network failure: retry once, then fall back locally.
        if (!usedRetry) {
          usedRetry = true;
          continue;
        }
        return localAnswer(question, opts);
      }

      // No serverless runtime behind this build. A dev server simply has no
      // such route (404), while a static host refuses the method outright:
      // GitHub Pages answers a POST with 405, and some hosts with 501. None of
      // them are failures worth showing the visitor, so answer locally.
      if (res.status === 404 || res.status === 405 || res.status === 501) {
        return localAnswer(question, opts);
      }

      if (res.status === 429) {
        let retryAfter = 60;
        try {
          const j = await res.json();
          if (typeof j.retryAfter === "number") retryAfter = j.retryAfter;
        } catch {
          /* keep default */
        }
        return {
          answer:
            "You have reached the question limit for now. Please wait a moment and try again.",
          citations: [],
          confidence: 0,
          refused: false,
          degraded: false,
          status: "rate-limited",
          retryAfter,
        };
      }

      if (!res.ok) {
        return {
          answer: "Something went wrong answering that. Please try again.",
          citations: [],
          confidence: 0,
          refused: false,
          degraded: false,
          status: "error",
          error: `HTTP ${res.status}`,
        };
      }

      if (!res.body) return localAnswer(question, opts);

      const parsed = await parseSseStream(res.body, callOpts);
      return streamToResponse(parsed);
    }
  } finally {
    clearTimeout(timer);
  }
}
