/**
 * Evidence gate. If retrieval confidence is too low, the system refuses without
 * calling the LLM. This mirrors Lex-AI's empirically tuned 0.55 cosine gate; the
 * numbers here differ because this is lexical TF-IDF cosine rather than dense
 * embeddings, and they are calibrated against the benchmark in
 * tests/gate.test.ts (on-topic vs off-topic questions).
 *
 * Two conditions guard the gate (belt and suspenders):
 *  1. Score threshold: the top cosine must clear DEFAULT_THRESHOLD.
 *  2. Term-overlap rule: a lone incidental word shared with a chunk (for example
 *     "today" appearing once in a limitations sentence) can clear the score
 *     threshold on its own and wrongly answer an off-topic question. So a single
 *     overlapping term only passes when the match is strong
 *     (score >= SINGLE_TERM_MIN_SCORE); two or more distinct overlapping terms
 *     always pass. Genuine recruiter questions overlap multiple domain terms, or
 *     one high-signal term with a strong score, so they stay above the bar.
 *
 * On-topic questions score roughly 0.20 to 0.58 with multi-term or strong
 * single-term overlap; clearly off-topic questions score 0 (no shared
 * vocabulary) or clear the threshold only through one weak incidental term.
 */
export const DEFAULT_THRESHOLD = 0.12;

/** Distinct overlapping terms that unconditionally clear the overlap rule. */
export const MIN_TERM_OVERLAP = 2;

/** A single overlapping term must reach this score to count as evidence. */
export const SINGLE_TERM_MIN_SCORE = 0.2;

export interface GateResult {
  pass: boolean;
  /** Why the gate refused, for logging and tests. */
  reason?: "below-threshold" | "insufficient-overlap";
}

/**
 * Score-only gate. Kept as a simple, stable primitive; the full evidence gate
 * below composes it with the term-overlap rule.
 */
export function gate(topScore: number, threshold: number = DEFAULT_THRESHOLD): GateResult {
  return topScore >= threshold ? { pass: true } : { pass: false, reason: "below-threshold" };
}

export interface Evidence {
  topScore: number;
  /** Distinct query content-terms found in the top-ranked chunk. */
  topOverlap: number;
}

export interface EvidenceGateOptions {
  threshold?: number;
  minOverlap?: number;
  singleTermMinScore?: number;
}

/**
 * The full evidence gate: score threshold plus the term-overlap rule. This is
 * what the endpoint and the client fallback use to decide answer vs refuse.
 */
export function evidenceGate(
  evidence: Evidence,
  options: EvidenceGateOptions = {},
): GateResult {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const minOverlap = options.minOverlap ?? MIN_TERM_OVERLAP;
  const singleTermMinScore = options.singleTermMinScore ?? SINGLE_TERM_MIN_SCORE;

  if (evidence.topScore < threshold) return { pass: false, reason: "below-threshold" };
  if (evidence.topOverlap >= minOverlap) return { pass: true };
  // Exactly one overlapping term: require a strong score so a lone incidental
  // word cannot clear the gate on its own.
  if (evidence.topScore >= singleTermMinScore) return { pass: true };
  return { pass: false, reason: "insufficient-overlap" };
}
