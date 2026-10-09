import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ ok: false, error: 'Not Found' });
}

// Centralized error handler — never leak stack traces or secrets to clients.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ ok: false, error: err.message });
    return;
  }
  if (err instanceof Error && err.name === 'ZodError') {
    const zod = err as unknown as {
      issues?: Array<{ path: Array<string | number>; message: string }>;
    };
    const first = zod.issues?.[0];
    const message = first
      ? `${first.path.join('.') || 'input'}: ${first.message}`
      : 'Invalid input';
    res.status(400).json({ ok: false, error: message });
    return;
  }
  if (err instanceof Error && err.name === 'ValidationError') {
    res.status(400).json({ ok: false, error: err.message });
    return;
  }
  if (err instanceof Error && (err.name === 'MulterError' || err.name === 'MulterErrorExtended')) {
    const code = (err as Error & { code?: string }).code;
    if (code === 'LIMIT_FILE_SIZE') {
      res
        .status(400)
        .json({ ok: false, error: `Resume file is too large (max ${env.MAX_RESUME_MB} MB)` });
      return;
    }
    res.status(400).json({ ok: false, error: 'Invalid file upload' });
    return;
  }
  if (err instanceof Error && err.name === 'CastError') {
    res.status(400).json({ ok: false, error: 'Invalid id format' });
    return;
  }
  // Log server-side only; keep client response generic.
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ ok: false, error: 'Internal Server Error' });
}
