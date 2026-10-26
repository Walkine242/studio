# Dual setup guide

About 30 minutes. You'll need accounts on Supabase, Anthropic, Stripe and Vercel.

## 1. Create the database (Supabase)

1. Go to https://supabase.com, create a new project (free tier is fine). Save the database password somewhere safe.
2. In the project, open **SQL Editor → New query**.
3. Paste the entire contents of `supabase/migrations/20261025000000_init.sql` and click **Run**. It should finish with "Success".
   Then open a new query, paste `supabase/migrations/20261026000000_trial_and_welcome.sql` and **Run** it too (free trial + welcome email). To change the trial length, edit `interval '14 days'` in that file before running it.
4. Open **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret)

### Login settings

5. **Authentication → URL Configuration**
   - Site URL: `https://dualswim.app`
   - Redirect URLs: add `https://dualswim.app/auth/callback` and, for local testing, `http://localhost:3000/auth/callback`
6. **Authentication → Providers → Email**: leave "Confirm email" on (recommended). New swimmers get a confirmation email before they can log in. Supabase's built-in email sender is rate-limited; for real launch traffic, add your own SMTP under **Authentication → Emails → SMTP Settings**.

### Make yourself an admin (optional)

Admins can create meets from the Dual page and always have premium access. After signing up in the app, run this in the SQL editor with your email:

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'you@example.com');
```

## 2. Claude API key

1. Go to https://console.anthropic.com → **API Keys** → create a key.
2. That's `ANTHROPIC_API_KEY`. Add billing / credits on the Anthropic console so requests aren't refused.

## 3. Stripe

1. In https://dashboard.stripe.com → **Developers → API keys**, copy the **Secret key** → `STRIPE_SECRET_KEY`. Use the test-mode key (`sk_test_...`) first to try everything without real charges.
2. **Developers → Webhooks → Add endpoint**
   - Endpoint URL: `https://dualswim.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - After saving, reveal the **Signing secret** → `STRIPE_WEBHOOK_SECRET`
3. **Settings → Billing → Customer portal**: turn it on so members can cancel or update their card from the Premium page.

Test with card `4242 4242 4242 4242`, any future date, any CVC. After paying you should land back on Dual Mode and see "PRO" in the header within a few seconds. If you don't, check **Developers → Webhooks → your endpoint** in Stripe for failed deliveries.

## 4. Welcome emails (optional)

The app sends a welcome email on each swimmer's first login using Resend. Create a key at https://resend.com, verify the `dualswim.app` domain there, and add `RESEND_API_KEY` to Vercel. Without it, everything else works; the email is just skipped.

## 5. Vercel

1. In your Vercel project → **Settings → Environment Variables**, add every variable from `.env.example` (Production and Preview).
2. Remove the old `GEMINI_API_KEY` variable; it's no longer used.
3. Redeploy.

## Important: existing users

The old version stored accounts, times and memberships only in each visitor's browser, so there is nothing on a server to migrate. Everyone (including you) will sign up again on the new version. If any customers paid through Stripe on the old version, their payments are in your Stripe dashboard; you can grant them membership with:

```sql
insert into public.subscriptions (user_id, plan, status)
values ((select id from auth.users where email = 'customer@example.com'), 'lifetime', 'lifetime');
```

(or use `'annual'`, `'active'` and set `current_period_end`).
