import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  CORS_ORIGIN: z
    .string()
    .default(
      'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174'
    ),
  // RAG (resume Q&A). OPENROUTER_API_KEY is optional at boot so existing
  // features keep working without AI credentials; RAG routes return 503
  // with a clear message when it is missing.
  OPENROUTER_API_KEY: z.string().optional().default(''),
  EMBEDDING_MODEL: z.string().min(1).default('openai/text-embedding-3-small'),
  EMBEDDING_DIMS: z.coerce.number().int().min(128).max(8192).default(1536),
  RAG_CHAT_MODEL: z.string().min(1).default('openai/gpt-4o-mini'),
  RAG_TOP_K: z.coerce.number().int().min(1).max(10).default(5),
  // Minimum cosine similarity for a chunk to be considered retrievable.
  // This is a noise filter only — never proof of answer correctness.
  RAG_MIN_SCORE: z.coerce.number().min(-1).max(1).default(0.1),
  MAX_RESUME_MB: z.coerce.number().min(1).max(20).default(5),
  MAX_RESUME_CHARS: z.coerce.number().int().min(1000).max(1000000).default(200000),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // Do not print secrets. Only print keys + validation issues.
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n- ${issues.join('\n- ')}`);
  }
  return parsed.data;
}

export const env = loadEnv();
