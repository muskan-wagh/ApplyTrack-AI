/**
 * Pure resume-text chunking. No I/O, no network, no env access — the caller
 * supplies sizes so this unit stays deterministic and easy to test.
 */

export interface ChunkOptions {
  /** Target characters per chunk. Default 1000. */
  chunkSize?: number;
  /** Characters of overlap between consecutive chunks. Default 200. */
  overlap?: number;
  /** Safety cap on chunk count. Default 600. */
  maxChunks?: number;
}

export interface ResumeChunkText {
  text: string;
  /** 1-based page number (split on form-feed; 1 when unknown). */
  page: number;
  /** Human-readable source label, e.g. "Page 2 · Chunk 3". */
  label: string;
  /** 0-based global chunk index. */
  chunkIndex: number;
}

export const DEFAULT_CHUNK_SIZE = 1000;
export const DEFAULT_CHUNK_OVERLAP = 200;
export const DEFAULT_MAX_CHUNKS = 600;

export class ChunkLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChunkLimitError';
  }
}

function normalize(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Preferred break points, earliest-preference first, searched backwards. */
function findBreakPoint(window: string, hardEnd: number): number {
  const tailStart = Math.floor(window.length * 0.7);
  const tail = window.slice(tailStart);
  const candidates = ['\n\n', '\n', '. ', '; ', ' '];
  for (const sep of candidates) {
    const idx = tail.lastIndexOf(sep);
    if (idx >= 0) return tailStart + idx + sep.length;
  }
  return hardEnd;
}

/**
 * Split text into overlapping chunks, preserving page/section metadata.
 * Returns [] for empty or whitespace-only input (caller decides the 4xx).
 * Throws ChunkLimitError when maxChunks would be exceeded.
 */
export function chunkText(input: string, opts: ChunkOptions = {}): ResumeChunkText[] {
  const chunkSize = opts.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = opts.overlap ?? DEFAULT_CHUNK_OVERLAP;
  const maxChunks = opts.maxChunks ?? DEFAULT_MAX_CHUNKS;
  if (!Number.isInteger(chunkSize) || chunkSize < 100) {
    throw new Error('chunkSize must be an integer >= 100');
  }
  if (!Number.isInteger(overlap) || overlap < 0 || overlap >= chunkSize) {
    throw new Error('overlap must be an integer with 0 <= overlap < chunkSize');
  }

  const clean = normalize(input);
  if (!clean) return [];

  const pages = clean.split('\f').map((p) => p.trim()).filter(Boolean);
  const chunks: ResumeChunkText[] = [];

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx += 1) {
    const pageText = pages[pageIdx];
    let start = 0;
    while (start < pageText.length) {
      if (chunks.length >= maxChunks) {
        throw new ChunkLimitError(
          `Resume produced more than ${maxChunks} chunks; it is too long to index`
        );
      }
      let end = Math.min(start + chunkSize, pageText.length);
      if (end < pageText.length) {
        const natural = findBreakPoint(pageText.slice(start, end), end - start);
        end = start + natural;
      }
      const text = pageText.slice(start, end).trim();
      if (text) {
        const chunkIndex = chunks.length;
        chunks.push({
          text,
          page: pageIdx + 1,
          label: `Page ${pageIdx + 1} · Chunk ${chunkIndex + 1}`,
          chunkIndex,
        });
      }
      if (end >= pageText.length) break;
      const next = end - overlap;
      // Guarantee forward progress even on pathological whitespace runs.
      start = next > start ? next : end;
      while (start < pageText.length && /\s/.test(pageText[start]!)) start += 1;
    }
  }
  return chunks;
}
