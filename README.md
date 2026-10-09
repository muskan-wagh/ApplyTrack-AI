# ApplyTrack AI

Job-application tracker with AI resume matching. Two independent apps in one repo:

- `frontend/` — React 19, Vite 8, TS, Tailwind v4, shadcn-compatible UI, Lucide icons
- `backend/` — Node 20, Express 4, TypeScript, MongoDB/Mongoose, zod validation, vitest

## Quickstart

Backend:

```bash
cd backend
cp .env.example .env   # set MONGODB_URI (local Mongo or Atlas)
npm install
npm run dev            # http://localhost:5000/api/health
npm test               # CRUD + validation tests (mongodb-memory-server)
```

Frontend:

```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev            # http://localhost:5173
npm run build
```

## API (backend, v1 so far)

- `GET /api/health`
- `POST /api/applications` — `{ company*, role*, status?, appliedDate?, location?, jobUrl?, source?, notes? }`
- `GET /api/applications?q=&status=&page=&limit=&sort=` — `sort: recent|oldest|company`
- `GET /api/applications/stats` — real counts `{ total, applied, interviews, offers, byStatus }`
- `GET /api/applications/:id`, `PATCH /api/applications/:id`, `DELETE /api/applications/:id`

Single-user v1 (no auth). Resume upload/matching/RAG come in backend Phases 4–5.

## Status

- Backend P1–P3 done and tested (8 vitest tests passing).
- Frontend: landing page (`/`) + dashboard (`/app/*`) with light/dark themes,
  real API data everywhere, and loading/empty/error states. Builds cleanly.
- Resume Match / Resume Assistant UIs are wired to the planned `POST /api/match`
  and `POST /api/rag/query` contracts and show an honest “backend pending” state
  until backend Phases 4–5 land. No mock scores or answers anywhere.
- Reference components: Avatar Extended integrated (offline initials); UIArc Button vendored but not default (theme-token conflict, documented in `frontend/README.md`); Velocity Tabs pending upstream source → accessible Tabs fallback.
- Never commit `.env`. See per-app READMEs.
