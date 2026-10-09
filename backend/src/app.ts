import cors from 'cors';
import express from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import applicationsRouter from './routes/applications.js';
import healthRouter from './routes/health.js';
import ragRouter from './routes/rag.js';
import resumesRouter from './routes/resumes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use('/api/health', healthRouter);
  app.use('/api/applications', applicationsRouter);
  app.use('/api/resumes', resumesRouter);
  app.use('/api/rag', ragRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
