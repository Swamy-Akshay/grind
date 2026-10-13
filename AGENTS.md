# Personal Progress OS — Codex Instructions

## Project
Personal execution, career-progress, lifestyle and fitness tracking app. Built as a real deployed personal application (single user first, multi-user-ready architecture).
Loop: Goal → Plan → Daily Execution → Focused Time → Output → Score → Analytics → Review.
Accurate measurement over gamification. Full specification: `docs/SPEC.md`. Read it before large features.

## Stack
Next.js (App Router), TypeScript (strict), React, Tailwind CSS, shadcn/ui, Supabase (PostgreSQL, Auth, RLS, Storage), Recharts, Zod, React Hook Form, Lucide React. Deploy: Vercel + Supabase.
Use the simplest architecture that works. No new libraries without a clear reason. No Redux.

## Engineering Principles
1. Strict TypeScript.
2. Prefer server-side data access.
3. Business logic separate from UI components.
4. Scoring is independent and unit-tested.
5. Validate all input with Zod.
6. No duplicated business logic across pages.
7. No hardcoded data that belongs in the database.
8. No unnecessary abstractions; maintainability over cleverness.
9. Build incrementally; verify each feature before moving on.
10. Do not rewrite working code unnecessarily.

## Scoring Rules (see docs/SCORING.md)
completionRatio = actualFocusedHours / targetHours
basePoints = priority × min(completionRatio, 1)
- Base points never exceed the task's priority. No negative points.
- Extra hours are stored separately as bonus effort; they never raise the base score and never offset missed days.
- Max base score for priorities 1–10 = 55 (priorities are configurable, so compute max from active tasks).
- Score uses focused time, not elapsed time.

## Evidence / Output
Career tasks support optional evidence (DSA problems/topics, project feature/bug/API, job apps/referrals, learning module). Lifestyle tasks need none.

## Anti-Gaming
- Retroactive edits to past entries must be audit-logged (previous value, new value, timestamp).
- Streaks are secondary metrics.
- Career progress must not be masked by lifestyle activity; keep Career / Lifestyle / Fitness scores separate.
- Skill % is a self-defined milestone indicator, never a claim of employability.
- Show data; do not claim causation from small samples.

## Architecture Layers
UI → application logic (server actions / route handlers) → business logic → database.
- `src/lib/scoring/` scoring (pure functions, tested)
- `src/lib/analytics/` aggregations
- `src/lib/validation/` Zod schemas
- `src/lib/supabase/` DB clients / centralized access
- `supabase/migrations/` all schema changes; RLS on every user table

## Process
Small changes: inspect → smallest change → run checks → fix → summarize.
Large features: understand → inspect → write/update plan in `.agent/PLANS.md` → implement incrementally → test → verify.
Build order: DATABASE → DOMAIN MODEL → SCORING → SERVER ACTIONS/API → VALIDATION → UI → CHARTS.

## UI
Personal analytics dashboard, not a game. Clear hierarchy, readable numbers, minimal clutter, responsive, accessible. No XP, coins, badges, motivational animations, or decorative charts. Daily logging must take < 5 minutes.

## Current Priority (MVP only)
1. Project setup  2. Auth  3. Database foundation  4. Tasks  5. Daily time logging  6. Weighted scoring  7. Dashboard  8. Basic analytics
Do NOT start Job CRM, Gym, Nutrition or advanced analytics until daily tracking is stable.

## Definition of Done
TypeScript passes, lint passes, relevant tests pass, no console errors, loading/empty/error states exist, responsive considered. Never claim a feature works without verifying it.
