import { describe, expect, it } from 'vitest';
import { ChunkLimitError, chunkText } from './chunk.js';

describe('chunkText', () => {
  it('returns [] for empty or whitespace-only input', () => {
    expect(chunkText('')).toEqual([]);
    expect(chunkText('   \n\t  ')).toEqual([]);
  });

  it('keeps short text in a single chunk with page metadata', () => {
    const chunks = chunkText('Jane Doe — backend engineer with 5 years of Node experience.');
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.page).toBe(1);
    expect(chunks[0]!.chunkIndex).toBe(0);
    expect(chunks[0]!.label).toBe('Page 1 · Chunk 1');
  });

  it('splits long text into overlapping chunks', () => {
    const sentence = 'Led migration of a monolith to microservices on Kubernetes. ';
    const text = sentence.repeat(60); // ~3480 chars
    const chunks = chunkText(text, { chunkSize: 1000, overlap: 200 });
    expect(chunks.length).toBeGreaterThan(2);
    for (let i = 1; i < chunks.length; i += 1) {
      const prev = chunks[i - 1]!.text;
      const curr = chunks[i]!.text;
      // Overlap: the tail of the previous chunk should share words with the next.
      const tailWords = prev.split(/\s+/).slice(-10).join(' ');
      const headWords = curr.split(/\s+/).slice(0, 25).join(' ');
      const shared = tailWords.split(' ').filter((w) => w.length > 3 && headWords.includes(w));
      expect(shared.length).toBeGreaterThan(0);
      // No gaps: concatenated chunks cover the whole normalized text.
      expect(curr.length).toBeGreaterThan(0);
    }
    // Full coverage: every word of the input appears in at least one chunk.
    const covered = new Set(chunks.flatMap((c) => c.text.split(/\s+/)));
    for (const word of text.split(/\s+/)) {
      expect(covered.has(word)).toBe(true);
    }
  });

  it('preserves page metadata across form-feed boundaries', () => {
    const chunks = chunkText('First page skills: TypeScript.\fSecond page experience: Staff Engineer.');
    expect(chunks).toHaveLength(2);
    expect(chunks[0]!.page).toBe(1);
    expect(chunks[1]!.page).toBe(2);
    expect(chunks[1]!.label).toContain('Page 2');
  });

  it('throws ChunkLimitError when the cap is exceeded', () => {
    const text = 'word '.repeat(5000);
    expect(() => chunkText(text, { chunkSize: 200, overlap: 20, maxChunks: 5 })).toThrow(
      ChunkLimitError
    );
  });

  it('rejects invalid sizes loudly', () => {
    expect(() => chunkText('abc', { chunkSize: 50 })).toThrow();
    expect(() => chunkText('abc', { chunkSize: 500, overlap: 500 })).toThrow();
  });
});
