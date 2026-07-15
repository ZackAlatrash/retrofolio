import { describe, it, expect } from "vitest";
import { buildKb } from "../src/content/kb";
import {
  tokenize,
  buildIndex,
  retrieve,
  topScore,
  topOverlap,
  toCitations,
} from "../api/_lib/retrieve";
import { gate, evidenceGate, DEFAULT_THRESHOLD } from "../api/_lib/gate";

const index = buildIndex(buildKb());

describe("tokenize", () => {
  it("lowercases, strips stopwords, and keeps content alphanumerics", () => {
    expect(tokenize("Deployed the RAG Pipeline")).toEqual(["deployed", "rag", "pipeline"]);
  });

  it("keeps short technical tokens like s3 and drops single chars", () => {
    const t = tokenize("S3 and a k");
    expect(t).toContain("s3");
    expect(t).not.toContain("a");
    expect(t).not.toContain("k");
  });

  it("strips temporal and filler words that leak from prose", () => {
    // These are the incidental words a chunk can contain; stripping them from
    // both index and query removes the single-word false-match path.
    const t = tokenize("today now currently time tell get know thing please");
    expect(t).toHaveLength(0);
  });
});

describe("retrieval ranking", () => {
  it("retrieves the strongest-project chunk for the strongest-project question", () => {
    const hits = retrieve("What is his strongest project?", index);
    expect(hits[0].chunk.id).toBe("profile:strongest-project");
  });

  it("retrieves an AWS chunk for a production AWS question", () => {
    const hits = retrieve("Does he have production AWS experience?", index);
    expect(hits[0].chunk.tags).toContain("aws");
    expect(hits[0].chunk.id).toBe("profile:aws");
  });

  it("retrieves the testing chunk for a testing question", () => {
    const hits = retrieve("Show me his testing discipline.", index);
    expect(hits[0].chunk.id).toBe("profile:testing");
  });

  it("surfaces the right project for a project-specific question", () => {
    const hits = retrieve("What was the hardest problem in Lex-AI?", index);
    expect(hits[0].chunk.projectId).toBe("lex-ai");
  });
});

describe("per-project cap", () => {
  it("returns at most 2 chunks from any single project", () => {
    // A query that overlaps many omnipotence facets at once.
    const hits = retrieve(
      "omnipotence architecture pipeline retrieval aws deployment metrics hardest tradeoffs limitations",
      index,
      { k: 10 },
    );
    const counts = new Map<string, number>();
    for (const h of hits) {
      const key = h.chunk.projectId ?? `chunk:${h.chunk.id}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    for (const [, n] of counts) expect(n).toBeLessThanOrEqual(2);
    expect(counts.get("omnipotence")).toBe(2);
  });

  it("honors a custom cap", () => {
    const hits = retrieve("omnipotence architecture pipeline metrics hardest", index, {
      k: 10,
      perProjectCap: 1,
    });
    const omni = hits.filter((h) => h.chunk.projectId === "omnipotence");
    expect(omni.length).toBeLessThanOrEqual(1);
  });

  it("respects k", () => {
    const hits = retrieve("architecture testing rag aws project", index, { k: 3 });
    expect(hits.length).toBeLessThanOrEqual(3);
  });
});

describe("off-topic scoring vs the gate", () => {
  it("scores a clearly off-topic query below the gate threshold", () => {
    const hits = retrieve("what's the weather", index);
    const score = topScore(hits);
    expect(score).toBeLessThan(DEFAULT_THRESHOLD);
    expect(gate(score).pass).toBe(false);
  });

  it("scores an on-topic query at or above the gate threshold", () => {
    const hits = retrieve("What is his strongest project?", index);
    const score = topScore(hits);
    expect(score).toBeGreaterThanOrEqual(DEFAULT_THRESHOLD);
    expect(gate(score).pass).toBe(true);
  });
});

describe("incidental single-word overlap (the reported bug)", () => {
  // "What is the weather in Paris today?" previously matched the omnipotence
  // limitations chunk on the lone word "today" and cleared the gate. The filler
  // word is now a stopword, so it does not overlap any chunk at all.
  it("refuses the exact regression query", () => {
    const hits = retrieve("What is the weather in Paris today?", index);
    expect(topScore(hits)).toBe(0);
    expect(topOverlap(hits)).toBe(0);
    expect(evidenceGate({ topScore: topScore(hits), topOverlap: topOverlap(hits) }).pass).toBe(false);
  });

  it("refuses a lone incidental content-word match via the overlap rule", () => {
    // "write" leaks from "atomic-write"; it clears the score threshold (~0.16)
    // but is a single weak overlap, so the evidence gate still refuses.
    const hits = retrieve("write me a poem about roses", index);
    const decision = evidenceGate({ topScore: topScore(hits), topOverlap: topOverlap(hits) });
    expect(topOverlap(hits)).toBeLessThanOrEqual(1);
    expect(decision.pass).toBe(false);
  });

  it("reports overlap on the top hit", () => {
    const hits = retrieve("Does he have production AWS experience?", index);
    expect(hits[0].overlap).toBeGreaterThanOrEqual(2);
    expect(topOverlap(hits)).toBe(hits[0].overlap);
  });
});

describe("citations", () => {
  it("maps hits to citation records with stable section ids", () => {
    const hits = retrieve("Tell me about Omnipotence", index);
    const cites = toCitations(hits);
    expect(cites.length).toBeGreaterThan(0);
    expect(cites[0]).toHaveProperty("sectionId");
    expect(cites[0]).toHaveProperty("label");
    expect(cites[0]).toHaveProperty("projectId");
  });
});
