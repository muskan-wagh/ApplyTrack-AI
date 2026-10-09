import mongoose, { type InferSchemaType } from 'mongoose';

export const APPLICATION_STATUSES = [
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
  'withdrawn',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const applicationSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true, maxlength: 160 },
    role: { type: String, required: true, trim: true, maxlength: 160 },
    status: { type: String, enum: APPLICATION_STATUSES, default: 'applied', index: true },
    appliedDate: { type: Date, default: () => new Date() },
    location: { type: String, trim: true, maxlength: 160, default: '' },
    jobUrl: { type: String, trim: true, maxlength: 2048, default: '' },
    source: { type: String, trim: true, maxlength: 80, default: '' },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
  },
  { timestamps: true }
);

applicationSchema.index({ company: 'text', role: 'text', location: 'text' });

export type ApplicationDoc = InferSchemaType<typeof applicationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Application =
  mongoose.models.Application ?? mongoose.model('Application', applicationSchema);
