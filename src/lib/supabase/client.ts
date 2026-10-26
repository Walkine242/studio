'use client';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

/** One shared Supabase client for the browser (uses the public anon key). */
export function getSupabase(): SupabaseClient {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      // Lets pages pre-render at build time even before the env vars are set.
      // Any real request will fail until they are added (see SETUP.md).
      if (typeof window !== 'undefined') {
        console.error('Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      }
      return createBrowserClient('https://not-configured.supabase.co', 'not-configured');
    }
    browserClient = createBrowserClient(url, key);
  }
  return browserClient;
}
