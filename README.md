# GRIND

GRIND is a private personal execution and training tracker. It records focused work, daily completion, workout sets, and progress trends without mixing Daily and Gym metrics.

## Current MVP

- Supabase email/password authentication and user-owned data protected by RLS.
- Daily tasks with editable areas, priorities, time targets, and checkbox completion.
- Weighted Daily scoring and monthly progress analytics.
- Gym exercise library, custom routines, set logging, editable workout history, and volume trends.

## Local development

Copy `.env.example` to `.env.local`, fill in the Supabase values, then run:

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local address printed in the terminal, normally `http://localhost:3000`.

Never commit `.env.local` or any Supabase secret.

## Supabase migrations

Apply every SQL file in `supabase/migrations/` in chronological filename order through the Supabase SQL Editor. Each migration is designed for the existing application state built by its earlier migrations.

## Free production deployment

1. Create a private GitHub repository and push this project.
2. Import that repository into Vercel using the free Hobby plan.
3. Add these environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_APP_URL` — the deployed Vercel URL.
4. In Supabase Authentication URL Configuration, set Site URL to the Vercel URL and add both that URL and `http://localhost:3000` as Redirect URLs.
5. Deploy from Vercel.

GitHub, Vercel, and Supabase free tiers are sufficient for this personal application, subject to their current usage limits. Do not add a Supabase service-role key to GitHub or Vercel.
