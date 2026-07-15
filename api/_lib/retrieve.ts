import type { KBChunk } from "../../src/content/types";
import type { Citation } from "../../src/chat/chatTypes";

/**
 * Pure-JS lexical retrieval. TF-IDF cosine over a term-frequency vector space,
 * deliberately dependency-free so it runs identically in a serverless function
 * and client-side in the dev fallback. The `Retriever` shape is kept clean so a
 * real embedding backend can drop in later without touching callers; the
 * from-scratch-embeddings story is already told by the Lex-AI case study.
 */

const STOPWORDS = new Set([
  "a", "an", "and", "the", "is", "are", "was", "were", "be", "been", "being",
  "to", "of", "in", "on", "at", "for", "with", "by", "from", "as", "into",
  "about", "it", "its", "this", "that", "these", "those", "i", "you", "he",
  "she", "we", "they", "them", "his", "her", "their", "your", "my", "me",
  "do", "does", "did", "has", "have", "had", "can", "could", "would", "should",
  "will", "shall", "may", "might", "must", "not", "no", "or", "but", "if",
  "then", "than", "so", "such", "there", "here", "what", "which", "who", "whom",
  "how", "when", "where", "why", "any", "all", "some", "more", "most", "very",
  "just", "also", "up", "out", "over", "am", "s", "t",
  // Temporal and filler words that leak from prose into chunks. Without these,
  // an incidental single-word overlap (e.g. "today" appearing once in a
  // limitations sentence) can wrongly clear the evidence gate for an off-topic
  // question. Stripping them from both the index and queries removes that path.
  "today", "todays", "now", "currently", "current", "day", "days", "time",
  "times", "moment", "please", "tell", "tells", "telling", "told", "know",
  "knows", "knowing", "known", "get", "gets", "getting", "got", "thing",
  "things", "stuff", "give", "gives", "want", "wants", "really", "actually",
  "simply", "kind", "sort", "much", "many", "let", "us", "our", "him",
]);

/** Lowercase, split on non-alphanumerics, drop stopwords and 1-char tokens. */
export function tokenize(text: string): string[] {
  const raw = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return raw.filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

interface IndexedChunk {
  chunk: KBChunk;
  vec: Map<string, number>; // term -> tf-idf weight
  norm: number;
}

export interface RetrievalIndex {
  chunks: IndexedChunk[];
  idf: Map<string, number>;
  size: number;
}

export interface RetrievalHit {
  chunk: KBChunk;
  score: number;
  /** Count of distinct query content-terms found in this chunk. */
  overlap: number;
}

/** Terms used to represent a chunk: its prose plus label and tags for recall. */
function chunkTerms(chunk: KBChunk): string[] {
  return [
    ...tokenize(chunk.text),
    ...tokenize(chunk.sectionLabel),
    ...chunk.tags.flatMap((tag) => tokenize(tag)),
  ];
}

/** Builds a TF-IDF index over the chunks. Deterministic. */
export function buildIndex(chunks: KBChunk[]): RetrievalIndex {
  const termLists = chunks.map(chunkTerms);
  const N = chunks.length;

  // Document frequency per term.
  const df = new Map<string, number>();
  for (const terms of termLists) {
    for (const term of new Set(terms)) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  // Smoothed IDF, always positive so common terms are damped, not zeroed.
  const idf = new Map<string, number>();
  for (const [term, freq] of df) {
    idf.set(term, Math.log((N + 1) / (freq + 1)) + 1);
  }

  const indexed: IndexedChunk[] = chunks.map((chunk, i) => {
    const tf = new Map<string, number>();
    for (const term of termLists[i]) tf.set(term, (tf.get(term) ?? 0) + 1);

    const vec = new Map<string, number>();
    let sumSq = 0;
    for (const [term, count] of tf) {
      const w = count * (idf.get(term) ?? 0);
      vec.set(term, w);
      sumSq += w * w;
    }
    return { chunk, vec, norm: Math.sqrt(sumSq) };
  });

  return { chunks: indexed, idf, size: N };
}

/** Builds an L2-normalized TF-IDF query vector using the index's IDF table. */
function queryVector(query: string, idf: Map<string, number>): { vec: Map<string, number>; norm: number } {
  const tf = new Map<string, number>();
  for (const term of tokenize(query)) tf.set(term, (tf.get(term) ?? 0) + 1);

  const vec = new Map<string, number>();
  let sumSq = 0;
  for (const [term, count] of tf) {
    // Out-of-vocabulary terms contribute nothing (weight 0), so a fully
    // off-topic query yields a zero vector and therefore a zero score.
    const w = count * (idf.get(term) ?? 0);
    if (w === 0) continue;
    vec.set(term, w);
    sumSq += w * w;
  }
  return { vec, norm: Math.sqrt(sumSq) };
}

/**
 * Cosine similarity plus overlap count in one pass. Iterates the query vector
 * (usually the smaller one). Overlap is the number of distinct query terms that
 * appear in the chunk, which the evidence gate uses to reject a lone incidental
 * word match.
 */
function scoreChunk(
  q: Map<string, number>,
  qNorm: number,
  c: Map<string, number>,
  cNorm: number,
): { score: number; overlap: number } {
  if (qNorm === 0 || cNorm === 0) return { score: 0, overlap: 0 };
  let dot = 0;
  let overlap = 0;
  for (const [term, w] of q) {
    const other = c.get(term);
    if (other !== undefined) {
      dot += w * other;
      overlap += 1;
    }
  }
  return { score: dot / (qNorm * cNorm), overlap };
}

export interface RetrieveOptions {
  /** Max chunks returned. Default 6. */
  k?: number;
  /** Max chunks per project id for source diversity. Default 2. */
  perProjectCap?: number;
}

/**
 * Ranks chunks by cosine similarity, then applies a per-project cap so top-k is
 * not several near-duplicate chunks from one project. Chunks with a null
 * projectId (curated profile facts) are distinct facts, not duplicates, so they
 * bucket per-chunk and are never capped against each other.
 */
export function retrieve(
  query: string,
  index: RetrievalIndex,
  options: RetrieveOptions = {},
): RetrievalHit[] {
  const k = options.k ?? 6;
  const cap = options.perProjectCap ?? 2;

  const { vec, norm } = queryVector(query, index.idf);

  const scored: RetrievalHit[] = index.chunks.map(({ chunk, vec: cVec, norm: cNorm }) => {
    const { score, overlap } = scoreChunk(vec, norm, cVec, cNorm);
    return { chunk, score, overlap };
  });

  scored.sort((a, b) => b.score - a.score);

  const perBucket = new Map<string, number>();
  const out: RetrievalHit[] = [];
  for (const hit of scored) {
    if (hit.score <= 0) break; // no lexical overlap beyond this point
    const bucket = hit.chunk.projectId ?? `chunk:${hit.chunk.id}`;
    const used = perBucket.get(bucket) ?? 0;
    if (used >= cap) continue;
    perBucket.set(bucket, used + 1);
    out.push(hit);
    if (out.length >= k) break;
  }
  return out;
}

/** Top similarity score, the value the evidence gate is applied to. */
export function topScore(hits: RetrievalHit[]): number {
  return hits.length > 0 ? hits[0].score : 0;
}

/** Distinct query-term overlap of the top-ranked chunk, for the evidence gate. */
export function topOverlap(hits: RetrievalHit[]): number {
  return hits.length > 0 ? hits[0].overlap : 0;
}

/** Maps hits to citation records for the client. */
export function toCitations(hits: RetrievalHit[]): Citation[] {
  return hits.map((h) => ({
    projectId: h.chunk.projectId,
    sectionId: h.chunk.id,
    label: h.chunk.sectionLabel,
  }));
}

/**
 * Retrieval-only answer for the degraded path (no LLM key or over spend cap).
 * Returns the top cited chunk prose with a short honest lead-in. No fabrication,
 * because it is verbatim knowledge-base text.
 */
export function retrievalOnlyText(hits: RetrievalHit[]): string {
  if (hits.length === 0) return "";
  const lead = "Answering directly from the knowledge base:";
  const body = hits
    .slice(0, 2)
    .map((h) => h.chunk.text)
    .join(" ");
  return `${lead} ${body}`;
}
