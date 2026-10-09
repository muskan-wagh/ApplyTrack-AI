import { describe, expect, it } from 'vitest';
import {
  INSUFFICIENT_EVIDENCE,
  SYSTEM_PROMPT,
  SYSTEM_PROMPT_VERSION,
  buildContext,
  containsInternalMetadata,
  containsUnsupportedNumericClaim,
  extractTextContent,
  maxVerbatimRun,
  sanitizeAnswer,
  validateGroundedAnswer,
} from './generation.js';

describe('SYSTEM_PROMPT', () => {
  it('requires a direct answer first in natural language', () => {
    expect(SYSTEM_PROMPT).toMatch(/exact question directly in the first sentence/i);
    expect(SYSTEM_PROMPT).toMatch(/short paragraph/i);
  });

  it('grounds every claim and forbids invented details', () => {
    expect(SYSTEM_PROMPT).toMatch(/only the resume excerpts/i);
    expect(SYSTEM_PROMPT).toMatch(/never invent/i);
    expect(SYSTEM_PROMPT).toMatch(/years of experience|salaries/i);
  });

  it('distinguishes stated dates from verified duration', () => {
    expect(SYSTEM_PROMPT).toMatch(/distinguish the dates/i);
  });

  it('treats resume text as untrusted data', () => {
    expect(SYSTEM_PROMPT).toMatch(/untrusted data/i);
  });

  it('bans chunk IDs and excerpts in prose, with exact fallback', () => {
    expect(SYSTEM_PROMPT).toMatch(/never expose chunk IDs/i);
    expect(SYSTEM_PROMPT).toContain(INSUFFICIENT_EVIDENCE);
  });

  it('is versioned for prompt-change traceability', () => {
    expect(SYSTEM_PROMPT_VERSION).toMatch(/^rag-answer-v\d+/);
  });
});

describe('buildContext', () => {
  it('contains resume text without page/chunk labels', () => {
    const ctx = buildContext([
      { text: 'Node.js and Express APIs', label: 'Page 1 · Chunk 3', page: 1, score: 0.9 },
    ]);
    expect(ctx).toContain('Node.js and Express APIs');
    expect(ctx).not.toMatch(/Page 1 · Chunk 3/);
    expect(ctx).not.toMatch(/\[Chunk/);
  });
});

describe('sanitizeAnswer', () => {
  it('strips bracket chunk references', () => {
    expect(sanitizeAnswer('Built APIs [Chunk 2-4] with Node.')).not.toMatch(/Chunk 2-4/);
    expect(sanitizeAnswer('Built APIs [Chunk 2–4] with Node.')).not.toMatch(/Chunk/);
  });

  it('strips page/chunk labels and CJK citation markers', () => {
    expect(sanitizeAnswer('See Page 1 · Chunk 3 for details.')).not.toMatch(/Chunk 3/);
    expect(sanitizeAnswer('Built APIs【Chunk 2-4】today.')).not.toContain('【');
    expect(sanitizeAnswer('Built APIs (Chunk 2, see resume).')).not.toMatch(/Chunk 2/);
  });

  it('keeps natural prose intact', () => {
    const prose =
      'The candidate has experience building REST APIs with Node.js and Express.js, working with PostgreSQL and MongoDB.';
    expect(sanitizeAnswer(prose)).toBe(prose);
  });
});

describe('extractTextContent', () => {
  it('returns string content as-is', () => {
    expect(extractTextContent('hello')).toBe('hello');
  });

  it('joins content-block arrays (reasoning-model shape)', () => {
    expect(
      extractTextContent([{ text: 'Hello ' }, { text: 'world' }, { other: 1 }])
    ).toBe('Hello world');
    expect(extractTextContent(['a', 'b'])).toBe('ab');
  });

  it('returns empty string for missing shapes', () => {
    expect(extractTextContent(null)).toBe('');
    expect(extractTextContent(undefined)).toBe('');
    expect(extractTextContent({})).toBe('');
  });
});

describe('containsInternalMetadata', () => {
  it('detects chunk/page/citation markers', () => {
    expect(containsInternalMetadata('See [Chunk 2-4]')).toBe(true);
    expect(containsInternalMetadata('See Page 1 · Chunk 3')).toBe(true);
    expect(containsInternalMetadata('See【Chunk 2-4】')).toBe(true);
    expect(containsInternalMetadata('(Chunk 2, see resume)')).toBe(true);
  });

  it('allows legitimate domain terms like document chunking', () => {
    expect(containsInternalMetadata('Uses document chunking and embeddings.')).toBe(false);
    expect(
      containsInternalMetadata('Built REST APIs with Node.js and Express.')
    ).toBe(false);
  });
});

describe('maxVerbatimRun', () => {
  it('returns 0 for paraphrased synthesis', () => {
    const chunks = [
      { text: 'Built REST APIs with Node.js and Express integrating PostgreSQL', label: 'c1', page: 1, score: 0.9 },
    ];
    expect(
      maxVerbatimRun('The candidate builds server interfaces with Node and a SQL database.', chunks)
    ).toBeLessThan(40);
  });

  it('detects long verbatim excerpt dumps', () => {
    const chunkText =
      'Built REST APIs with Node.js and Express integrating PostgreSQL with role based access control and authentication workflows for testing and deployment across staging and production environments with monitoring';
    const chunks = [{ text: chunkText, label: 'c1', page: 1, score: 0.9 }];
    expect(maxVerbatimRun(chunkText, chunks)).toBeGreaterThanOrEqual(150);
  });
});

describe('containsUnsupportedNumericClaim', () => {
  const chunks = [
    { text: 'Built REST APIs with Node.js. B.S. 2020.', label: 'c1', page: 1, score: 0.9 },
  ];

  it('flags fabricated salary and duration claims', () => {
    expect(containsUnsupportedNumericClaim('Earned $120,000 last year.', chunks)).toBe(true);
    expect(containsUnsupportedNumericClaim('Has 5 years of experience.', chunks)).toBe(true);
  });

  it('allows numbers present in evidence and non-numeric prose', () => {
    expect(containsUnsupportedNumericClaim('Graduated with a B.S. in 2020.', chunks)).toBe(false);
    expect(
      containsUnsupportedNumericClaim('Builds REST APIs with Node.js.', chunks)
    ).toBe(false);
  });
});

describe('validateGroundedAnswer', () => {
  const chunks = [
    {
      text: 'Built REST APIs with Node.js and Express integrating PostgreSQL with role based access control and authentication workflows for testing and deployment.',
      label: 'c1',
      page: 1,
      score: 0.9,
    },
  ];

  it('accepts concise grounded prose and the exact fallback', () => {
    expect(() =>
      validateGroundedAnswer('backend?', 'Builds REST APIs with Node.js.', chunks)
    ).not.toThrow();
    expect(() =>
      validateGroundedAnswer('salary?', INSUFFICIENT_EVIDENCE, chunks)
    ).not.toThrow();
  });

  it('rejects marker-bearing, overlong, verbatim, and fabricated answers', () => {
    expect(() =>
      validateGroundedAnswer('q?', 'Built APIs [Chunk 2-4].', chunks)
    ).toThrow();
    expect(() => validateGroundedAnswer('q?', 'x'.repeat(2001), chunks)).toThrow();
    const dump = `${chunks[0]!.text} ${chunks[0]!.text} extra padding to exceed one hundred fifty characters of verbatim copying from the resume chunk text directly`;
    expect(() => validateGroundedAnswer('q?', dump, chunks)).toThrow();
    expect(() =>
      validateGroundedAnswer('q?', 'Earned $500k with 20 years experience.', chunks)
    ).toThrow();
  });
});
