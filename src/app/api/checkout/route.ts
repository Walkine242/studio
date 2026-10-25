import { NextResponse } from 'next/server';
import { getStripeInstance, PLANS, type PlanId } from '@/lib/stripe';
import { getServerUser, getAdminSupabase } from '@/lib/supabase/server';

// Starts a Stripe Checkout session for the signed-in user. Membership is only
// switched on later by the Stripe webhook, once Stripe confirms the payment.
export async function POST(request: Request) {
  try {
    const { user } = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Please log in before upgrading.' }, { status: 401 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payments are not set up yet. Please try again later.' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const planId: PlanId = body.plan in PLANS ? body.plan : 'annual';
    const plan = PLANS[planId];
    const origin = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'https://dualswim.app';

    const stripe = getStripeInstance();

    // Reuse the Stripe customer if this user has paid before.
    const { data: existing } = await getAdminSupabase()
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const session = await stripe.checkout.sessions.create({
      mode: plan.recurring ? 'subscription' : 'payment',
      client_reference_id: user.id,
      metadata: { user_id: user.id, plan: planId },
      ...(plan.recurring
        ? { subscription_data: { metadata: { user_id: user.id, plan: planId } } }
        : { payment_intent_data: { metadata: { user_id: user.id, plan: planId } } }),
      ...(existing?.stripe_customer_id
        ? { customer: existing.stripe_customer_id }
        : { customer_email: user.email ?? undefined }),
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: 'Access to public swim meets, AI workout generator, head-to-head dual battles, and global leaderboards.',
            },
            unit_amount: plan.amountCents,
            ...(plan.recurring ? { recurring: { interval: plan.recurring } } : {}),
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/dual?payment=success`,
      cancel_url: `${origin}/premium?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout API Error:', error);
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 500 });
  }
}
