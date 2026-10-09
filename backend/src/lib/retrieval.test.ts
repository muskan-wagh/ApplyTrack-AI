import { describe, expect, it } from 'vitest';
import {
  MIN_SOURCE_HITS,
  countQuestionHits,
  dedupeChunks,
  expandKeywords,
  extractKeywords,
  isRelevantToQuestion,
  rankChunksByQuestion,
  type RetrievedChunk,
} from './retrieval.js';

function chunk(text: string, score = 0.5, label = 'Page 1 · Chunk 1'): RetrievedChunk {
  return { text, label, page: 1, score };
}

describe('extractKeywords', () => {
  it('keeps domain terms and drops stopwords', () => {
    const kw = extractKeywords('What backend experience does this candidate have?');
    expect(kw).toContain('backend');
    expect(kw).toContain('experience');
    expect(kw).not.toContain('what');
    expect(kw).not.toContain('does');
  });

  it('keeps database/framework tokens', () => {
    const kw = extractKeywords('Which databases and backend frameworks are listed?');
    expect(kw).toContain('databases');
    expect(kw).toContain('backend');
    expect(kw).toContain('frameworks');
  });
});

describe('dedupeChunks', () => {
  it('removes exact duplicates, keeping the first', () => {
    const a = chunk('Node.js and Express REST APIs', 0.9, 'Page 1 · Chunk 1');
    const b = chunk('Node.js and Express REST APIs', 0.8, 'Page 1 · Chunk 2');
    const out = dedupeChunks([a, b]);
    expect(out).toHaveLength(1);
    expect(out[0]!.label).toBe('Page 1 · Chunk 1');
  });

  it('removes highly overlapping chunks from sliding windows', () => {
    const base =
      'Built REST APIs with Node.js and Express integrating PostgreSQL with role based access control and authentication';
    const a = chunk(base, 0.9);
    const b = chunk(`${base} extra`, 0.8);
    expect(dedupeChunks([a, b])).toHaveLength(1);
  });

  it('keeps complementary chunks with distinct facts', () => {
    const a = chunk('Built REST APIs with Node.js and Express', 0.9);
    const b = chunk('Implemented RAG workflows with document chunking and embeddings', 0.8);
    expect(dedupeChunks([a, b])).toHaveLength(2);
  });
});

describe('rankChunksByQuestion', () => {
  it('prioritizes backend paragraphs for backend questions', () => {
    const contact = chunk('Ada Lovelace ada@example.com San Francisco', 0.9, 'c1');
    const backend = chunk('Built REST APIs with Node.js Express and PostgreSQL', 0.5, 'c2');
    const ranked = rankChunksByQuestion([contact, backend], 'What backend experience does this candidate have?');
    expect(ranked[0]!.label).toBe('c2');
  });

  it('preserves complementary facts instead of collapsing to one', () => {
    const a = chunk('Node.js Express PostgreSQL backend services', 0.6, 'a');
    const b = chunk('RAG workflows document chunking embeddings semantic search', 0.6, 'b');
    const ranked = rankChunksByQuestion([a, b], 'What RAG techniques and backend experience are listed?');
    expect(ranked).toHaveLength(2);
  });
});

describe('expandKeywords (reverse synonyms)', () => {
  it('expands paraphrases like server to the backend family', () => {
    const out = expandKeywords(['server']);
    expect(out).toContain('backend');
    expect(out).toContain('node');
    expect(out).toContain('api');
  });
});

describe('source relevance (MIN_SOURCE_HITS)', () => {
  it('keeps backend evidence and drops pure contact/education noise', () => {
    const q = 'What backend experience does this candidate have?';
    expect(countQuestionHits('Built REST APIs with Node.js Express and PostgreSQL', q)).toBeGreaterThanOrEqual(
      MIN_SOURCE_HITS
    );
    expect(isRelevantToQuestion('Ada Lovelace ada@example.com San Francisco', q)).toBe(false);
    expect(isRelevantToQuestion('B.S. Computer Science, 2020.', q)).toBe(false);
  });

  it('keeps RAG evidence and drops single-synonym outliers', () => {
    const q = 'What RAG techniques are listed?';
    expect(
      isRelevantToQuestion('Implemented document chunking, vector embeddings, and semantic search.', q)
    ).toBe(true);
    expect(isRelevantToQuestion('Built 5+ projects using React and OpenAI APIs.', q)).toBe(false);
  });

  it('returns no support for salary questions (fallback path)', () => {
    const q = "What was the candidate's exact salary at their last job?";
    expect(countQuestionHits('Built REST APIs with Node.js.', q)).toBe(0);
    expect(isRelevantToQuestion('Built REST APIs with Node.js.', q)).toBe(false);
  });
});
