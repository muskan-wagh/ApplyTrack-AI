import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { connectDB, disconnectDB } from '../src/db/connect.js';
import { extractPdfText } from '../src/lib/parsePdf.js';
import { INSUFFICIENT_EVIDENCE } from '../src/lib/generation.js';
import { Resume, ResumeChunk } from '../src/models/Resume.js';

vi.mock('../src/lib/parsePdf.js', () => ({
  extractPdfText: vi.fn(),
}));

const mockedExtract = vi.mocked(extractPdfText);
let mongod: MongoMemoryServer;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any;

const DIMS = env.EMBEDDING_DIMS;

function unitVec(first: number): number[] {
  const v = new Array(DIMS).fill(0);
  v[0] = first;
  return v;
}

function pdfBuffer(body = 'fake pdf bytes'): Buffer {
  return Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from(body)]);
}

/**
 * Stub provider HTTP: routes by URL so one mock serves embeddings + chat.
 * embedVecs is consumed in order for every embedded input.
 */
function mockProviders(embedVecs: number[][], chatText = 'Grounded test answer.') {
  let embedCalls = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const u = String(url);
      if (u.includes('/embeddings')) {
        const parsed = JSON.parse((init?.body as string) ?? '{}') as { input?: unknown[] };
        const n = Array.isArray(parsed.input) ? parsed.input.length : 0;
        const data = Array.from({ length: n }, () => {
          const v = embedVecs[Math.min(embedCalls, embedVecs.length - 1)]!;
          embedCalls += 1;
          return { embedding: v };
        });
        return new Response(JSON.stringify({ data }), { status: 200 });
      }
      if (u.includes('/chat/completions')) {
        return new Response(JSON.stringify({ choices: [{ message: { content: chatText } }] }), {
          status: 200,
        });
      }
      return new Response('not found', { status: 404 });
    })
  );
}

const RESUME_TEXT =
  'Ada Lovelace — backend engineer. Five years of Node.js and TypeScript. ' +
  'Led Postgres migration on Kubernetes. '.repeat(8);

async function uploadResume(text = RESUME_TEXT, filename = 'resume.pdf') {
  mockedExtract.mockResolvedValue(text);
  return request(app).post('/api/resumes/upload').attach('file', pdfBuffer(), {
    filename,
    contentType: 'application/pdf',
  });
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await connectDB(mongod.getUri('applytrack-test'));
  app = createApp();
}, 60000);

afterAll(async () => {
  await disconnectDB();
  if (mongod) await mongod.stop();
});

beforeEach(async () => {
  await Resume.deleteMany({});
  await ResumeChunk.deleteMany({});
  mockedExtract.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GET /api/resumes/current', () => {
  it('returns null when nothing is indexed', async () => {
    const res = await request(app).get('/api/resumes/current');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toBeNull();
  });
});

describe('POST /api/resumes/upload validation', () => {
  it('rejects a missing file with 400', async () => {
    mockProviders([unitVec(1)]);
    const res = await request(app).post('/api/resumes/upload');
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('rejects non-PDF mime types with 400', async () => {
    mockProviders([unitVec(1)]);
    const res = await request(app)
      .post('/api/resumes/upload')
      .attach('file', Buffer.from('hello'), { filename: 'notes.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });

  it('rejects bad PDF signatures with 400', async () => {
    mockProviders([unitVec(1)]);
    const res = await request(app)
      .post('/api/resumes/upload')
      .attach('file', Buffer.from('definitely not a pdf'), {
        filename: 'fake.pdf',
        contentType: 'application/pdf',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/signature/i);
  });

  it('rejects unreadable (image-only) PDFs with 400', async () => {
    mockProviders([unitVec(1)]);
    mockedExtract.mockResolvedValue('   \n  ');
    const res = await request(app).post('/api/resumes/upload').attach('file', pdfBuffer(), {
      filename: 'scan.pdf',
      contentType: 'application/pdf',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/readable text/i);
  });

  it('rejects oversized files with 400', async () => {
    mockProviders([unitVec(1)]);
    const big = Buffer.concat([Buffer.from('%PDF-'), Buffer.alloc(6 * 1024 * 1024, 0x41)]);
    const res = await request(app).post('/api/resumes/upload').attach('file', big, {
      filename: 'big.pdf',
      contentType: 'application/pdf',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/too large/i);
  });
});

describe('POST /api/resumes/upload indexing', () => {
  it('indexes a resume and exposes metadata (never vectors)', async () => {
    mockProviders([unitVec(1)]);
    const res = await uploadResume();
    expect(res.status).toBe(201);
    expect(res.body.data.chunkCount).toBeGreaterThan(0);
    expect(res.body.data.filename).toBe('resume.pdf');
    expect(JSON.stringify(res.body)).not.toContain('embedding');

    const current = await request(app).get('/api/resumes/current');
    expect(current.body.data.chunkCount).toBe(res.body.data.chunkCount);
    expect(current.body.data).not.toHaveProperty('embedding');
  });

  it('replaces the active resume on re-upload', async () => {
    mockProviders([unitVec(1), unitVec(0.5)]);
    await uploadResume(RESUME_TEXT, 'first.pdf');
    const second = await uploadResume(`${RESUME_TEXT} Staff engineer promotion.`, 'second.pdf');
    expect(second.status).toBe(201);

    expect(await Resume.countDocuments()).toBe(1);
    const current = await request(app).get('/api/resumes/current');
    expect(current.body.data.filename).toBe('second.pdf');
  });

  it('keeps the current resume when replacement indexing fails', async () => {
    mockProviders([unitVec(1)]);
    const first = await uploadResume();
    expect(first.status).toBe(201);

    // Replacement fails at the embedding step (provider outage).
    vi.unstubAllGlobals();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('down', { status: 500 })));
    mockedExtract.mockResolvedValue(`${RESUME_TEXT} Extra senior experience details.`);
    const failed = await request(app).post('/api/resumes/upload').attach('file', pdfBuffer(), {
      filename: 'replacement.pdf',
      contentType: 'application/pdf',
    });
    expect(failed.status).toBe(502);

    // Old resume intact, no staged leftovers.
    const current = await request(app).get('/api/resumes/current');
    expect(current.body.data.filename).toBe('resume.pdf');
    expect(await Resume.countDocuments()).toBe(1);
    expect(await ResumeChunk.countDocuments()).toBe(current.body.data.chunkCount);
  });
});

describe('POST /api/rag/query', () => {
  it('returns 404 when no resume is indexed', async () => {
    mockProviders([unitVec(1)]);
    const res = await request(app).post('/api/rag/query').send({ question: 'What skills?' });
    expect(res.status).toBe(404);
  });

  it('rejects too-short questions with 400', async () => {
    mockProviders([unitVec(1)]);
    await uploadResume();
    const res = await request(app).post('/api/rag/query').send({ question: 'hi' });
    expect(res.status).toBe(400);
  });

  it('answers from retrieved context with source snippets', async () => {
    // Chunk vector and question vector identical → cosine 1 → retrieved.
    mockProviders([unitVec(1), unitVec(1)], 'Ada has five years of Node.js experience.');
    await uploadResume();
    const res = await request(app)
      .post('/api/rag/query')
      .send({ question: 'How many years of Node.js experience?' });
    expect(res.status).toBe(200);
    expect(res.body.data.answer).toContain('five years');
    expect(res.body.data.sources.length).toBeGreaterThan(0);
    expect(res.body.data.sources[0]).toHaveProperty('label');
    expect(res.body.data.sources[0]).toHaveProperty('snippet');
  });

  it('rescues results via cosine when $vectorSearch returns [] without throwing', async () => {
    // Regression test: some clusters return zero rows (instead of an error)
    // for a missing/misconfigured vector index. Retrieval must double-check
    // with cosine rather than report "no evidence".
    mockProviders([unitVec(1), unitVec(1)], 'Ada has five years of Node.js experience.');
    await uploadResume();
    const aggSpy = vi.spyOn(ResumeChunk, 'aggregate').mockResolvedValue([]);
    try {
      const res = await request(app)
        .post('/api/rag/query')
        .send({ question: 'How many years of Node.js experience?' });
      expect(res.status).toBe(200);
      expect(res.body.data.answer).toContain('five years');
      expect(res.body.data.sources.length).toBeGreaterThan(0);
    } finally {
      aggSpy.mockRestore();
    }
  });

  it('returns no sources when the model reports insufficient evidence', async () => {
    // Even when retrieval returns a chunk, an INSUFFICIENT_EVIDENCE answer
    // must not carry misleading source snippets.
    mockProviders([unitVec(1), unitVec(1)], INSUFFICIENT_EVIDENCE);
    await uploadResume();
    const res = await request(app)
      .post('/api/rag/query')
      .send({ question: 'How many years of Node.js experience?' });
    expect(res.status).toBe(200);
    expect(res.body.data.answer).toBe(INSUFFICIENT_EVIDENCE);
    expect(res.body.data.sources).toEqual([]);
  });

  it('falls back cleanly when the resume has no evidence', async () => {    // Orthogonal question vector → cosine 0 < RAG_MIN_SCORE → filtered out.
    const chunkVec = unitVec(1);
    chunkVec[1] = 0;
    const questionVec = unitVec(0);
    questionVec[1] = 1;
    mockProviders([chunkVec, questionVec]);
    await uploadResume();
    const res = await request(app)
      .post('/api/rag/query')
      .send({ question: "What is the candidate's favourite colour?" });
    expect(res.status).toBe(200);
    expect(res.body.data.answer).toBe(INSUFFICIENT_EVIDENCE);
    expect(res.body.data.sources).toEqual([]);
  });
});
