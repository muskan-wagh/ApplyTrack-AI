import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { requireOpenRouterKey } from '../lib/embeddings.js';
import {
  INSUFFICIENT_EVIDENCE,
  SYSTEM_PROMPT_VERSION,
  generateGroundedAnswer,
} from '../lib/generation.js';
import {
  MIN_SOURCE_HITS,
  countQuestionHits,
  expandKeywords,
  extractKeywords,
  retrieveChunks,
  type RetrievedChunk,
} from '../lib/retrieval.js';
import { AppError } from '../middleware/errorHandler.js';
import { ragQuerySchema } from '../schemas/rag.js';

const router = Router();

/** Keep evidence snippets readable and bounded. */
const SNIPPET_CHARS = 280;

/** Typed contract for a successful RAG answer (frontend AssistantAnswer). */
export const ragAnswerSchema = z.object({
  answer: z.string().min(1).max(2000),
  sources: z.array(
    z.object({
      label: z.string().min(1).max(120),
      snippet: z.string().min(1).max(400),
    })
  ),
});

export type RagAnswer = z.infer<typeof ragAnswerSchema>;

/**
 * Pick the most keyword-dense window (not just the first hit) so the Sources
 * section shows the relevant lines instead of contact headers. Evaluated on
 * the real resume: first-hit windowing showed "Portfolio| LinkedIn…" for a
 * backend question; densest-window shows the skills/backend lines instead.
 * Falls back to the prefix when nothing matches.
 */
export function selectSnippet(text: string, question: string, maxChars = SNIPPET_CHARS): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  const keywords = expandKeywords(extractKeywords(question)).filter((k) => k.length >= 3);
  const lower = clean.toLowerCase();
  if (keywords.length === 0) return `${clean.slice(0, maxChars).trimEnd()}…`;
  // Score candidate windows centered on each hit; keep the densest.
  const centers = new Set<number>();
  for (const k of keywords) {
    let from = 0;
    for (;;) {
      const idx = lower.indexOf(k, from);
      if (idx === -1) break;
      centers.add(idx + Math.floor(k.length / 2));
      from = idx + 1;
      if (centers.size > 40) break;
    }
    if (centers.size > 40) break;
  }
  if (centers.size === 0) return `${clean.slice(0, maxChars).trimEnd()}…`;
  const scoreWindow = (start: number): number => {
    const win = lower.slice(start, start + maxChars);
    let score = 0;
    for (const k of keywords) if (win.includes(k)) score += 1;
    return score;
  };
  let bestStart = 0;
  let bestScore = -1;
  for (const c of centers) {
    const start = Math.max(0, Math.min(clean.length - maxChars, c - Math.floor(maxChars / 2)));
    const s = scoreWindow(start);
    if (s > bestScore) {
      bestScore = s;
      bestStart = start;
    }
  }
  const end = Math.min(clean.length, bestStart + maxChars);
  // Avoid cutting mid-word at the edges.
  let snippet = clean.slice(bestStart, end).trim();
  const wsStart = snippet.search(/\s/);
  if (bestStart > 0 && wsStart > 0 && wsStart < 20) snippet = snippet.slice(wsStart + 1).trimStart();
  const prefix = bestStart > 0 ? '…' : '';
  const suffix = end < clean.length ? '…' : '';
  return `${prefix}${snippet}${suffix}`;
}

/**
 * Build deduplicated, relevance-filtered sources. Only chunks with
 * question-relevant terms (hits >= MIN_SOURCE_HITS, evaluated threshold) are
 * shown, ordered by retrieval rank. Irrelevant contact/education chunks are
 * excluded instead of overwhelming the answer — the generator still saw the
 * full ranked context, but Evidence lists only supporting passages.
 * The `answer` param is accepted for forward compatibility and ignored for
 * filtering (filtering on answer overlap would drop valid sources for
 * paraphrased answers); grounding is enforced in generation validation.
 *
 * Labels are user-facing ("Resume excerpt 1..N" in relevance order) — never
 * internal storage IDs like "Page 1 · Chunk 2", which mean nothing to users.
 */
export function buildSources(
  chunks: RetrievedChunk[],
  question: string,
  answer?: string
): { label: string; snippet: string }[] {
  void answer;
  const seen = new Set<string>();
  const out: { label: string; snippet: string }[] = [];
  for (const c of chunks) {
    if (countQuestionHits(c.text, question) < MIN_SOURCE_HITS) continue;
    const snippet = selectSnippet(c.text, question);
    const norm = snippet.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    out.push({ label: `Resume excerpt ${out.length + 1}`, snippet });
  }
  return out;
}

// POST /api/rag/query — { question, topK? } → { answer, sources: [{label, snippet}] }
// Contract matches the existing frontend AssistantAnswer type.
router.post('/query', async (req: Request, res: Response) => {
  const input = ragQuerySchema.parse(req.body);
  requireOpenRouterKey();

  const result = await retrieveChunks(input.question, input.topK ?? env.RAG_TOP_K);
  if (!result) {
    throw new AppError(404, 'No resume uploaded yet. Upload a PDF resume first.');
  }
  if (result.chunks.length === 0) {
    res.json({ ok: true, data: { answer: INSUFFICIENT_EVIDENCE, sources: [] } });
    return;
  }

  const answer = await generateGroundedAnswer(input.question, result.chunks);
  // When the model reports insufficient evidence, attach no sources: listing
  // retrieved chunks next to "I couldn't find that" would mislead readers
  // into thinking the answer came from them.
  const insufficient = answer.trim() === INSUFFICIENT_EVIDENCE;
  const sources = insufficient ? [] : buildSources(result.chunks, input.question, answer);
  // Validate the typed contract before responding; never return raw context
  // or malformed shapes as a plausible-looking success.
  const validated = ragAnswerSchema.safeParse({ answer, sources });
  if (!validated.success) {
    throw new AppError(502, 'Answer service returned an invalid response shape');
  }
  // Safe diagnostic metadata only: path, counts, labels, scores, model,
  // prompt version. No question text, no resume contents, no keys.
  // eslint-disable-next-line no-console
  console.log(
    `[rag] prompt=${SYSTEM_PROMPT_VERSION} model=${env.RAG_CHAT_MODEL} ` +
      `path=${result.path} chunks=${result.chunks.length} sources=${sources.length} ` +
      `labels=${result.chunks.map((c) => c.label).join('|')} ` +
      `scores=${result.chunks.map((c) => c.score.toFixed(3)).join(',')}`
  );
  res.json({
    ok: true,
    data: validated.data,
  });
});

export default router;
