# Dual

Dual is a competitive swimming app: virtual swim meets, head-to-head duals, leaderboards, personal bests, goals, and an AI workout coach. Built with Next.js 15, Tailwind CSS, Supabase (database, login, live updates), Stripe (memberships) and Claude (AI workouts).

## How it fits together

| Piece | What it does |
|---|---|
| **Supabase Auth** | Email + password accounts. Passwords are hashed by Supabase, never stored in the browser. |
| **Supabase Postgres** | All app data: profiles, race results, PBs, goals, workout logs, saved workouts, follows, meets, race lobbies, awards. Row-level security means each user can only change their own data. |
| **Database functions** | Race logic that must not be fakeable (joining meets, qualification, submitting race times, finishing races, awards, leaderboard points) runs inside the database. See `supabase/migrations/`. |
| **Supabase Realtime** | Lobbies update live as swimmers join, the race starts and finishes. |
| **Free trial** | Every new account gets 14 days of full access (set in `supabase/migrations/20261026000000_trial_and_welcome.sql`). Afterwards swimmers pick a plan. |
| **Stripe** | Checkout for monthly / annual / lifetime passes. Membership is switched on only by the Stripe webhook (`/api/stripe/webhook`), never by the browser. Choosing a monthly or annual plan during the trial doesn't charge until the trial ends. |
| **Resend** | Welcome email, sent once per account on first login (optional; needs `RESEND_API_KEY`). |
| **Claude** | Coach Mikey's workouts and practice reviews (`src/ai/`). Runs on the server, signed-in users only. |

## Setup

See **[SETUP.md](SETUP.md)** for the step-by-step guide (Supabase project, environment variables, Stripe webhook, Vercel).

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000.
