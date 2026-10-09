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

## Env

See `.env.example`. `MONGODB_URI` is required; validated with zod. Secrets are never logged.
