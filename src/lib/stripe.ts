import Stripe from 'stripe';
import { STRIPE_PLANS } from '@/config/stripe-plans';

export type PlanId = 'monthly' | 'annual' | 'lifetime';

/** Plans used by checkout, built from the shared plan list in config/stripe-plans.ts. */
export const PLANS: Record<PlanId, { name: string; description: string; amountCents: number; recurring: 'month' | 'year' | null; stripePriceId?: string }> = {
  monthly: { ...STRIPE_PLANS.monthly, recurring: 'month' },
  annual: { ...STRIPE_PLANS.annual, recurring: 'year' },
  lifetime: { ...STRIPE_PLANS.lifetime, recurring: null },
};

export function getStripeInstance() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not set.');
  return new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia' as any,
    typescript: true,
  });
}
