import { env } from '../config/env.js';
import { requireOpenRouterKey } from './embeddings.js';
import { AppError } from '../middleware/errorHandler.js';
import { matchResultSchema, type MatchResult } from '../schemas/match.js';

const CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
const CHAT_TIMEOUT_MS = 60000;
const MAX_RETRIES_429 = 2;
// The configured chat model is a reasoning model: hidden reasoning tokens come
// out of the same max_tokens budget (observed ~600-700 reasoning tokens per
// match call). A small budget starves the visible answer, producing truncated
// or empty content ("Match service returned an empty answer"). Size the budget
// for reasoning + the JSON answer.
const MAX_TOKENS = 2000;
/** One retry when the provider returns 200 with empty content (free-tier flake). */
const MAX_RETRIES_EMPTY = 1;
// Bound prompt size — schemas already cap each side at 20k chars.
const MAX_INPUT_CHARS = 12000;

const SYSTEM_PROMPT = [
  'You compare a candidate resume against a job description and return a fit analysis.',
  'Rules:',
  '- Base every claim ONLY on the provided RESUME and JOB DESCRIPTION. Do not use outside knowledge.',
  '- Never invent skills, employers, dates, or experience.',
  '- Score 0-100: overall fit of the resume for this job.',
  '- matchedSkills: skills/technologies present in BOTH resume and job description (max 20, short labels).',
  '- missingSkills: important job requirements NOT evident in the resume (max 20, short labels).',
  '- explanation: 2-4 concise sentences explaining the score.',
  'Respond with JSON ONLY, no markdown, no prose — exactly this shape:',
  '{"score": 0-100, "matchedSkills": ["..."], "missingSkills": ["..."], "explanation": "..."}',
].join('\n');

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncate(s: string): string {
  return s.length > MAX_INPUT_CHARS ? s.slice(0, MAX_INPUT_CHARS) : s;
}

/** Tolerantly extract a JSON object from model output (strips fences/prose). */
export function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new AppError(502, 'Match service returned a non-JSON answer');
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as unknown;
  } catch {
    throw new AppError(502, 'Match service returned malformed JSON');
  }
}

interface ChatChoice {
  message?: { content?: unknown };
}

/** Provider content can be a string or content-blocks array; join text parts. */
export function extractTextContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((b) =>
        typeof b === 'string' ? b : typeof b?.text === 'string' ? b.text : ''
      )
      .join('');
  }
  return '';
}

/**
 * Score a pasted resume against a pasted job description via OpenRouter chat.
 * Throws 502/503 AppErrors on provider failures; never logs resume/JD text.
 */
export async function generateMatchScore(
  resumeText: string,
  jobDescription: string
): Promise<MatchResult> {
  const apiKey = requireOpenRouterKey();
  const body = {
    model: env.RAG_CHAT_MODEL,
    temperature: 0.2,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content:
          `RESUME:\n${truncate(resumeText)}\n\nJOB DESCRIPTION:\n${truncate(jobDescription)}`,
      },
    ],
  };

  let emptyRetries = 0;
  let attempt = 0;
  for (;;) {
    let res: Response;
    try {
      res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          // OpenRouter recommended attribution headers. Some free-tier
          // routes reject requests without a referer; these are static
          // identifiers, never user data.
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'ApplyTrack AI Resume Match',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        throw new AppError(503, 'Match service timed out; try again shortly');
      }
      throw new AppError(503, 'Match service is unreachable; try again shortly');
    }

    if (res.status === 429 && attempt < MAX_RETRIES_429) {
      attempt += 1;
      await delay(1000 * 2 ** (attempt - 1));
      continue;
    }
    if (res.status === 429) throw new AppError(503, 'Match service is rate-limited; try again');
    if (res.status === 401) {
      throw new AppError(502, 'Match service authentication failed (check OPENROUTER_API_KEY)');
    }
    if (res.status === 402) {
      throw new AppError(502, 'Match service quota exceeded (OpenRouter credits)');
    }
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error(`[match] provider HTTP ${res.status}`);
      throw new AppError(502, `Match service failed (HTTP ${res.status})`);
    }
    const parsed = (await res.json().catch(() => null)) as {
      choices?: ChatChoice[];
    } | null;
    const content = parsed?.choices?.[0]?.message?.content;
    const text = extractTextContent(content);
    if (text.trim().length === 0) {
      // HTTP 200 with no visible text: reasoning consumed the budget or a
      // transient free-tier flake. Retry once before surfacing 502.
      if (emptyRetries < MAX_RETRIES_EMPTY) {
        emptyRetries += 1;
        continue;
      }
      throw new AppError(502, 'Match service returned an empty answer');
    }
    const json = extractJsonObject(text);
    const validated = matchResultSchema.safeParse(json);
    if (!validated.success) {
      throw new AppError(502, 'Match service returned an invalid analysis shape');
    }
    return {
      score: Math.round(Math.max(0, Math.min(100, validated.data.score))),
      matchedSkills: validated.data.matchedSkills,
      missingSkills: validated.data.missingSkills,
      explanation: validated.data.explanation,
    };
  }
}
