import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { embedOne } from './embeddings.js';
import { cosineSimilarity } from './similarity.js';
import { Resume, ResumeChunk } from '../models/Resume.js';

/** Atlas Vector Search index name — created manually in the Atlas UI. */
export const RESUME_VECTOR_INDEX = 'resume_chunk_vector';

/** Over-fetch multiplier so reranking/deduping still leaves topK good chunks. */
const OVER_FETCH_MULTIPLIER = 3;
const OVER_FETCH_MAX = 15;
/** Jaccard similarity above which two chunks count as near-duplicates. */
const DEDUPE_JACCARD_THRESHOLD = 0.85;

const STOPWORDS = new Set(
  'a,an,the,and,or,but,of,at,by,for,with,about,into,through,during,including,until,against,among,throughout,despite,towards,upon,is,are,was,were,be,been,being,have,has,had,having,do,does,did,doing,would,should,could,ought,i,you,he,she,it,we,they,them,his,her,its,our,their,this,that,these,those,am,as,from,to,in,on,off,out,over,under,again,further,then,once,here,there,when,where,why,how,all,any,both,each,few,more,most,other,some,such,no,nor,not,only,own,same,so,than,too,very,can,will,just,what,which,who,whom,does,have,candidate,resume,listed,list,exact,job,last,explicitly,confirm,explicit'.split(
    ','
  )
);

/** Lowercase alphanumeric tokens minus stopwords, min length 2. */
export function extractKeywords(question: string): string[] {
  const tokens = question
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim().replace(/^[#.]+|[#.]+$/g, ''))
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
  return [...new Set(tokens)];
}

/**
 * Generic category synonyms so question-aware ranking/snippet windows catch
 * paraphrases ("databases" → postgres/mongo/supabase, "backend" → node/api).
 * These are domain vocabulary, not resume facts — no hardcoded answers.
 */
const SYNONYMS: Record<string, string[]> = {
  backend: ['node', 'express', 'api', 'apis', 'rest', 'server', 'authentication', 'endpoint', 'microservice'],
  databases: ['postgres', 'postgresql', 'mongo', 'mongodb', 'sql', 'supabase', 'redis', 'sqlite', 'database', 'databases'],
  database: ['postgres', 'postgresql', 'mongo', 'mongodb', 'sql', 'supabase', 'redis', 'sqlite', 'database', 'databases'],
  frameworks: ['express', 'node', 'react', 'django', 'flask', 'spring', 'framework', 'frameworks'],
  framework: ['express', 'node', 'react', 'django', 'flask', 'spring', 'framework', 'frameworks'],
  frontend: ['react', 'vue', 'angular', 'typescript', 'css', 'ui', 'client'],
  rag: ['chunk', 'chunking', 'embedding', 'embeddings', 'retrieval', 'vector', 'semantic', 'openai', 'llm', 'document', 'search'],
  experience: ['built', 'implemented', 'worked', 'led', 'developed', 'engineered', 'experience'],
  techniques: ['chunking', 'embeddings', 'retrieval', 'workflow', 'technique', 'techniques'],
};

export function expandKeywords(keywords: string[]): string[] {
  const out = new Set(keywords);
  for (const k of keywords) {
    const syns = SYNONYMS[k];
    if (syns) for (const s of syns) out.add(s);
    // Reverse expansion for paraphrases ("server" → backend family, "postgres"
    // → databases family). Without this, "server-side work" would match zero
    // chunks even though the resume holds backend evidence.
    for (const [parent, children] of Object.entries(SYNONYMS)) {
      if (children.includes(k)) {
        out.add(parent);
        for (const s of children) out.add(s);
      }
    }
  }
  return [...out];
}

/**
 * Count expanded-keyword hits of `question` inside `text` (substring match
 * handles plurals/stems cheaply, e.g. postgres→postgresql).
 * Exported so route source-filtering uses the same signal as ranking.
 */
export function countQuestionHits(text: string, question: string): number {
  const keywords = expandKeywords(extractKeywords(question));
  return countKeywordHits(text, keywords);
}

/**
 * Minimum keyword hits for a retrieved chunk to be shown as a Source.
 * Evaluated on the real 4-chunk resume (2026-10):
 * backend Q → hits 5–12 (all kept), RAG Q → 9,14,14 vs outlier 1 (dropped),
 * databases Q → 8–18 (all kept), salary Q → 0,0,0,0 (all dropped → fallback).
 * Relevant evidence scores ≥5; noise scores 0–1. Threshold 2 separates them
 * without an arbitrary vector-score cutoff (cosine 0.45–0.56 and vector
 * 0.72–0.76 are too compressed to threshold safely on this corpus).
 */
export const MIN_SOURCE_HITS = 2;

/** True when the chunk carries question-relevant terms for Sources display. */
export function isRelevantToQuestion(text: string, question: string): boolean {
  return countQuestionHits(text, question) >= MIN_SOURCE_HITS;
}

function normalizeForDedupe(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function tokenSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 2)
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / (a.size + b.size - inter);
}

/**
 * Remove exact and near-duplicate chunks, preserving highest-score order.
 * Overlap comes from chunking (200-char overlap); without this the model
 * sees the same sentence twice and repeats it in the answer.
 */
export function dedupeChunks(chunks: RetrievedChunk[]): RetrievedChunk[] {
  const out: RetrievedChunk[] = [];
  const seenTexts = new Set<string>();
  const seenTokenSets: Set<string>[] = [];
  for (const c of chunks) {
    const norm = normalizeForDedupe(c.text);
    if (!norm || seenTexts.has(norm)) continue;
    const toks = tokenSet(c.text);
    let dup = false;
    for (const prev of seenTokenSets) {
      if (jaccard(toks, prev) >= DEDUPE_JACCARD_THRESHOLD) {
        dup = true;
        break;
      }
    }
    if (dup) continue;
    seenTexts.add(norm);
    seenTokenSets.push(toks);
    out.push(c);
  }
  return out;
}

function countKeywordHits(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const k of keywords) {
    if (k.length < 2) continue;
    // Substring match handles plurals/stems (postgres→postgresql) cheaply.
    if (lower.includes(k)) hits += 1;
  }
  return hits;
}

/**
 * Question-aware rerank: primary key is keyword overlap with the question,
 * tie-break is the embedding/vector score. This prioritizes e.g. backend
 * paragraphs for backend questions instead of contact/education chunks that
 * happen to score similarly in embedding space. Never discards — only
 * reorders — so complementary facts across chunks are preserved.
 */
export function rankChunksByQuestion(
  chunks: RetrievedChunk[],
  question: string
): RetrievedChunk[] {
  const keywords = expandKeywords(extractKeywords(question));
  if (keywords.length === 0) return [...chunks].sort((a, b) => b.score - a.score);
  return [...chunks]
    .map((c) => ({ c, hits: countKeywordHits(c.text, keywords) }))
    .sort((x, y) => y.hits - x.hits || y.c.score - x.c.score)
    .map((r) => r.c);
}

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
  /** Which retrieval path produced the chunks (safe diagnostic metadata). */
  path: 'vector' | 'cosine' | 'cosine-rescue';
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
 * Pipeline: over-fetch → dedupe → question-aware rerank → slice to topK.
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
  const fetchLimit = Math.min(OVER_FETCH_MAX, Math.max(limit, limit * OVER_FETCH_MULTIPLIER));
  const queryVector = await embedOne(question);
  // Both retrieval paths must operate in the same embedding space. A dims
  // mismatch (e.g. re-indexed with a different EMBEDDING_MODEL) would silently
  // corrupt cosine scores — fail loudly instead of returning garbage ranking.
  if (queryVector.length !== env.EMBEDDING_DIMS) {
    throw new Error(
      `Query embedding dims ${queryVector.length} != EMBEDDING_DIMS ${env.EMBEDDING_DIMS}`
    );
  }

  const finalize = (chunks: RetrievedChunk[]): RetrievedChunk[] =>
    rankChunksByQuestion(dedupeChunks(chunks), question).slice(0, limit);

  try {
    const raw = await vectorSearch(active._id, queryVector, fetchLimit);
    if (raw.length > 0) return { resumeId: active._id, chunks: finalize(raw), path: 'vector' };
    // Empty vector results are ambiguous: genuinely no match, or a missing /
    // misconfigured index (observed: some clusters return [] instead of
    // throwing for an unknown index name). Double-check with the cosine
    // fallback — at single-resume scale this is cheap, and when the index is
    // healthy both paths agree on []. Log a warning if cosine rescues
    // results so index problems stay visible instead of silently masked.
    const rescued = await cosineFallback(active._id, queryVector, fetchLimit);
    if (rescued.length > 0) {
      // eslint-disable-next-line no-console
      console.error(
        `[retrieval] $vectorSearch (${RESUME_VECTOR_INDEX}) returned 0 rows but cosine ` +
          `found ${rescued.length}; check the Atlas vector index definition`
      );
    }
    return { resumeId: active._id, chunks: finalize(rescued), path: 'cosine-rescue' };
  } catch (err) {
    // Server-side only: index name + short message, no question text, no keys.
    // eslint-disable-next-line no-console
    console.error(
      `[retrieval] $vectorSearch unavailable (${RESUME_VECTOR_INDEX}), using cosine fallback: ` +
        (err instanceof Error ? err.message.slice(0, 160) : 'unknown')
    );
    const chunks = await cosineFallback(active._id, queryVector, fetchLimit);
    return { resumeId: active._id, chunks: finalize(chunks), path: 'cosine' };
  }
}
