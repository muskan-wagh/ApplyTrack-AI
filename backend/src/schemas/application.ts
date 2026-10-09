import { z } from 'zod';
import { APPLICATION_STATUSES } from '../models/Application.js';

const statusEnum = z.enum(APPLICATION_STATUSES);

const urlOrEmpty = z
  .string()
  .max(2048)
  .optional()
  .default('')
  .refine((v) => v === '' || /^https?:\/\/.+\..+/.test(v), {
    message: 'jobUrl must be a valid http(s) URL or empty',
  });

export const createApplicationSchema = z.object({
  company: z.string().trim().min(1, 'company is required').max(160),
  role: z.string().trim().min(1, 'role is required').max(160),
  status: statusEnum.optional().default('applied'),
  appliedDate: z.coerce.date().optional(),
  location: z.string().trim().max(160).optional().default(''),
  jobUrl: urlOrEmpty,
  source: z.string().trim().max(80).optional().default(''),
  notes: z.string().trim().max(2000).optional().default(''),
});

export const updateApplicationSchema = createApplicationSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: 'At least one field must be provided' }
);

export const listQuerySchema = z.object({
  q: z.string().trim().max(160).optional().default(''),
  status: z
    .union([statusEnum, z.literal('all'), z.literal('')])
    .optional()
    .default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z.enum(['recent', 'oldest', 'company']).optional().default('recent'),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
