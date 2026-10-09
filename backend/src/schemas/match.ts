import { z } from 'zod';

// Pasted-text matching contract — mirrors frontend ResumeMatch validation
// (50+ chars each side) with server-side upper bounds to cap LLM cost.
export const matchSchema = z.object({
  resumeText: z.string().trim().min(50, 'resumeText needs at least 50 characters').max(20000),
  jobDescription: z
    .string()
    .trim()
    .min(50, 'jobDescription needs at least 50 characters')
    .max(20000),
});

export type MatchInput = z.infer<typeof matchSchema>;

// Validated shape of the model-returned match analysis.
export const matchResultSchema = z.object({
  score: z.coerce.number().min(0).max(100),
  matchedSkills: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  missingSkills: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  explanation: z.string().trim().min(1).max(1500),
});

export type MatchResult = z.infer<typeof matchResultSchema>;
