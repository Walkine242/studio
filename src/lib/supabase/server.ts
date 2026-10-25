// Server-only: never import this file from a 'use client' component.
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client for server code (route handlers, server actions) acting as
 * the signed-in user. Row-level security applies.
 */
export async function getServerSupabase(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a context where cookies are read-only; middleware refreshes them.
          }
        },
      },
    }
  );
}

/** Returns the signed-in user, or null. Verified with Supabase, not just read from the cookie. */
export async function getServerUser() {
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

/**
 * Service-role client. Bypasses row-level security, so it must only be used
 * in trusted server code such as the Stripe webhook.
 */
export function getAdminSupabase(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
