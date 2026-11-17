export interface StripePlan {
  id: 'annual' | 'monthly' | 'lifetime';
  name: string;
  price: string;
  amountCents: number;
  period: string;
  badge?: string | null;
  description: string;
  popular?: boolean;
  stripePriceId?: string; // Optional Stripe Price ID (set STRIPE_PRICE_ID_* in Vercel to use your own Stripe products)
  features: string[];
}

export const STRIPE_PLANS: Record<'annual' | 'monthly' | 'lifetime', StripePlan> = {
  annual: {
    id: 'annual',
    name: 'Annual Membership',
    price: '$20.00',
    amountCents: 2000,
    period: '/ year ($1.66/mo)',
    badge: 'FLAGSHIP MEMBERSHIP',
    description: 'Our standard full-year pass for competitive swimmers.',
    popular: true,
    stripePriceId: process.env.STRIPE_PRICE_ID_ANNUAL || '',
    features: [
      'Full Access to Public & Virtual Meets',
      'Unlimited AI Workout Generation',
      'Global & Country Leaderboard Splits',
      'Unlimited Live Head-to-Head Duals',
      'Member Badge on Swimmer Profile',
    ],
  },
  monthly: {
    id: 'monthly',
    name: 'Monthly Pass',
    price: '$3.99',
    amountCents: 399,
    period: '/ month',
    badge: 'FLEXIBLE',
    description: 'Flexible monthly training pass for active swimmers.',
    popular: false,
    stripePriceId: process.env.STRIPE_PRICE_ID_MONTHLY || '',
    features: [
      'Full Access to Public & Virtual Meets',
      'Unlimited AI Workout Generation',
      'Global & Country Leaderboard Splits',
      'Unlimited Live Head-to-Head Duals',
    ],
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime Founder Pass',
    price: '$99.00',
    amountCents: 9900,
    period: 'one-time payment',
    badge: 'VIP ACCESS',
    description: 'Pay once for permanent VIP access to all features.',
    popular: false,
    stripePriceId: process.env.STRIPE_PRICE_ID_LIFETIME || '',
    features: [
      'Permanent VIP Access to All Features',
      'All Future AI & Feature Updates',
      'Lifetime VIP Founder Badge',
    ],
  },
};
