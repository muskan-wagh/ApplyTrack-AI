import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { Application } from '../models/Application.js';
import {
  createApplicationSchema,
  listQuerySchema,
  updateApplicationSchema,
} from '../schemas/application.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

function assertObjectId(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, 'Invalid application id');
  }
}

// GET /api/applications/stats — real counts, no invented analytics.
router.get('/stats', async (_req: Request, res: Response) => {
  const [total, byStatus] = await Promise.all([
    Application.countDocuments(),
    Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  const counts: Record<string, number> = {};
  for (const row of byStatus as Array<{ _id: string; count: number }>) {
    counts[row._id] = row.count;
  }
  const interviews = (counts.interview ?? 0) + (counts.screening ?? 0);
  const offers = (counts.offer ?? 0) + (counts.hired ?? 0);
  res.json({
    ok: true,
    data: {
      total,
      applied: counts.applied ?? 0,
      screening: counts.screening ?? 0,
      interview: counts.interview ?? 0,
      interviews,
      offer: counts.offer ?? 0,
      hired: counts.hired ?? 0,
      offers,
      rejected: counts.rejected ?? 0,
      withdrawn: counts.withdrawn ?? 0,
      byStatus: counts,
    },
  });
});

// GET /api/applications?q=&status=&page=&limit=&sort=
router.get('/', async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  const filter: Record<string, unknown> = {};
  if (query.status && query.status !== 'all') filter.status = query.status;
  if (query.q) {
    filter.$or = [
      { company: { $regex: query.q, $options: 'i' } },
      { role: { $regex: query.q, $options: 'i' } },
      { location: { $regex: query.q, $options: 'i' } },
    ];
  }
  const sortMap: Record<string, Record<string, 1 | -1>> = {
    recent: { appliedDate: -1, createdAt: -1 },
    oldest: { appliedDate: 1, createdAt: 1 },
    company: { company: 1 },
  };
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    Application.find(filter).sort(sortMap[query.sort]).skip(skip).limit(query.limit).lean(),
    Application.countDocuments(filter),
  ]);
  res.json({
    ok: true,
    data: items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.max(1, Math.ceil(total / query.limit)),
    },
  });
});

// POST /api/applications
router.post('/', async (req: Request, res: Response) => {
  const input = createApplicationSchema.parse(req.body);
  const doc = await Application.create(input);
  res.status(201).json({ ok: true, data: doc });
});

// GET /api/applications/:id
router.get('/:id', async (req: Request, res: Response) => {
  assertObjectId(req.params.id);
  const doc = await Application.findById(req.params.id).lean();
  if (!doc) throw new AppError(404, 'Application not found');
  res.json({ ok: true, data: doc });
});

// PATCH /api/applications/:id
router.patch('/:id', async (req: Request, res: Response) => {
  assertObjectId(req.params.id);
  const input = updateApplicationSchema.parse(req.body);
  const doc = await Application.findByIdAndUpdate(req.params.id, input, {
    new: true,
    runValidators: true,
  }).lean();
  if (!doc) throw new AppError(404, 'Application not found');
  res.json({ ok: true, data: doc });
});

// DELETE /api/applications/:id
router.delete('/:id', async (req: Request, res: Response) => {
  assertObjectId(req.params.id);
  const doc = await Application.findByIdAndDelete(req.params.id).lean();
  if (!doc) throw new AppError(404, 'Application not found');
  res.json({ ok: true, data: { id: req.params.id } });
});

export default router;
