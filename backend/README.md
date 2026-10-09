# ApplyTrack AI — Backend (P1 foundation)

Express + TypeScript + MongoDB/Mongoose. Independent of the frontend.

## Setup

```bash
cd backend
cp .env.example .env   # edit MONGODB_URI for local Mongo or Atlas
npm install
npm run dev            # http://localhost:5000/api/health
```

## Endpoints (P1)

- `GET /api/health` → `{ ok, service, timestamp }`

## Resume RAG (custom TypeScript pipeline, no LangChain)

- `POST /api/resumes/upload` — multipart `file` (PDF only, ≤ `MAX_RESUME_MB`).
  Extracts text with `pdf-parse`, chunks with overlap, embeds via OpenRouter,
  and stores chunks + vectors. Re-uploading stages the replacement first and
  only then deactivates/deletes the previous resume, so a failed replacement
  never loses the current one.
- `GET /api/resumes/current` — active resume metadata (never text/vectors).
- `POST /api/rag/query` — `{ question, topK? }` →
  `{ answer, sources: [{ label, snippet }] }`. Answers are grounded in
  retrieved chunks only; when the resume holds no evidence the answer is
  exactly `I couldn't find that in the uploaded resume.` with `sources: []`.
- Without `OPENROUTER_API_KEY`, RAG routes return `503`; everything else
  keeps working. Job-description matching (`POST /api/match`) is intentionally
  separate and still unimplemented.

## Atlas Vector Search setup (manual, one-time)

The cluster needs a vector index named `resume_chunk_vector` on the
`resumechunks` collection (Atlas UI → Database → Search → Create Search
Index → JSON editor). Without it the API still works via an automatic
in-app cosine-similarity fallback (used by tests and local Mongo too).

```json
{
  "name": "resume_chunk_vector",
  "type": "vector",
  "collectionName": "resumechunks",
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 1536, "similarity": "cosine" },
    { "type": "filter", "path": "resumeId" }
  ]
}
```

Notes: keep `numDimensions` equal to `EMBEDDING_DIMS` (1536 for the default
`openai/text-embedding-3-small`; re-index from scratch if you change models).
Free clusters allow 3 search/vector indexes, Flex allows 10.

## Env

See `.env.example`. `MONGODB_URI` is required; validated with zod. Secrets are never logged.
