# ApplyTrack AI — Frontend

React 19 + Vite 8 + TypeScript + Tailwind v4 + shadcn-compatible UI + Lucide icons.

## Setup

```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev            # http://localhost:5173
npm run build          # typecheck + production build
npm run lint           # oxlint
```

## Routes

- `/` — marketing landing page (honest copy, labeled sample-data preview)
- `/app` — Overview: real stats, pipeline distribution, recent applications
- `/app/applications` — searchable/filterable table + Add/Edit dialog
- `/app/resume-match` — resume-vs-job form; result UI renders only from `POST /api/match`
- `/app/resume-assistant` — chat UI; answers render only from `POST /api/rag/query`

The match/RAG backends (Phases 4–5) are not implemented yet, so those pages show a
clear “Backend pending” state and surface the real connection error instead of mock data.

## Theming

Light + dark via a `.dark` class on `<html>`, persisted in
`localStorage` (`applytrack-theme`: `light` | `dark` | `system`, defaults to system).
`index.html` applies the stored theme before first paint (no flash); the Sun/Moon
toggle lives in the site nav and the app top bar. Tokens are semantic CSS variables
(`--background`, `--card`, `--primary`, …) with full dark overrides in `src/index.css`.
Type: Inter for UI, JetBrains Mono for metrics/labels/code.

## Structure

- `src/components/ui/` — shadcn-style primitives, all theme-aware
- `src/components/spaceui/avatar-extended.tsx` — Space UI Avatar Extended (MIT),
  used via `src/components/ProfileAvatar.tsx` with a local-initials fallback
- `src/components/arc/` — vendored UIArc Button source (evaluated, not default)
- `src/components/layout/AppShell.tsx` — sidebar, top bar, mobile drawer
- `src/pages/` — Landing, Overview, Applications, ResumeMatch, ResumeAssistant
- `src/lib/api.ts` — backend client (`VITE_API_URL`), incl. pending match/RAG contracts
- `src/lib/theme.tsx` — ThemeProvider + useTheme

## Third-party component decisions

- **UIArc Button** (`@uiarc/button`, vendored): installs cleanly and `motion` is
  compatible, but its styles depend on UIArc theme tokens and its `primary` is
  monochrome — conflicting with this app’s indigo system. The shadcn `Button`
  stays the single button system; Arc source remains vendored for re-evaluation.
- **Space UI Avatar Extended** (MIT): adopted in the top bar via `ProfileAvatar`
  (`AvatarExtended` + `AvatarRing` + `AvatarIndicator`). Offline-first initials
  fallback instead of the external `avatars.spaceui.one` image API.
- **Skecher Velocity Tabs**: docs are preview-only with no installable source, so the
  status filter uses the accessible in-house `Tabs` (arrow-key/Home/End nav,
  `role=tablist`). No competing tab system installed.
