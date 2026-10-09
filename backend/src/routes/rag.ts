import { Router, type Request, type Response } from 'express';
import { env } from '../config/env.js';
import { requireOpenRouterKey } from '../lib/embeddings.js';
import { INSUFFICIENT_EVIDENCE, generateGroundedAnswer } from '../lib/generation.js';
import { retrieveChunks } from '../lib/retrieval.js';
import { AppError } from '../middleware/errorHandler.js';
import { ragQuerySchema } from '../schemas/rag.js';

const router = Router();

/** Keep evidence snippets readable and bounded. */
const SNIPPET_CHARS = 280;

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
  // Server log: counts only — no question text, no resume contents, no keys.
  // eslint-disable-next-line no-console
  console.log(`[rag] answered from ${result.chunks.length} chunks`);
  // When the model reports insufficient evidence, attach no sources: listing
  // retrieved chunks next to "I couldn't find that" would mislead readers
  // into thinking the answer came from them.
  const insufficient = answer.trim() === INSUFFICIENT_EVIDENCE;
  res.json({
    ok: true,
    data: {
      answer,
      sources: insufficient
        ? []
        : result.chunks.map((c) => ({
            label: c.label,
            snippet: c.text.slice(0, SNIPPET_CHARS),
          })),
    },
  });
});

export default router;
