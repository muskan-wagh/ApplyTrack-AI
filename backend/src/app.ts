import cors from 'cors';
import express from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import applicationsRouter from './routes/applications.js';
import healthRouter from './routes/health.js';
import matchRouter from './routes/match.js';
import ragRouter from './routes/rag.js';
import resumesRouter from './routes/resumes.js';

function isLocalOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    const host = u.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return true;
    return false;
  } catch {
    return false;
  }
}

export function createApp() {
  const app = express();

  app.use(helmet());
  const allowed = env.CORS_ORIGIN.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.use(
    cors({
      // Permanent fix for "Failed to fetch" on 127.0.0.1 / :5174 / preview URLs:
      // exact allow-list + any localhost loopback (any port) + non-browser
      // requests (no Origin, e.g. curl / Vite proxy) which need no CORS check.
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (allowed.includes(origin) || isLocalOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use('/api/health', healthRouter);
  app.use('/api/applications', applicationsRouter);
  app.use('/api/resumes', resumesRouter);
  app.use('/api/rag', ragRouter);
  app.use('/api/match', matchRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
