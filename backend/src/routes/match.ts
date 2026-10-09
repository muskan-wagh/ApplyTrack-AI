import { Router, type Request, type Response } from 'express';
import { generateMatchScore } from '../lib/match.js';
import { matchSchema } from '../schemas/match.js';

const router = Router();

// POST /api/match — { resumeText, jobDescription } →
// { score, matchedSkills, missingSkills, explanation }
// Contract matches the existing frontend MatchResult type.
router.post('/', async (req: Request, res: Response) => {
  const input = matchSchema.parse(req.body);
  const result = await generateMatchScore(input.resumeText, input.jobDescription);
  // Server log: score only — no resume text, no job description, no keys.
  // eslint-disable-next-line no-console
  console.log(`[match] scored ${result.score}/100`);
  res.json({ ok: true, data: result });
});

export default router;
