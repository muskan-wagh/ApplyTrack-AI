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

- `/` — landing page (`src/components/landing/*`): glass navbar with scroll-spy
  + mobile menu, staggered hero with an illustrative resume→fit→evidence mockup,
  overview split, three distinctly-treated features, timeline, tabbed product
  preview (sample data, clearly labelled), FAQ accordion, final CTA + footer.
  Motion is CSS-only (IntersectionObserver reveals, keyframed entrances) with a
  global `prefers-reduced-motion` guard — no new animation dependencies.
- `/app` — Overview: real stats, pipeline distribution, recent applications
- `/app/applications` — searchable/filterable table + Add/Edit dialog
- `/app/resume-match` — resume-vs-job form; result UI renders only from `POST /api/match`
- `/app/resume-assistant` — PDF upload + chat UI; answers render only from
  `POST /api/rag/query` with quoted evidence snippets

The job-match backend (Phase 4) is not implemented yet, so that page shows a
clear “Backend pending” state and surfaces the real connection error instead of mock data.
Resume Q&A is live once `OPENROUTER_API_KEY` is set (see `backend/README.md`);
without an uploaded resume the assistant shows an upload prompt and disables questions.

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
  monochrome — conflicting with this app’s indigo system. Re-evaluated for the
  landing redesign: landing CTAs are plain navigation links with no async work,
  so there is no loading/press-state use case. The shadcn `Button` stays the
  single button system; Arc source remains vendored for re-evaluation.
- **Space UI Avatar Extended** (MIT): adopted in the app top bar via `ProfileAvatar`
  (`AvatarExtended` + `AvatarRing` + `AvatarIndicator`). Offline-first initials
  fallback instead of the external `avatars.spaceui.one` image API. Deliberately
  not used on the landing page — no team/community exists to display.
- **Skecher Velocity Tabs**: docs are preview-only with no installable source, so
  the status filter and the landing preview switcher use the accessible in-house
  `Tabs` (arrow-key/Home/End nav, `role=tablist`). Tabs are only used where they
  switch real content — never decoration. No competing tab system installed.
