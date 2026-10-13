# Architecture

Browser → Vercel (Next.js App Router) → Supabase (PostgreSQL, Auth, Storage)

## Layers
UI components → server actions / route handlers → business logic (`lib/scoring`, `lib/analytics`) → database (`lib/supabase`).

## Planned structure
```text
src/
  app/ (auth), dashboard, daily, goals, career, fitness, analytics, settings
  components/ dashboard, daily, goals, career, fitness, analytics, ui
  lib/ scoring, analytics, supabase, validation, utils
  hooks/  types/
supabase/ migrations/, seed.sql
```
Structure grows per milestone; do not pre-create empty folders.

## Data model (target)
users, goals, skills, skill_milestones, tasks, daily_entries, daily_outputs, work_sessions, entry_audit_log, job_applications, application_events, workouts, exercises, workout_sets, body_measurements, progress_photos, weekly_reviews, monthly_reviews.

MVP tables: tasks, daily_entries, daily_outputs, entry_audit_log, goals.

## Security
RLS on every user-owned table, Zod validation, server-only secrets, private storage bucket for photos, authenticated routes.

## State
Server state via Next.js/Supabase; local UI state in React; forms via React Hook Form.
