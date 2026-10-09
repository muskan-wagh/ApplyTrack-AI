import { z } from 'zod';

export const ragQuerySchema = z.object({
  question: z.string().trim().min(3, 'question is too short').max(2000),
  topK: z.coerce.number().int().min(1).max(10).optional(),
});

export type RagQueryInput = z.infer<typeof ragQuerySchema>;
