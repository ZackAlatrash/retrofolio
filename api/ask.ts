import { getKb } from "../src/content/kb";
import {
  buildIndex,
  retrieve,
  topScore,
  topOverlap,
  toCitations,
  retrievalOnlyText,
  type RetrievalIndex,
} from "./_lib/retrieve";
import { evidenceGate } from "./_lib/gate";
import { buildGroundedPrompt } from "./_lib/prompt";
import { askRateLimiter } from "./_lib/ratelimit";
import { REFUSAL_MESSAGE, type AskMeta } from "../src/chat/chatTypes";

/**
 * Serverless ask endpoint. Flow: rate-limit, input hygiene (user text is data,
 * never instructions), retrieve, gate. Below the gate it refuses WITHOUT calling
 * the LLM. Above the gate it streams a grounded answer, or degrades to a
 * retrieval-only answer when there is no API key or the spend cap is hit. Never
 * fails closed with a blank error if retrieval succeeded.
 *
 * Uses the standard Vercel Node signature. Streaming is Server-Sent Events:
 *   event: meta  -> AskMeta (citations, confidence, refused, degraded, answer?)
 *   event: token -> { text }
 *   event: done  -> {}
 */

// Minimal ambient declaration so this file typechecks without @types/node
// (kept dependency-free). `process` exists in the Node serverless runtime.
declare const process: { env: Record<string, string | undefined> };

const MODEL = "claude-haiku-4-5-20251001";
const MAX_QUESTION_LEN = 500;
const MAX_TOKENS = 700;
// Best-effort in-memory spend guard. Resets on cold start; a hard monthly cap
// belongs in the platform, this just prevents a runaway loop from a single warm
// instance. Configurable via env.
const MONTHLY_CALL_CAP = Number(process.env.ASK_MONTHLY_CALL_CAP ?? "5000");

let index: RetrievalIndex | null = null;
function getIndex(): RetrievalIndex {
  if (!index) index = buildIndex(getKb());
  return index;
}

let llmCallsThisStart = 0;

// Minimal shape of the Node req/res we rely on, to avoid a Vercel type dep.
interface NodeReq {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  on?: (event: string, cb: (chunk: unknown) => void) => void;
}
interface NodeRes {
  statusCode: number;
  setHeader: (k: string, v: string) => void;
  write: (chunk: string) => void;
  end: (chunk?: string) => void;
}

function clientIp(req: NodeReq): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
  if (Array.isArray(fwd) && fwd.length > 0) return fwd[0];
  const real = req.headers["x-real-ip"];
  if (typeof real === "string") return real;
  return "unknown";
}

async function readBody(req: NodeReq): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === "object") return req.body as Record<string, unknown>;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  if (!req.on) return {};
  const chunks: string[] = [];
  await new Promise<void>((resolve) => {
    req.on!("data", (c) => chunks.push(String(c)));
    req.on!("end", () => resolve());
    req.on!("error", () => resolve());
  });
  try {
    return chunks.length ? JSON.parse(chunks.join("")) : {};
  } catch {
    return {};
  }
}

function sse(res: NodeRes, event: string, data: unknown): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function sendMeta(res: NodeRes, meta: AskMeta): void {
  sse(res, "meta", meta);
}

export default async function handler(req: NodeReq, res: NodeRes): Promise<void> {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  // Rate limit by IP.
  const rl = askRateLimiter.check(clientIp(req));
  if (!rl.ok) {
    res.statusCode = 429;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Retry-After", String(rl.retryAfter));
    res.end(
      JSON.stringify({
        error: "Too many questions in a short window. Please wait a moment and try again.",
        retryAfter: rl.retryAfter,
      }),
    );
    return;
  }

  const body = await readBody(req);
  const rawQuestion = typeof body.question === "string" ? body.question : "";
  const question = rawQuestion.trim().slice(0, MAX_QUESTION_LEN);

  if (question.length === 0) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Question is required." }));
    return;
  }

  // Retrieve and gate. The user's text is only ever a query, never instructions.
  const hits = retrieve(question, getIndex(), { k: 6, perProjectCap: 2 });
  const confidence = topScore(hits);
  const decision = evidenceGate({ topScore: confidence, topOverlap: topOverlap(hits) });

  // Open the SSE stream for every 200 response so the client parses uniformly.
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  // Refusal path: no LLM call.
  if (!decision.pass) {
    sendMeta(res, {
      citations: [],
      confidence,
      refused: true,
      degraded: false,
      answer: REFUSAL_MESSAGE,
    });
    sse(res, "token", { text: REFUSAL_MESSAGE });
    sse(res, "done", {});
    res.end();
    return;
  }

  const citations = toCitations(hits);
  const chunks = hits.map((h) => h.chunk);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const overCap = llmCallsThisStart >= MONTHLY_CALL_CAP;

  // Degraded path: retrieval-only cited answer.
  if (!apiKey || overCap) {
    const answer = retrievalOnlyText(hits);
    sendMeta(res, { citations, confidence, refused: false, degraded: true, answer });
    sse(res, "token", { text: answer });
    sse(res, "done", {});
    res.end();
    return;
  }

  // Grounded generation.
  sendMeta(res, { citations, confidence, refused: false, degraded: false });

  const { system, messages } = buildGroundedPrompt(question, chunks);
  llmCallsThisStart += 1;

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system,
        messages,
        stream: true,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      // Fall back to retrieval-only rather than failing the request.
      const answer = retrievalOnlyText(hits);
      sse(res, "token", { text: answer });
      sse(res, "done", { degraded: true });
      res.end();
      return;
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const evt of events) {
        const dataLine = evt.split("\n").find((l) => l.startsWith("data:"));
        if (!dataLine) continue;
        const payload = dataLine.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const parsed = JSON.parse(payload);
          if (
            parsed.type === "content_block_delta" &&
            parsed.delta?.type === "text_delta" &&
            typeof parsed.delta.text === "string"
          ) {
            sse(res, "token", { text: parsed.delta.text });
          }
        } catch {
          // Ignore keep-alive or non-JSON lines.
        }
      }
    }

    sse(res, "done", {});
    res.end();
  } catch {
    // Network failure mid-generation: degrade gracefully with the cited chunks.
    const answer = retrievalOnlyText(hits);
    sse(res, "token", { text: answer });
    sse(res, "done", { degraded: true });
    res.end();
  }
}
