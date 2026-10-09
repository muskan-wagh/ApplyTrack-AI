import mongoose, { type InferSchemaType } from 'mongoose';

/**
 * Single-user v1: at most one Resume has isActive=true; re-upload stages a
 * replacement and only then deactivates/deletes the previous one, so a
 * failed replacement never loses the current resume.
 * ownerId is a placeholder for future per-user isolation.
 */
const resumeSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, trim: true, maxlength: 255 },
    charCount: { type: Number, required: true, min: 0 },
    chunkCount: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: false, index: true },
    ownerId: { type: String, default: 'single-user', index: true, maxlength: 120 },
  },
  { timestamps: true }
);

const resumeChunkSchema = new mongoose.Schema(
  {
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      index: true,
    },
    chunkIndex: { type: Number, required: true, min: 0 },
    page: { type: Number, required: true, min: 1 },
    label: { type: String, required: true, trim: true, maxlength: 120 },
    text: { type: String, required: true, maxlength: 6000 },
    // 1536-d by default (see EMBEDDING_DIMS). Atlas Vector Search index on
    // this field is created manually in the Atlas UI (see README/docs).
    embedding: { type: [Number], required: true },
  },
  { timestamps: true }
);

resumeChunkSchema.index({ resumeId: 1, chunkIndex: 1 }, { unique: true });

export type ResumeDoc = InferSchemaType<typeof resumeSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type ResumeChunkDoc = InferSchemaType<typeof resumeChunkSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Resume =
  mongoose.models.Resume ?? mongoose.model('Resume', resumeSchema);
export const ResumeChunk =
  mongoose.models.ResumeChunk ?? mongoose.model('ResumeChunk', resumeChunkSchema);
