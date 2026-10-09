import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { EMBEDDING_BATCH_SIZE, embedMany } from './embeddings.js';

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function vec(dims = env.EMBEDDING_DIMS, fill = 0.1): number[] {
  return new Array(dims).fill(fill);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('embedMany', () => {
  it('returns one validated vector per input', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, { data: [{ embedding: vec() }, { embedding: vec() }] })
    );
    vi.stubGlobal('fetch', fetchMock);
    const out = await embedMany(['hello world', 'second text here']);
    expect(out).toHaveLength(2);
    expect(out[0]).toHaveLength(env.EMBEDDING_DIMS);
    // Auth header present, inputs sent as batch (values not asserted here).
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((call[1].headers as Record<string, string>).Authorization).toMatch(/^Bearer /);
  });

  it('splits large inputs into batches', async () => {
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string) as { input: string[] };
      return jsonResponse(
        200,
        { data: body.input.map(() => ({ embedding: vec() })) }
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    const texts = Array.from({ length: EMBEDDING_BATCH_SIZE + 3 }, (_, i) => `chunk text ${i}`);
    const out = await embedMany(texts);
    expect(out).toHaveLength(texts.length);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('maps 401 to a 502 auth error without leaking the key', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(401, { error: 'nope' })));
    const err = await embedMany(['some text']).catch((e) => e);
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).statusCode).toBe(502);
    expect((err as Error).message).not.toContain('test-key');
  });

  it('retries 429 then succeeds', async () => {
    let calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        calls += 1;
        if (calls === 1) return jsonResponse(429, { error: 'slow down' });
        return jsonResponse(200, { data: [{ embedding: vec() }] });
      })
    );
    const out = await embedMany(['retry me please']);
    expect(out).toHaveLength(1);
    expect(calls).toBe(2);
  });

  it('rejects malformed responses and dimension mismatches', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(200, { data: [{ nope: 1 }] })));
    await expect(embedMany(['bad shape'])).rejects.toMatchObject({ statusCode: 502 });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(200, { data: [{ embedding: vec(8) }] }))
    );
    const err = await embedMany(['wrong dims']).catch((e) => e);
    expect(err).toBeInstanceOf(AppError);
    expect((err as Error).message).toContain('dimension mismatch');
  });

  it('returns 503 when the API key is missing', async () => {
    const prev = env.OPENROUTER_API_KEY;
    (env as unknown as Record<string, unknown>).OPENROUTER_API_KEY = '';
    try {
      const err = await embedMany(['no key input']).catch((e) => e);
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(503);
    } finally {
      (env as unknown as Record<string, unknown>).OPENROUTER_API_KEY = prev;
    }
  });
});
