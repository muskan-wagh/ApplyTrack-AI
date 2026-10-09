import path from 'node:path';
import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { env } from '../config/env.js';
import { ChunkLimitError, chunkText } from '../lib/chunk.js';
import { embedMany, requireOpenRouterKey } from '../lib/embeddings.js';
import { extractPdfText } from '../lib/parsePdf.js';
import { AppError } from '../middleware/errorHandler.js';
import { Resume, ResumeChunk } from '../models/Resume.js';

const router = Router();

const PDF_MIME_TYPES = new Set(['application/pdf']);
/** Minimum readable characters — below this the PDF is likely scanned images. */
const MIN_READABLE_CHARS = 50;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_RESUME_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!PDF_MIME_TYPES.has(file.mimetype)) {
      cb(new AppError(400, 'Only PDF files are accepted (application/pdf)'));
      return;
    }
    cb(null, true);
  },
});

function isTransactionUnsupported(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /replica set|transaction numbers|transactions are not supported|illegaloperation/i.test(
    msg
  );
}

type SessionOpts = { session?: mongoose.ClientSession };

/** Deactivate the old resume, activate the new one, delete the old docs. */
async function applySwap(
  newId: mongoose.Types.ObjectId,
  oldId: mongoose.Types.ObjectId | null,
  session: mongoose.ClientSession | null
): Promise<void> {
  const opts: SessionOpts = session ? { session } : {};
  if (oldId) {
    await Resume.updateOne({ _id: oldId }, { $set: { isActive: false } }, opts);
  }
  await Resume.updateOne({ _id: newId }, { $set: { isActive: true } }, opts);
  if (oldId) {
    await ResumeChunk.deleteMany({ resumeId: oldId }, opts);
    await Resume.deleteOne({ _id: oldId }, opts);
  }
}

/**
 * Failure-safe activation: transactional on replica sets (Atlas),
 * ordered non-transactional fallback elsewhere (local Mongo, memory server).
 */
async function swapActiveResume(
  newId: mongoose.Types.ObjectId,
  oldId: mongoose.Types.ObjectId | null
): Promise<void> {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    await applySwap(newId, oldId, session);
    await session.commitTransaction();
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch {
      // Abort itself can fail when transactions are unsupported — ignore.
    }
    if (isTransactionUnsupported(err)) {
      await applySwap(newId, oldId, null);
      return;
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

// POST /api/resumes/upload — multipart/form-data with a single `file` field.
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file || file.size === 0) {
    throw new AppError(400, 'No resume file uploaded. Attach a PDF as the `file` field.');
  }

  // Authoritative PDF check: magic bytes, not just the client-sent MIME type.
  // Cheap validation runs before the credentials check so garbage files get
  // a 400 even when the server is not AI-configured.
  if (file.buffer.length < 5 || file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new AppError(400, 'Uploaded file is not a valid PDF (bad signature)');
  }
  // Key check before expensive parse/embed work.
  requireOpenRouterKey();

  const rawText = await extractPdfText(file.buffer);
  const text = rawText.replace(/\r\n?/g, '\n').trim();
  if (text.length < MIN_READABLE_CHARS) {
    throw new AppError(
      400,
      'No readable text found in this PDF. Scanned or image-only PDFs are not supported.'
    );
  }
  if (text.length > env.MAX_RESUME_CHARS) {
    throw new AppError(
      413,
      `Resume text is too long (${text.length} chars; max ${env.MAX_RESUME_CHARS})`
    );
  }

  let chunks;
  try {
    chunks = chunkText(text);
  } catch (err) {
    if (err instanceof ChunkLimitError) throw new AppError(413, err.message);
    throw err;
  }
  if (chunks.length === 0) {
    throw new AppError(400, 'No readable text found in this PDF.');
  }

  // Embeddings are validated (dims, finite) inside embedMany.
  const vectors = await embedMany(chunks.map((c) => c.text));

  const current = (await Resume.findOne({ isActive: true })
    .select('_id')
    .lean()) as unknown as { _id: mongoose.Types.ObjectId } | null;
  const oldId = current ? current._id : null;

  const filename = path.basename(file.originalname || 'resume.pdf').slice(0, 255) || 'resume.pdf';
  let stagedId: mongoose.Types.ObjectId | null = null;
  try {
    const staged = await Resume.create({
      filename,
      charCount: text.length,
      chunkCount: chunks.length,
      isActive: false,
    });
    stagedId = staged._id as mongoose.Types.ObjectId;
    await ResumeChunk.insertMany(
      chunks.map((c, i) => ({
        resumeId: stagedId,
        chunkIndex: c.chunkIndex,
        page: c.page,
        label: c.label,
        text: c.text,
        embedding: vectors[i],
      })),
      { ordered: true }
    );
    await swapActiveResume(stagedId, oldId);
  } catch (err) {
    // Never lose the old resume: remove only the staged replacement.
    if (stagedId) {
      await ResumeChunk.deleteMany({ resumeId: stagedId });
      await Resume.deleteOne({ _id: stagedId });
    }
    throw err;
  }

  // Server log carries counts only — no filename (PII), no contents, no keys.
  // eslint-disable-next-line no-console
  console.log(`[resumes] indexed ${chunks.length} chunks (${text.length} chars)`);
  res.status(201).json({
    ok: true,
    data: {
      resumeId: String(stagedId),
      filename,
      chunkCount: chunks.length,
      charCount: text.length,
    },
  });
});

// GET /api/resumes/current — active resume metadata (never text or vectors).
router.get('/current', async (_req: Request, res: Response) => {
  const doc = (await Resume.findOne({ isActive: true })
    .select('filename charCount chunkCount createdAt updatedAt')
    .lean()) as unknown as {
    _id: mongoose.Types.ObjectId;
    filename: string;
    charCount: number;
    chunkCount: number;
    updatedAt: Date;
  } | null;
  if (!doc) {
    res.json({ ok: true, data: null });
    return;
  }
  res.json({
    ok: true,
    data: {
      id: String(doc._id),
      filename: doc.filename,
      chunkCount: doc.chunkCount,
      charCount: doc.charCount,
      uploadedAt: doc.updatedAt,
    },
  });
});

export default router;
