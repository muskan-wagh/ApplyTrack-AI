import { describe, expect, it } from 'vitest';
import { cosineSimilarity } from './similarity.js';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 10);
  });

  it('is scale-invariant', () => {
    expect(cosineSimilarity([1, 0], [100, 0])).toBeCloseTo(1, 10);
  });

  it('returns 0 for orthogonal vectors and 0 for zero vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 10);
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
  });

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 1], [-1, -1])).toBeCloseTo(-1, 10);
  });

  it('throws on empty, mismatched, or non-finite input', () => {
    expect(() => cosineSimilarity([], [1])).toThrow();
    expect(() => cosineSimilarity([1, 2], [1])).toThrow();
    expect(() => cosineSimilarity([1, NaN], [1, 2])).toThrow();
  });
});
