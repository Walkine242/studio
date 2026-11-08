import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Keeps the Supabase login session fresh on every page load.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    // Skip static files, images and the Stripe webhook (it must see the raw request).
    '/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)',
  ],
};
