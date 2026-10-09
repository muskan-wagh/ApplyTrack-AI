import mongoose from 'mongoose';
import { Router, type Request, type Response } from 'express';
import { env } from '../config/env.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  // Liveness + dependency hints for the frontend "backend reachable?" check.
  // Never leaks secrets: only booleans and connection state names.
  const dbState = mongoose.connection.readyState;
  const dbLabel = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
  res.json({
    ok: true,
    service: 'applytrack-ai-backend',
    timestamp: new Date().toISOString(),
    db: dbLabel,
    ai: {
      // Match + RAG both require the OpenRouter key; the frontend uses this
      // to distinguish "backend up but AI unconfigured (503)" from
      // "backend down (network failure)".
      configured: env.OPENROUTER_API_KEY.length > 0,
      chatModel: env.RAG_CHAT_MODEL,
    },
  });
});

export default router;
