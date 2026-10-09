import { AppError } from '../middleware/errorHandler.js';

type PdfParseFn = (data: Buffer) => Promise<{ text?: unknown }>;

/**
 * Extract readable text from a PDF buffer. Thin seam around pdf-parse so
 * routes stay testable (mock this module) and error mapping lives in one
 * place. Never logs the buffer or its contents.
 *
 * NOTE: pdf-parse is loaded lazily at call time (never at module scope).
 * pdf-parse@1.x runs a filesystem self-test on load whenever
 * `module.parent` is null — true under ESM-style dynamic import and under
 * the vitest runner — which would break unrelated test files at collection
 * time. A CJS `require` keeps `module.parent` set and avoids the self-test.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  let pdfParse: PdfParseFn;
  try {
    if (typeof require === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      pdfParse = require('pdf-parse') as PdfParseFn;
    } else {
      const mod = (await import('pdf-parse')) as unknown as { default?: unknown };
      pdfParse = (typeof mod.default === 'function' ? mod.default : mod) as PdfParseFn;
    }
    if (typeof pdfParse !== 'function') throw new Error('bad export');
  } catch {
    throw new AppError(500, 'PDF parsing is unavailable on this server');
  }
  let data: { text?: unknown };
  try {
    data = await pdfParse(buffer);
  } catch {
    throw new AppError(
      400,
      'Could not extract readable text from this PDF. Scanned or image-only PDFs are not supported.'
    );
  }
  return typeof data.text === 'string' ? data.text : '';
}
