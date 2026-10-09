/** Pure cosine-similarity helpers for the retrieval fallback path. */

/**
 * Cosine similarity in [-1, 1]. Returns 0 for zero-magnitude vectors
 * (which carry no direction, e.g. degenerate provider output).
 * Throws on empty or mismatched-length inputs — fail loudly, never NaN.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) {
    throw new Error('cosineSimilarity requires non-empty vectors');
  }
  if (a.length !== b.length) {
    throw new Error(
      `cosineSimilarity dimension mismatch: ${a.length} vs ${b.length}`
    );
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i]!;
    const y = b[i]!;
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error('cosineSimilarity requires finite vector components');
    }
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
