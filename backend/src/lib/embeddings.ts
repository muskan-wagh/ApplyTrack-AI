import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

const EMBEDDINGS_URL = 'https://openrouter.ai/api/v1/embeddings';

/** Max inputs per provider request — bounds cost/latency of one call. */
export const EMBEDDING_BATCH_SIZE = 32;
/** Per-request timeout; AbortSignal.timeout aborts the fetch. */
export const EMBEDDING_TIMEOUT_MS = 30000;
const MAX_RETRIES_429 = 3;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 503 when RAG is called without credentials; never includes the key. */
export function requireOpenRouterKey(): string {
  if (!env.OPENROUTER_API_KEY) {
    throw new AppError(
      503,
      'Resume AI is not configured (missing OPENROUTER_API_KEY). Set it in backend/.env to enable resume Q&A.'
    );
  }
  return env.OPENROUTER_API_KEY;
}

interface EmbeddingItem {
  embedding?: unknown;
  index?: unknown;
}

function validateEmbeddings(data: unknown, expectedDims: number, count: number): number[][] {
  if (!Array.isArray(data) || data.length !== count) {
    throw new AppError(502, 'Embedding service returned a malformed response (shape)');
  }
  return (data as EmbeddingItem[]).map((item, i) => {
    const vec = item?.embedding;
    if (!Array.isArray(vec) || vec.length !== expectedDims) {
      throw new AppError(
        502,
        `Embedding dimension mismatch on item ${i}: expected ${expectedDims}, ` +
          `got ${Array.isArray(vec) ? vec.length : 'non-array'}`
      );
    }
    for (const v of vec) {
      if (typeof v !== 'number' || !Number.isFinite(v)) {
        throw new AppError(502, `Embedding service returned non-numeric values (item ${i})`);
      }
    }
    return vec as number[];
  });
}

async function postBatch(apiKey: string, model: string, batch: string[]): Promise<unknown> {
  let attempt = 0;
  for (;;) {
    let res: Response;
    try {
      res = await fetch(EMBEDDINGS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        // Never log inputs: vectors only.
        body: JSON.stringify({ model, input: batch }),
        signal: AbortSignal.timeout(EMBEDDING_TIMEOUT_MS),
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        throw new AppError(503, 'Embedding service timed out; try again shortly');
      }
      throw new AppError(503, 'Embedding service is unreachable; try again shortly');
    }

    if (res.status === 429 && attempt < MAX_RETRIES_429) {
      attempt += 1;
      await delay(1000 * 2 ** (attempt - 1));
      continue;
    }
    if (res.status === 429) {
      throw new AppError(503, 'Embedding service is rate-limited; try again shortly');
    }
    if (res.status === 401) {
      throw new AppError(502, 'Embedding service authentication failed (check OPENROUTER_API_KEY)');
    }
    if (res.status === 402) {
      throw new AppError(502, 'Embedding service quota exceeded (OpenRouter credits)');
    }
    if (!res.ok) {
      // Server-side only, truncated, no secrets or inputs.
      // eslint-disable-next-line no-console
      console.error(`[embeddings] provider HTTP ${res.status} for batch of ${batch.length}`);
      throw new AppError(502, `Embedding service failed (HTTP ${res.status})`);
    }
    const body = (await res.json().catch(() => null)) as { data?: unknown } | null;
    return body?.data ?? null;
  }
}

/**
 * Embed texts with the configured OpenRouter embedding model.
 * Batches large inputs, retries rate limits, and validates every vector.
 */
export async function embedMany(texts: string[]): Promise<number[][]> {
  const apiKey = requireOpenRouterKey();
  if (texts.length === 0) return [];
  for (const t of texts) {
    if (typeof t !== 'string' || t.trim().length === 0) {
      throw new AppError(400, 'Cannot embed empty text');
    }
  }
  const { EMBEDDING_MODEL, EMBEDDING_DIMS } = env;
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
    const data = await postBatch(apiKey, EMBEDDING_MODEL, batch);
    out.push(...validateEmbeddings(data, EMBEDDING_DIMS, batch.length));
  }
  return out;
}

export async function embedOne(text: string): Promise<number[]> {
  const [vec] = await embedMany([text]);
  if (!vec) throw new AppError(502, 'Embedding service returned no vector');
  return vec;
}
