# Mindful Therapy 360 — Setup Guide

AI-powered IEP & special education suite. Next.js 16 + TypeScript + Tailwind 4 + Prisma + liquid-glass UI.

## Quick start

```bash
# 1. Install dependencies
bun install        # or: npm install

# 2. Copy env template and fill in values
cp .env.example .env
# Edit .env — set ZAI_API_KEY and NEXTAUTH_SECRET (see below)

# 3. Create the database + seed sample data
bun run db:push
bun run prisma/seed.ts

# 4. Start the dev server
bun run dev        # or: npm run dev
# Open http://localhost:3000
```

## Demo login

```
Email:    admin@mindfultherapy360.com
Password: genius123
```

5 sample students are seeded (Aarav, Sophia, Liam, Ananya, Ethan) with goals, assessments, and progress records.

## Environment variables (`.env`)

| Variable | Required | Example |
|---|---|---|
| `DATABASE_URL` | yes | `file:./db/custom.db` (SQLite) or `postgresql://...` (Postgres) |
| `ZAI_API_KEY` | yes | your Z.ai API key (powers all AI features) |
| `NEXTAUTH_SECRET` | yes | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | yes | `http://localhost:3000` (or your deploy URL) |
| `ADMIN_EMAIL` | optional | `admin@mindfultherapy360.com` (demo admin) |
| `ADMIN_PASSWORD` | optional | `genius123` |
| `GITHUB_ID` / `GITHUB_SECRET` | optional | enable GitHub OAuth |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional | enable Google OAuth |
| `NEXT_PUBLIC_OAUTH_GITHUB=1` | optional | show GitHub button on login |
| `NEXT_PUBLIC_OAUTH_GOOGLE=1` | optional | show Google button on login |

## Tech stack

- **Next.js 16** (App Router, standalone output) + **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** (27 components) + **lucide-react** icons
- **Prisma 6** + SQLite (dev) / Postgres (prod)
- **NextAuth v4** (credentials + optional GitHub/Google)
- **TanStack Query** (server state) + **Zustand** (client state)
- **Recharts** (charts) + **Sonner** (toasts)
- **z-ai-web-dev-sdk** (AI: goals, summaries, reports, lessons, accommodations, therapy, behaviour)
- **liquid-glass.js** (Apple-style refraction on glass cards)

## Project structure

```
prisma/              schema.prisma + seed.ts
public/              logo-mark-*.png, favicon.png, liquid-glass.js
src/app/             layout, page, providers, error/loading/not-found
  api/               23 route handlers (students, goals, assessments, therapy,
                     behaviour, progress, reports, dashboard, auth, 9 AI routes)
  api/ai/            AI generation endpoints (all use src/lib/ai.ts)
src/components/      app-shell, login-screen, student-form-dialog, markdown-view
  ui/                27 shadcn/ui components + glass.tsx (GlassCard)
  views/             11 view files (dashboard, students, profile, assessment, etc.)
    goals/           6 subcomponents (goals-view split)
    progress/        6 subcomponents (progress-view split)
src/lib/             ai.ts, auth.ts, db.ts, constants.ts, types.ts, store.ts,
                     use-active-student.ts, use-liquid-glass.ts, student-utils.ts
```

## Features (12 modules)

1. **Dashboard** — KPIs, charts, alerts, upcoming reviews, recent students
2. **Students** — search/filter/CRUD, card grid
3. **Profile** — full student info, medical, family, strengths
4. **Assessment** — upload + AI-generated 13-field structured summary
5. **Goals** — AI SMART goal generator across 19 domains + AI suggestions
6. **Therapy Planner** — AI weekly plans per therapy type
7. **Behaviour Plan** — AI ABC analysis + function-based support plan
8. **Progress** — charts, role ratings, AI progress summary
9. **Reports** — AI report generator (10 report types), markdown render, copy/download
10. **Lesson Planner** — AI differentiated lessons
11. **Accommodations** — AI 7-category accommodation generator
12. **Search** — by name/diagnosis/school/grade/therapist/goal/review date

## Deployment

See `Dockerfile`, `docker-compose.yml`, `render.yaml` for production configs.
SQLite works for single-server (mounted volume); use Postgres for multi-user/autoscaling.

## Notes

- All AI output is editable — the professional remains in charge.
- Auth gates all `/api/*` routes except `/api/auth/*` (via `src/proxy.ts`).
- Liquid-glass refraction is Chromium-only; Safari/Firefox get frosted fallback.
- Build enforces TypeScript (`ignoreBuildErrors: false`).
