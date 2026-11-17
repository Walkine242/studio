import { NextResponse } from 'next/server';
import { getStripeInstance } from '@/lib/stripe';
import { getServerUser, getAdminSupabase } from '@/lib/supabase/server';

// Opens Stripe's customer portal so members can update their card or cancel.
export async function POST(request: Request) {
  try {
    const { user } = await getServerUser();
    if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });

    const { data } = await getAdminSupabase()
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!data?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found for you.' }, { status: 404 });
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'https://dualswim.app';
    const portal = await getStripeInstance().billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${origin}/premium`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error('Billing portal error:', error);
    return NextResponse.json({ error: 'Could not open billing settings.' }, { status: 500 });
  }
}
