import { describe, it, expect, vi } from "vitest";
import { ask, localAnswer } from "../src/chat/AskClient";
import type { AskMeta } from "../src/chat/chatTypes";

/**
 * These tests never touch the network: fetch is mocked to reject, 404, 429, or
 * to return a canned SSE stream. The dev-fallback path must produce a grounded
 * retrieval-only answer or a refusal purely client-side, with no LLM call.
 */

function sseResponse(events: { event: string; data: unknown }[]): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const e of events) {
        controller.enqueue(
          enc.encode(`event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`),
        );
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  });
}

describe("localAnswer (client-side retrieve + gate)", () => {
  it("returns a grounded retrieval-only answer for an on-topic question", () => {
    const res = localAnswer("Does he have production AWS experience?");
    expect(res.status).toBe("degraded");
    expect(res.degraded).toBe(true);
    expect(res.refused).toBe(false);
    expect(res.answer.length).toBeGreaterThan(0);
    expect(res.citations.length).toBeGreaterThan(0);
    expect(res.confidence).toBeGreaterThan(0);
  });

  it("refuses an off-topic question without inventing an answer", () => {
    const res = localAnswer("what's the weather");
    expect(res.status).toBe("refused");
    expect(res.refused).toBe(true);
    expect(res.citations).toHaveLength(0);
    expect(res.answer).toMatch(/knowledge base/i);
  });
});

describe("ask dev fallback", () => {
  it("falls back locally when the endpoint 404s (vite dev, no serverless)", async () => {
    const fetchImpl = vi.fn((url: string) => {
      expect(url).toBe("/api/ask"); // the grounded LLM endpoint, never reached beyond this
      return Promise.resolve(new Response("", { status: 404 }));
    });
    const res = await ask("What is his strongest project?", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(res.status).toBe("degraded");
    expect(res.citations.length).toBeGreaterThan(0);
  });

  it("retries once on a network error, then falls back locally", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down");
    });
    const res = await ask("Show me his testing discipline.", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2); // original + single retry
    expect(res.status).toBe("degraded");
    expect(res.citations.length).toBeGreaterThan(0);
  });

  it("refuses an off-topic question through the fallback", async () => {
    const fetchImpl = vi.fn(async () => new Response("", { status: 404 }));
    const res = await ask("what is the capital of France", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(res.status).toBe("refused");
    expect(res.refused).toBe(true);
  });

  it("invokes onMeta and onToken in the fallback", async () => {
    const onMeta = vi.fn<(m: AskMeta) => void>();
    const onToken = vi.fn<(t: string) => void>();
    const fetchImpl = vi.fn(async () => new Response("", { status: 404 }));
    await ask("Does he know RAG?", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      onMeta,
      onToken,
    });
    expect(onMeta).toHaveBeenCalledTimes(1);
    expect(onToken).toHaveBeenCalled();
  });
});

describe("ask over a live SSE stream", () => {
  it("parses meta and token events into a complete answer with citations", async () => {
    const meta = {
      citations: [{ projectId: "omnipotence", sectionId: "omnipotence:architecture", label: "Omnipotence architecture" }],
      confidence: 0.42,
      refused: false,
      degraded: false,
    };
    const fetchImpl = vi.fn(async () =>
      sseResponse([
        { event: "meta", data: meta },
        { event: "token", data: { text: "He built " } },
        { event: "token", data: { text: "Omnipotence on AWS." } },
        { event: "done", data: {} },
      ]),
    );
    const tokens: string[] = [];
    const res = await ask("Tell me about Omnipotence", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      onToken: (t) => tokens.push(t),
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(res.status).toBe("complete");
    expect(res.answer).toBe("He built Omnipotence on AWS.");
    expect(res.citations).toHaveLength(1);
    expect(res.confidence).toBeCloseTo(0.42);
    expect(tokens).toEqual(["He built ", "Omnipotence on AWS."]);
  });

  it("renders a streamed refusal as a refused result", async () => {
    const fetchImpl = vi.fn(async () =>
      sseResponse([
        {
          event: "meta",
          data: { citations: [], confidence: 0.02, refused: true, degraded: false, answer: "I don't have that in my knowledge base." },
        },
        { event: "token", data: { text: "I don't have that in my knowledge base." } },
        { event: "done", data: {} },
      ]),
    );
    const res = await ask("what's the weather", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(res.status).toBe("refused");
    expect(res.refused).toBe(true);
  });
});

describe("ask transport states", () => {
  it("maps a 429 to a rate-limited result with retryAfter", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ retryAfter: 42 }), {
        status: 429,
        headers: { "content-type": "application/json" },
      }),
    );
    const res = await ask("Does he know AWS?", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(res.status).toBe("rate-limited");
    expect(res.retryAfter).toBe(42);
  });

  it("maps a 500 to an error result", async () => {
    const fetchImpl = vi.fn(async () => new Response("boom", { status: 500 }));
    const res = await ask("Does he know AWS?", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(res.status).toBe("error");
  });
});
