import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { embedOne } from './embeddings.js';
import { cosineSimilarity } from './similarity.js';
import { Resume, ResumeChunk } from '../models/Resume.js';

/** Atlas Vector Search index name — created manually in the Atlas UI. */
export const RESUME_VECTOR_INDEX = 'resume_chunk_vector';

export interface RetrievedChunk {
  text: string;
  label: string;
  page: number;
  /** Cosine similarity (fallback) or vectorSearchScore (Atlas), higher is better. */
  score: number;
}

export interface RetrievalResult {
  resumeId: mongoose.Types.ObjectId;
  chunks: RetrievedChunk[];
}

interface ActiveResume {
  _id: mongoose.Types.ObjectId;
}

async function getActiveResume(): Promise<ActiveResume | null> {
  return (await Resume.findOne({ isActive: true })
    .select('_id')
    .lean()) as unknown as ActiveResume | null;
}

interface VectorRow {
  text: string;
  label: string;
  page: number;
  score: number;
}

/** Atlas $vectorSearch path. Throws when the index is missing/unusable. */
async function vectorSearch(
  resumeId: mongoose.Types.ObjectId,
  queryVector: number[],
  limit: number
): Promise<RetrievedChunk[]> {
  const rows = (await ResumeChunk.aggregate([
    {
      $vectorSearch: {
        index: RESUME_VECTOR_INDEX,
        path: 'embedding',
        queryVector,
        numCandidates: Math.max(20, limit * 10),
        limit,
        filter: { resumeId },
      },
    },
    {
      $project: {
        _id: 0,
        text: 1,
        label: 1,
        page: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ])) as VectorRow[];
  return rows
    .filter((r) => typeof r.score === 'number' && r.score >= env.RAG_MIN_SCORE)
    .map((r) => ({ text: r.text, label: r.label, page: r.page, score: r.score }));
}

interface FallbackRow {
  text: string;
  label: string;
  page: number;
  embedding: number[];
}

/**
 * App-layer cosine fallback: used when Atlas Vector Search is unavailable
 * (no index, local Mongo, memory server). Fine for single-resume scale
 * (tens of chunks); Atlas handles larger corpora.
 */
async function cosineFallback(
  resumeId: mongoose.Types.ObjectId,
  queryVector: number[],
  limit: number
): Promise<RetrievedChunk[]> {
  const rows = (await ResumeChunk.find({ resumeId })
    .select('text label page embedding')
    .lean()) as unknown as FallbackRow[];
  const scored: RetrievedChunk[] = [];
  for (const row of rows) {
    if (!Array.isArray(row.embedding) || row.embedding.length !== queryVector.length) continue;
    let score: number;
    try {
      score = cosineSimilarity(queryVector, row.embedding);
    } catch {
      continue;
    }
    if (score >= env.RAG_MIN_SCORE) {
      scored.push({ text: row.text, label: row.label, page: row.page, score });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/**
 * Embed the question and fetch the most relevant chunks of the active resume.
 * Returns null when no resume is indexed (route maps to 404).
 * RAG_MIN_SCORE is a noise filter only — never proof of correctness; the
 * generator must still ground every claim, and empty results trigger the
 * insufficient-evidence fallback.
 */
export async function retrieveChunks(
  question: string,
  topK?: number
): Promise<RetrievalResult | null> {
  const active = await getActiveResume();
  if (!active) return null;
  const limit = topK ?? env.RAG_TOP_K;
  const queryVector = await embedOne(question);

  try {
    const chunks = await vectorSearch(active._id, queryVector, limit);
    if (chunks.length > 0) return { resumeId: active._id, chunks };
    // Empty vector results are ambiguous: genuinely no match, or a missing /
    // misconfigured index (observed: some clusters return [] instead of
    // throwing for an unknown index name). Double-check with the cosine
    // fallback — at single-resume scale this is cheap, and when the index is
    // healthy both paths agree on []. Log a warning if cosine rescues
    // results so index problems stay visible instead of silently masked.
    const rescued = await cosineFallback(active._id, queryVector, limit);
    if (rescued.length > 0) {
      // eslint-disable-next-line no-console
      console.error(
        `[retrieval] $vectorSearch (${RESUME_VECTOR_INDEX}) returned 0 rows but cosine ` +
          `found ${rescued.length}; check the Atlas vector index definition`
      );
    }
    return { resumeId: active._id, chunks: rescued };
  } catch (err) {
    // Server-side only: index name + short message, no question text, no keys.
    // eslint-disable-next-line no-console
    console.error(
      `[retrieval] $vectorSearch unavailable (${RESUME_VECTOR_INDEX}), using cosine fallback: ` +
        (err instanceof Error ? err.message.slice(0, 160) : 'unknown')
    );
    const chunks = await cosineFallback(active._id, queryVector, limit);
    return { resumeId: active._id, chunks };
  }
}
