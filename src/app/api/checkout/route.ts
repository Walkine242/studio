import { NextResponse } from 'next/server';
import { getStripeInstance } from '@/lib/stripe';
import { STRIPE_PLANS, type StripePlan } from '@/config/stripe-plans';

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://dualswim.app';
    const body = await request.json().catch(() => ({}));
    const planKey = (body.plan as 'annual' | 'monthly' | 'lifetime') || 'annual';
    const selectedPlan: StripePlan = STRIPE_PLANS[planKey] || STRIPE_PLANS.annual;

    // Check if custom payment link is specified in env or request body
    const customPaymentLink = body.paymentLink || selectedPlan.paymentLink;
    if (customPaymentLink) {
      return NextResponse.json({ url: customPaymentLink, isPaymentLink: true });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      // Graceful fallback for test/dev mode before live keys are added to Vercel env
      return NextResponse.json({
        url: `${origin}/dual?payment=success&mock=true&plan=${planKey}`,
        simulated: true,
        plan: selectedPlan.name,
      });
    }

    const stripe = getStripeInstance();

    // Construct line item using price ID if available, or dynamic price_data
    const lineItem = selectedPlan.stripePriceId
      ? { price: selectedPlan.stripePriceId, quantity: 1 }
      : {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPlan.name,
              description: selectedPlan.description,
            },
            unit_amount: selectedPlan.amountCents,
            recurring: planKey === 'lifetime' ? undefined : {
              interval: planKey === 'monthly' ? 'month' : 'year',
            },
          },
          quantity: 1,
        };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [lineItem],
      mode: planKey === 'lifetime' ? 'payment' : 'subscription',
      success_url: `${origin}/dual?payment=success&plan=${planKey}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/premium?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

