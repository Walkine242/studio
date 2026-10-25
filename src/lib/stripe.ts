import Stripe from 'stripe';

export type PlanId = 'monthly' | 'annual' | 'lifetime';

export const PLANS: Record<PlanId, { name: string; amountCents: number; recurring: 'month' | 'year' | null }> = {
  monthly: { name: 'Dual Monthly Pass', amountCents: 399, recurring: 'month' },
  annual: { name: 'Dual Annual Membership', amountCents: 2000, recurring: 'year' },
  lifetime: { name: 'Dual Lifetime Founder Pass', amountCents: 9900, recurring: null },
};

export function getStripeInstance() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not set.');
  return new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia' as any,
    typescript: true,
  });
}
