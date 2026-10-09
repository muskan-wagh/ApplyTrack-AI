import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';

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
});
