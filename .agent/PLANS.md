# Execution Plans

Codex: write/update a plan here before any large multi-step feature. Keep the active plan on top; move finished plans to "Completed".

## Plan template
### <Feature name>
- Goal:
- Scope / non-goals:
- Files to touch:
- Steps:
  1. 
- Verification (tests, lint, tsc, manual):
- Risks / open questions:
- Status:

## Active
### Phase 3.3 — trustworthy gym performance analytics
- Goal: add a deterministic calculation layer for per-exercise performance, primary-muscle logged sets, resistance volume, and explicit-schedule consistency without changing the Gym UI or stored workout history.
- Scope: pure functions and tests only. Use exercise ID as the variation boundary; calculate eligible Epley e1RM, session comparisons, volume, primary-muscle classifications, weekly/14-day logged sets, and planned-date consistency. No charts, new visualizations, logger changes, or inferred workout schedule.
- Files to touch: `src/lib/analytics/gym-progress.ts`, a centralized exercise-classification helper, their tests, and this plan. No migration is required.
- Steps: inspect existing set schema and seed library; model pure workout-set facts; classify recognized exercise names with metadata fallback; add session and comparison calculations; add set/volume/consistency aggregations; cover required edge cases with unit tests; run full checks.
- Verification: resistance-only e1RM eligibility; no cross-exercise comparisons; forearm classification independent of broad UI grouping; valid date-window aggregates; explicit-plan-only consistency; existing chart-series tests remain passing.
- Known limitations: RIR is null, working/warm-up set type does not exist, no body measurements or training schedule exist, and assisted/bodyweight sets cannot produce reliable e1RM. These remain deliberately excluded.
- Status: Complete. TypeScript and lint pass. The production compilation succeeds; its sandboxed final worker and Vitest's child-process startup are blocked by Windows `spawn EPERM`, so the test suite must be run in the normal local shell before release.

### Phase 3.2 — gym library and daily-workout persistence
- Goal: improve exercise-library management and make the Today workout practical to revisit, while exposing day volume/PR context and placing date navigation in the Gym navbar.
- Scope: searchable/filterable exercise management; group normalization (remove Forearms, merge rear-delt labels into Shoulders); selection-order preservation; retained set-entry defaults and temporary validation feedback; saved-workout reopening; daily volume/PR summaries; date control placement and contrast. No changes to past workout facts or scoring.
- Database: a forward-only migration changes only `exercises.muscle_group` values, preserving IDs and all workout-set history.
- Steps: normalize groups; add library filters; fix ordered selection and saved workout reload; refine Add set defaults/feedback; compute and display factual day metrics; move Gym date controls into navbar; verify.
- Verification: apply migration; validate filters and muscle labels; verify a saved date reopens with its sets; selection order matches picking order; zero/default set behavior is clear; tests, TypeScript, lint, and build pass.
- Status: Implemented and locally verified: 18 tests, TypeScript, ESLint, and the production build pass. Apply the group-normalization migration in Supabase before final live verification.

### Phase 3.1 — daily score integrity and gym interaction refinement
- Goal: ensure checkbox task completions contribute consistently to daily and charted scores, make date controls legible in the dark theme, and streamline gym logging, discovery, navigation, and calendar-based charts.
- Scope: preserve the existing schema and workout history. Add no dependencies or new scoring rules. Cover daily checkbox values in all score projections; use contrast-safe native date inputs; add exercise text + muscle-group filtering; make set creation draft-first with selection-scoped edit/delete controls; replace button-like Gym page links with a proper text navigation bar; and generate complete scheduled date/week chart series rather than plotting only recorded rows.
- Files to touch: daily page/analytics and tests; Gym analytics/tests, Gym pages/components, shared theme styling, and this plan.
- Steps:
  1. Carry `is_completed` through all daily score series and cover checkbox aggregation with a unit test.
  2. Make calendar-picker icons visible on dark date fields.
  3. Build reusable weekday/weekly gym chart series: monthly charts include Monday–Saturday dates; the yearly chart has the year’s weeks and month labels.
  4. Add muscle-group-scoped text search to the exercise picker and routine builder.
  5. Replace blank set rows with an exercise-level draft input plus Add set; show edit/delete controls only for the selected saved draft set.
  6. Restyle Gym navigation as a persistent navigation bar rather than a collection of button-like links.
  7. Run targeted tests, TypeScript, lint, and production build.
- Verification: checkbox completions contribute to both daily score and chart points; date picker icon contrast is visible; zero-volume scheduled chart points remain visible; search applies within the selected muscle group; adding/editing/deleting sets preserves sequence and validation; all checks pass.
- Risks / open questions: browser-native calendar icons have vendor-specific styling, so Firefox/Chromium both need safe `color-scheme` styling. The weekly graph will show ISO-like Monday-start buckets and monthly labels rather than inventing workout data.
- Status: Implemented and locally verified: 17 tests, TypeScript, ESLint, and the production build pass.

### Phase 3 — gym workouts and strength progress (proposed)
- Goal: build a dedicated, truthful gym tracker around the user’s January–September 2026 exercise library, preserving workout and set history and showing useful strength and consistency trends.
- Scope: an editable exercise library; reusable workout templates/splits; fast per-set logging (weight, reps, optional RIR and notes); workout history; per-exercise trends; weekly set-volume by muscle group; and separate gym consistency metrics. The page will not alter the daily task score or the Career/Lifestyle analytics.
- Data model: user-owned `exercises`, `workout_templates`, `workout_template_exercises`, `workouts`, and `workout_sets`, all RLS-protected. Exercises store the supplied master-library fields: major group, movement type, target muscle, recommended set range, and performed/considered status. Sets store the immutable facts of each workout.
- UX: retain GRIND’s black/charcoal grid, orange headings and green trends, but give Gym a restrained steel/green performance accent. The immediate screen is “Today’s workout”: choose a template, log sets in a compact table, then finish the workout. History and charts stay separate to keep logging fast.
- Steps:
  1. Confirm the active weekly split and which exercise variants should be seeded as available versus merely retained in the library.
  2. Add the database migration, RLS policies, validation, server actions, and pure volume/estimated-1RM/consistency calculations with tests.
  3. Build the exercise library and template editor so substitutions are possible without losing historical records.
  4. Build the workout logger and saved-workout history, including audit behavior for past sets.
  5. Add concise charts: selected-exercise estimated-1RM or volume over time, weekly muscle-group sets, and workout consistency. Do not present these as medical or causal claims.
- Verification: unit tests for volume and estimated-1RM calculations; RLS and ownership checks; template-to-workout snapshot checks; TypeScript, lint, production build; and live Supabase manual workout logging.
- Risks / open questions: active split and preferred progression method are not yet specified; 1RM is an estimate and will be labelled as such; measurements/photos/nutrition remain later additions.
- Status: Implementing. Push–Legs–Pull is seeded as the editable default, never enforced as the only split.

### Phase 2.5 — reward order, custom areas, and account controls
- Goal: make serial task order reward the highest-ranked work most, let each user manage their own task areas, and add practical account controls.
- Scope: scoring, task-plan/area data and controls, authentication password visibility, and the Daily Progress header logout. Gym remains out of scope.
- Verification: unit-test inverse rewards; verify user-scoped area CRUD and task-plan validation; run tests, TypeScript, lint, and build.
- Status: Implemented and verified locally. Apply the Phase 2.5 migration in Supabase before using editable areas.

### Phase 2.4 — daily-table input and record hygiene corrections
- Goal: ensure task numbering is ascending, time entry is `HH:MM`, zero-score days are not retained, and future lock status is legible.
- Scope: Daily Progress, recorded history, validation, and a zero-entry cleanup migration only. Gym remains untouched.
- Verification: unit-test time conversion; confirm zero submissions delete rather than create an entry; verify ascending `1..n` order; run TypeScript, lint, and production build.
- Status: Implemented and verified. Apply the zero-entry cleanup migration before live verification.

### Phase 2.3 — GRIND visual identity
- Goal: replace the generic visual system with a coherent GRIND dark interface using the supplied logo and website icon.
- Scope: dark grid background, elevated components, high-contrast text/input styling, GRIND naming/metadata, GitHub-inspired black/green graphs, and restrained orange/green/red/blue accents. The Gym page is explicitly excluded.
- Verification: ensure supplied raster assets render from `public`, inspect contrast across daily/auth/history/analytics surfaces, and run TypeScript, lint, and production build.
- Status: Implemented and verified. The Gym page was not changed.

### Phase 2.2 — task-plan controls, visual accessibility, and future-entry protection
- Goal: make the daily table readable and operationally complete: explicit actual time, concise output label, editable unique contiguous task priorities, controlled default tasks, and database-enforced future-date protection.
- Scope: change only Daily Progress and task-plan data. Gym page content is explicitly out of scope and will not be changed.
- Steps:
  1. Add a migration to seed Gym, remove Wake-up Routine, normalize each user task plan to contiguous priorities, and expose safe transaction-like task-plan database functions.
  2. Add a database trigger and server validation preventing future focused-time/evidence claims, while preserving task-plan changes and retroactive entry edits.
  3. Replace implicit/low-contrast styling with a compact black, white, orange, blue, green, red, and neutral-ash palette; add only meaningful icons.
  4. Revise daily labels and controls; add task-plan management for rename, reprioritization, add, and delete.
  5. Correct date handling using Asia/Kolkata calendar dates and verify the prior/next controls.
- Verification: scoring tests, task-plan validation tests, TypeScript, lint, build, and live Supabase migration verification. Confirm future entry saves are rejected and priority values remain `1..n`.
- Status: Implemented and locally verified. Apply the Phase 2.2 migration in Supabase before live use.

### Phase 2.1 — daily-first navigation and basic execution history
- Goal: make Daily Progress the authenticated home; replace per-task creation with database-seeded default tasks; make evidence and focused time optional; and expose only the basic current-month and historical score views supported by daily data.
- Scope / non-goals:
  - In scope: sign-in/sign-up redirect to daily progress, seeded task configuration in the database, a table-shaped daily logger, Career and Lifestyle scoreboards (gym time belongs to Lifestyle), current-month score graph, daily-entry history, and monthly/yearly score graphs.
  - Out of scope: workout/exercise/set logging. The Gym page will be a deliberate separate module and must not be embedded in daily execution; its data model and logging workflow stay in the fitness release after daily tracking has been used and verified.
- Files to touch: a follow-up Supabase migration; auth redirects; daily/home/history/analytics routes; score aggregation helpers; client chart components; and navigation.
- Steps:
  1. Add a safe follow-up migration that assigns existing Fitness tasks to Lifestyle and gives every existing/new user a configurable database task plan; no task defaults are hardcoded in page components.
  2. Route authenticated sign-in and confirmation directly to `/daily`; make `/app` redirect there.
  3. Replace the task-creation control with a daily task table whose columns reflect stored task/entry attributes. Focused time and evidence remain optional.
  4. Add a current-month daily-score graph to Daily Progress and history routes for recorded tables, monthly graphs, and a year roll-up graph.
  5. Keep a clearly named Gym route link separate from Daily Progress without starting workout tracking ahead of its approved data-model phase.
- Verification (tests, lint, tsc, manual): new and normal sign-ins open `/daily`; each user has one copy of each default task; history/chart aggregates reflect stored entries; and `npm run test`, `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.
- Risks / open questions: Default tasks are a configurable database starting plan, not an immutable definition of the user. Gym workout logging remains deferred to protect the core daily loop from scope creep.
- Status: Implemented and statically verified. Apply both Phase 2 migrations in Supabase before live verification.

### Phase 2 — tasks, daily logging, and weighted scoring
- Goal: deliver the first truthful daily-execution loop: create measurable time-based tasks, log focused minutes and optional evidence for a date, and see deterministic capped scores.
- Scope / non-goals:
  - In scope: active time-based tasks, focused-minute entries, optional evidence, retroactive-entry audit records, base/bonus scoring, category subtotals, a fast authenticated daily page, and pure scoring unit tests.
  - Out of scope: goals/skills, timers, work sessions, custom task categories, dashboard charts, career CRM, fitness workouts, and advanced analytics. These require stable daily historical data first.
- Files to touch:
  - `supabase/migrations/<timestamp>_create_daily_tracking.sql`
  - `src/lib/scoring/**`, `src/lib/validation/**`, and `src/lib/supabase/**`
  - `src/app/app/**`, `src/app/daily/**`, and `src/components/daily/**`
  - Test configuration and scoring test files; navigation and documentation only as required.
- Steps:
  1. Add user-owned `tasks`, `daily_entries`, `daily_outputs`, and `entry_audit_log` tables, constraints, indexes, RLS, and a database trigger that audit-logs edits to past daily entries.
  2. Implement and unit-test pure focused-time scoring: partial completion, priority cap, bonus minutes, total maximum, and Career/Lifestyle/Fitness subtotals.
  3. Add shared Zod schemas and server-side task/entry commands. Validate ownership and write evidence without duplicating scoring logic.
  4. Build a compact daily page: date navigation, task creation, focused-minute entry, evidence, save feedback, empty/loading/error states, and truthful base/bonus totals.
  5. Replace the Phase 1 authenticated placeholder with clear navigation to daily tracking. Do not introduce charts until records are available.
  6. Run database migration, scoring tests, TypeScript, lint, production build, and manual flows for new task, partial/over-target entry, evidence, and retroactive edit audit.
- Verification (tests, lint, tsc, manual):
  - Scoring cases in `docs/SCORING.md`, including 6.67 points for 60 of 90 focused minutes at priority 10.
  - `npm run test`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
  - Supabase: RLS prevents cross-user reads/writes; an edit to a past entry produces an audit record.
  - Browser: an authenticated user can complete daily logging in under five minutes; extra minutes appear as effort but never increase base points beyond priority.
- Risks / open questions:
  - The new migration must be applied manually to the already-created Supabase project before live testing.
  - The user must decide later whether custom categories join a score group; this first slice limits categories to Career, Lifestyle, and Fitness so scoreboards remain meaningful.
- Status: Implemented and statically verified. The migration must be applied in Supabase before the daily workflow can be live-tested.

### Phase 1 — application foundation
- Goal: establish a secure, deployable Next.js foundation with Supabase email/password authentication and a minimal user-data boundary. This phase creates no task, logging, scoring, dashboard, career, or fitness features.
- Scope / non-goals:
  - In scope: Next.js App Router with strict TypeScript, Tailwind, linting, environment validation, Supabase browser/server clients, email/password sign-up, sign-in, sign-out, protected application shell, a `profiles` table with RLS, and an initial migration.
  - Out of scope: tasks, daily entries, scores, analytics, goals/skills, job CRM, workouts, storage, charts, seed/demo data, and service-role use in application code.
- Files to touch:
  - Generated application foundation: `package.json`, `tsconfig.json`, `next.config.*`, `src/app/**`, Tailwind/PostCSS configuration, and generated supporting files.
  - `src/lib/supabase/{client,server,middleware}.ts`
  - `src/lib/validation/env.ts`
  - `src/app/(auth)/{login,signup}/page.tsx`, `src/app/auth/**`, and protected route layout/page(s)
  - `src/middleware.ts` (or the framework-equivalent root middleware location)
  - `supabase/migrations/<timestamp>_create_profiles.sql`
  - `.env.example`, `README.md`, and this plan as needed.
- Steps:
  1. Initialize the current directory with Next.js using TypeScript, ESLint, Tailwind, App Router, `src/`, and the `@/*` alias; preserve the existing instructions and documentation.
  2. Add only the necessary Supabase, Zod, React Hook Form, and shadcn/ui foundation dependencies; configure the base UI primitives only when an auth form needs them.
  3. Add validated environment configuration and separate Supabase browser/server clients. Keep the service-role key out of runtime application paths.
  4. Add the initial `profiles` migration, automatic profile creation for authenticated users, RLS, and user-only policies. Treat `auth.users` as Supabase-owned.
  5. Implement accessible email/password sign-up, sign-in, sign-out, session refresh, and protected routes with loading, empty, and error states where applicable.
  6. Add a minimal authenticated placeholder screen that explicitly marks daily tracking as the next phase; do not build a dashboard prematurely.
  7. Document Supabase setup, required environment variables, migration application, and local run instructions.
  8. Run lint, TypeScript checking, relevant automated tests, and a manual auth-path review against the configured Supabase project.
- Verification (tests, lint, tsc, manual):
  - `npm run lint`
  - `npx tsc --noEmit` (or the generated project’s equivalent)
  - Authentication-focused tests if the chosen setup supports them without disproportionate tooling.
  - Manual: unauthenticated protected-route access redirects to sign-in; sign-up/sign-in establish a session; sign-out ends it; one user cannot read another user’s `profiles` row under RLS.
- Risks / open questions:
  - A Supabase project URL and publishable/anon key are required for a real auth and RLS verification; no secrets should be committed.
  - Supabase email confirmation behavior depends on the project configuration and must be reflected in the sign-up UX.
  - The exact generated Next.js file names/configuration depend on the selected create-next-app version.
- Status: Implemented and statically verified. Supabase-backed manual authentication and RLS verification remain pending project credentials and migration application.

## Completed
- Phase 1 implementation update: the Next.js scaffold, Supabase SSR clients, email/password auth actions and routes, protected application shell, profile RLS migration, and setup documentation are in place. Local checks and Supabase-backed manual verification remain before the phase can be marked complete.
