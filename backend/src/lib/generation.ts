import { env } from '../config/env.js';
import { requireOpenRouterKey } from './embeddings.js';
import { AppError } from '../middleware/errorHandler.js';
import type { RetrievedChunk } from './retrieval.js';

const CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
const CHAT_TIMEOUT_MS = 60000;
const MAX_CONTEXT_CHARS = 12000;
const MAX_RETRIES_429 = 2;

/** Exact fallback when the resume holds no evidence for the question. */
export const INSUFFICIENT_EVIDENCE = "I couldn't find that in the uploaded resume.";

const SYSTEM_PROMPT = [
  'You answer questions about a job candidate using ONLY the resume excerpts in CONTEXT.',
  'Rules:',
  '- Base every factual claim on the excerpts. Do not use outside knowledge.',
  '- If the excerpts do not contain enough evidence to answer, reply with exactly:',
  `  "${INSUFFICIENT_EVIDENCE}"`,
  '- Be concise (a few sentences plus short quotes where helpful).',
  '- Never invent skills, dates, employers, or numbers.',
].join('\n');

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildContext(chunks: RetrievedChunk[]): string {
  const parts: string[] = [];
  let used = 0;
  for (const c of chunks) {
    const block = `[${c.label}]\n${c.text}`;
    if (used + block.length > MAX_CONTEXT_CHARS) break;
    parts.push(block);
    used += block.length;
  }
  return parts.join('\n\n');
}

interface ChatChoice {
  message?: { content?: unknown };
}

/**
 * Generate a grounded answer from retrieved chunks only.
 * Throws 502/503 AppErrors on provider failures; never logs prompts.
 */
export async function generateGroundedAnswer(
  question: string,
  chunks: RetrievedChunk[]
): Promise<string> {
  const apiKey = requireOpenRouterKey();
  const context = buildContext(chunks);
  const body = {
    model: env.RAG_CHAT_MODEL,
    temperature: 0.2,
    max_tokens: 600,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `CONTEXT:\n${context}\n\nQUESTION:\n${question}` },
    ],
  };

  let attempt = 0;
  for (;;) {
    let res: Response;
    try {
      res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        throw new AppError(503, 'Answer generation timed out; try again shortly');
      }
      throw new AppError(503, 'Answer service is unreachable; try again shortly');
    }

    if (res.status === 429 && attempt < MAX_RETRIES_429) {
      attempt += 1;
      await delay(1000 * 2 ** (attempt - 1));
      continue;
    }
    if (res.status === 429) throw new AppError(503, 'Answer service is rate-limited; try again');
    if (res.status === 401) {
      throw new AppError(502, 'Answer service authentication failed (check OPENROUTER_API_KEY)');
    }
    if (res.status === 402) {
      throw new AppError(502, 'Answer service quota exceeded (OpenRouter credits)');
    }
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error(`[generation] provider HTTP ${res.status}`);
      throw new AppError(502, `Answer service failed (HTTP ${res.status})`);
    }
    const parsed = (await res.json().catch(() => null)) as {
      choices?: ChatChoice[];
    } | null;
    const content = parsed?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new AppError(502, 'Answer service returned an empty answer');
    }
    return content.trim();
  }
}
