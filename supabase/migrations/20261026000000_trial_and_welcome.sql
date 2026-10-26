-- Dual: free trial for new swimmers + welcome email tracking.
-- Run this in the Supabase SQL editor after the first migration.

-- Length of the free trial for new accounts. Change the number here to adjust it.
create or replace function public.trial_length()
returns interval language sql immutable as $$ select interval '14 days' $$;

alter table public.profiles
  add column if not exists trial_ends_at timestamptz,
  add column if not exists welcome_sent_at timestamptz;

-- New accounts start a free trial when they sign up.
alter table public.profiles alter column trial_ends_at set default (now() + public.trial_length());

-- Accounts created before this migration get a fresh trial too.
update public.profiles set trial_ends_at = now() + public.trial_length() where trial_ends_at is null;

-- Swimmers can't change their own trial or welcome-email dates (only name and country).
revoke update on public.profiles from anon, authenticated;
grant update (name, country) on public.profiles to authenticated;

-- Premium = admin, active paid membership, or still inside the free trial.
create or replace function public.is_premium(uid uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and (p.is_admin or p.trial_ends_at > now())
  ) or exists (
    select 1 from public.subscriptions s
    where s.user_id = uid
      and (
        s.status = 'lifetime'
        or (s.status in ('active', 'trialing', 'past_due')
            and (s.current_period_end is null or s.current_period_end > now()))
      )
  );
$$;

-- What the app shows a swimmer about their own membership.
create or replace function public.membership_status()
returns table (is_premium boolean, on_trial boolean, trial_ends_at timestamptz, plan text, status text, current_period_end timestamptz)
language sql stable
security definer set search_path = public
as $$
  select
    public.is_premium(p.id),
    (p.trial_ends_at > now()) and not exists (
      select 1 from public.subscriptions s
      where s.user_id = p.id and (s.status = 'lifetime' or s.status in ('active', 'trialing', 'past_due'))
    ),
    p.trial_ends_at,
    s.plan,
    s.status,
    s.current_period_end
  from public.profiles p
  left join public.subscriptions s on s.user_id = p.id
  where p.id = auth.uid();
$$;
