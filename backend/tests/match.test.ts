import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { extractTextContent } from '../src/lib/match.js';

const app = createApp();

const RESUME = 'Ada Lovelace — backend engineer with five years of Node.js, TypeScript, Postgres. '.repeat(
  3
);
const JD = 'Hiring a backend engineer: Node.js, TypeScript, Postgres, Kubernetes experience required. '.repeat(
  3
);

function chatMock(content: string, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status })
    )
  );
}

/** Queue one provider response per call, in order. */
function chatSequence(bodies: unknown[], status = 200) {
  let i = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      const body = bodies[Math.min(i, bodies.length - 1)];
      i += 1;
      return new Response(JSON.stringify(body), { status });
    })
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('POST /api/match validation', () => {
  it('rejects missing fields with 400', async () => {
    chatMock('{}');
    const res = await request(app).post('/api/match').send({});
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('rejects too-short inputs with 400', async () => {
    chatMock('{}');
    const res = await request(app)
      .post('/api/match')
      .send({ resumeText: 'short', jobDescription: 'also short' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/match scoring', () => {
  it('returns score, skills, and explanation from model JSON', async () => {
    chatMock(
      JSON.stringify({
        score: 82,
        matchedSkills: ['Node.js', 'TypeScript'],
        missingSkills: ['Kubernetes'],
        explanation: 'Strong backend overlap; missing Kubernetes depth.',
      })
    );
    const res = await request(app).post('/api/match').send({
      resumeText: RESUME,
      jobDescription: JD,
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.score).toBe(82);
    expect(res.body.data.matchedSkills).toContain('Node.js');
    expect(res.body.data.missingSkills).toContain('Kubernetes');
    expect(res.body.data.explanation).toMatch(/backend/i);
  });

  it('parses JSON wrapped in markdown fences', async () => {
    chatMock(
      '```json\n{"score": 70, "matchedSkills": ["Postgres"], "missingSkills": [], "explanation": "Solid fit."}\n```'
    );
    const res = await request(app).post('/api/match').send({
      resumeText: RESUME,
      jobDescription: JD,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(70);
  });

  it('maps provider outages to 502 without leaking inputs', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('down', { status: 500 })));
    const res = await request(app).post('/api/match').send({
      resumeText: RESUME,
      jobDescription: JD,
    });
    expect(res.status).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain('Ada Lovelace');
  });

  it('maps malformed model JSON to 502', async () => {
    chatMock('not json at all');
    const res = await request(app).post('/api/match').send({
      resumeText: RESUME,
      jobDescription: JD,
    });
    expect(res.status).toBe(502);
  });

  it('maps persistently empty provider content to 502 (no fake score)', async () => {
    // Reasoning budget exhaustion / free-tier flake on every attempt.
    chatSequence([
      { choices: [{ message: { content: '' } }] },
      { choices: [{ message: { content: '   ' } }] },
    ]);
    const res = await request(app).post('/api/match').send({
      resumeText: RESUME,
      jobDescription: JD,
    });
    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/empty answer/i);
    expect(res.body).not.toHaveProperty('data');
  });

  it('recovers when a single empty response is followed by valid JSON', async () => {
    const valid = JSON.stringify({
      score: 75,
      matchedSkills: ['Node.js'],
      missingSkills: ['Kubernetes'],
      explanation: 'Good backend overlap after retry.',
    });
    chatSequence([
      { choices: [{ message: { content: '' } }] },
      { choices: [{ message: { content: valid } }] },
    ]);
    const res = await request(app).post('/api/match').send({
      resumeText: RESUME,
      jobDescription: JD,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(75);
  });

  it('parses content-blocks array responses', async () => {
    const valid = JSON.stringify({
      score: 68,
      matchedSkills: ['Postgres'],
      missingSkills: ['Kubernetes'],
      explanation: 'Solid fit from block content.',
    });
    chatSequence([
      { choices: [{ message: { content: [{ type: 'text', text: valid }] } }] },
    ]);
    const res = await request(app).post('/api/match').send({
      resumeText: RESUME,
      jobDescription: JD,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(68);
  });

  it('maps truncated JSON (finish-length cutoff) to 502, never a fake score', async () => {
    chatMock('{"score": 92, "matchedSkills": ["Node.js",');
    const res = await request(app).post('/api/match').send({
      resumeText: RESUME,
      jobDescription: JD,
    });
    expect(res.status).toBe(502);
    expect(res.body).not.toHaveProperty('data');
  });

  it('returns 503 when the API key is missing', async () => {
    const saved = env.OPENROUTER_API_KEY;
    env.OPENROUTER_API_KEY = '';
    try {
      const res = await request(app).post('/api/match').send({
        resumeText: RESUME,
        jobDescription: JD,
      });
      expect(res.status).toBe(503);
      expect(res.body.error).toMatch(/OPENROUTER_API_KEY/i);
    } finally {
      env.OPENROUTER_API_KEY = saved;
    }
  });

  it('returns 503 on network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('socket hang up');
      })
    );
    const res = await request(app).post('/api/match').send({
      resumeText: RESUME,
      jobDescription: JD,
    });
    expect(res.status).toBe(503);
  });
});

describe('extractTextContent', () => {
  it('passes strings through', () => {
    expect(extractTextContent('{"score": 1}')).toBe('{"score": 1}');
  });

  it('joins text content blocks', () => {
    expect(
      extractTextContent([{ type: 'text', text: '{"score": ' }, { type: 'text', text: '1}' }])
    ).toBe('{"score": 1}');
  });

  it('returns empty string for null or non-text shapes', () => {
    expect(extractTextContent(null)).toBe('');
    expect(extractTextContent([{ type: 'image' }])).toBe('');
  });
});
