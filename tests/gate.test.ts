import { describe, it, expect } from "vitest";
import { buildKb } from "../src/content/kb";
import { buildIndex, retrieve, topScore, topOverlap } from "../api/_lib/retrieve";
import {
  gate,
  evidenceGate,
  DEFAULT_THRESHOLD,
  SINGLE_TERM_MIN_SCORE,
} from "../api/_lib/gate";

describe("score-gate boundary behavior", () => {
  it("passes at exactly the threshold", () => {
    expect(gate(DEFAULT_THRESHOLD).pass).toBe(true);
  });

  it("refuses just below the threshold", () => {
    expect(gate(DEFAULT_THRESHOLD - 1e-6).pass).toBe(false);
  });

  it("passes above the threshold", () => {
    expect(gate(DEFAULT_THRESHOLD + 0.1).pass).toBe(true);
  });

  it("refuses a zero score", () => {
    expect(gate(0).pass).toBe(false);
  });

  it("honors a custom threshold", () => {
    expect(gate(0.3, 0.5).pass).toBe(false);
    expect(gate(0.6, 0.5).pass).toBe(true);
  });

  it("keeps the default threshold in a sane calibrated range", () => {
    expect(DEFAULT_THRESHOLD).toBeGreaterThan(0);
    expect(DEFAULT_THRESHOLD).toBeLessThan(1);
  });
});

describe("evidence-gate overlap rule", () => {
  it("passes two or more overlapping terms above the threshold", () => {
    expect(evidenceGate({ topScore: 0.14, topOverlap: 2 }).pass).toBe(true);
  });

  it("refuses a single weak overlapping term above the threshold", () => {
    // The reported bug: one incidental word clears the score threshold.
    const d = evidenceGate({ topScore: 0.16, topOverlap: 1 });
    expect(d.pass).toBe(false);
    expect(d.reason).toBe("insufficient-overlap");
  });

  it("passes a single strong overlapping term", () => {
    expect(evidenceGate({ topScore: SINGLE_TERM_MIN_SCORE, topOverlap: 1 }).pass).toBe(true);
  });

  it("refuses anything below the score threshold regardless of overlap", () => {
    const d = evidenceGate({ topScore: DEFAULT_THRESHOLD - 1e-6, topOverlap: 5 });
    expect(d.pass).toBe(false);
    expect(d.reason).toBe("below-threshold");
  });

  it("keeps the single-term floor above the score threshold", () => {
    expect(SINGLE_TERM_MIN_SCORE).toBeGreaterThan(DEFAULT_THRESHOLD);
    expect(SINGLE_TERM_MIN_SCORE).toBeLessThan(1);
  });
});

/**
 * Benchmark per CHATBOT.md section 9: on-topic questions must pass the evidence
 * gate, clearly off-topic questions must refuse. The off-topic set deliberately
 * includes adversarial cases that share an incidental word with the corpus
 * ("today", "time"/"now", "get", "tell", "write"), which is the class of
 * false-negative that slipped through before. A threshold or rule change that
 * breaks this separation fails CI, so the calibration is justified by
 * measurement.
 */
const index = buildIndex(buildKb());

const ON_TOPIC = [
  "What is his strongest project?",
  "Does he have production AWS experience?",
  "Show me his testing discipline.",
  "Tell me about Omnipotence",
  "Does he know RAG?",
  "What is his architecture approach?",
  "Is he a student?",
  "Where is he located?",
  "Can he work in the Netherlands?",
  "What languages does he speak?",
  "What was the hardest problem in Lex-AI?",
  "How many tests did he write for Recomp Tracker?",
  "What is Consented Cart?",
  "How can I contact him?",
  "What is he looking for?",
  "What certifications does he have?",
];

const OFF_TOPIC = [
  // Adversarial: each shares an incidental word with the corpus.
  "What is the weather in Paris today?", // "today"
  "What time is it now?", // "time" / "now"
  "Can you get me a coffee?", // "get"
  "Tell me a joke.", // "tell"
  "write me a poem about roses", // "write"
  // Plain off-topic with no shared vocabulary.
  "what's the weather",
  "what is the capital of France",
  "how do I bake sourdough bread",
  "who won the world cup",
  "what is the meaning of life",
  "how tall is Mount Everest",
  "give me a recipe for pancakes",
];

function decide(question: string) {
  const hits = retrieve(question, index);
  const score = topScore(hits);
  const overlap = topOverlap(hits);
  return { score, overlap, pass: evidenceGate({ topScore: score, topOverlap: overlap }).pass };
}

describe("evidence-gate benchmark", () => {
  it.each(ON_TOPIC)("answers on-topic: %s", (q) => {
    expect(decide(q).pass).toBe(true);
  });

  it.each(OFF_TOPIC)("refuses off-topic: %s", (q) => {
    expect(decide(q).pass).toBe(false);
  });

  it("refuses every adversarial incidental-overlap question", () => {
    const adversarial = OFF_TOPIC.slice(0, 5);
    for (const q of adversarial) expect(decide(q).pass).toBe(false);
  });

  it("passes every on-topic question through the full evidence gate", () => {
    for (const q of ON_TOPIC) {
      const d = decide(q);
      expect(d.pass, `${q} (score ${d.score.toFixed(3)}, overlap ${d.overlap})`).toBe(true);
    }
  });
});
