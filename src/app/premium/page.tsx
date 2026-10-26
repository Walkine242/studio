'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Lock, Sparkles, Trophy, Users, Dumbbell, Zap, ShieldCheck } from 'lucide-react';
import { usePremiumMember } from '@/lib/hooks/use-premium-member';
import { useAuth } from '@/lib/auth/auth-provider';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

import { startCheckout } from '@/components/checkout-modal';

const premiumFeatures = [
  {
    title: 'Public & Virtual Swim Meets',
    description: 'Enter official global scheduled swim meets, prelims, and final championship rounds.',
    icon: <Trophy className="size-6 text-yellow-400" />,
  },
  {
    title: 'Advanced AI Workout Generator',
    description: 'Unlimited personalized swim workouts tailored to your stroke, target distance, and heart rate zones.',
    icon: <Dumbbell className="size-6 text-blue-400" />,
  },
  {
    title: 'Global & Endurance Leaderboards',
    description: 'Full access to country rankings, split times, historical analytics, and swimmer head-to-head duals.',
    icon: <Users className="size-6 text-purple-400" />,
  },
  {
    title: 'Unlimited Dual Battles',
    description: 'Create private custom dual matches or tethered real-time races against swimmers anywhere.',
    icon: <Zap className="size-6 text-orange-400" />,
  },
];

const pricingPlans = [
  {
    id: 'annual',
    name: 'Annual Membership',
    price: '$20.00',
    period: '/ year ($1.66/mo)',
    badge: 'FLAGSHIP MEMBERSHIP',
    description: 'Our standard full-year pass for competitive swimmers.',
    popular: true,
    features: [
      'Full Access to Public & Virtual Meets',
      'Unlimited AI Workout Generation',
      'Global & Country Leaderboard Splits',
      'Unlimited Live Head-to-Head Duals',
      'Member Badge on Swimmer Profile',
    ],
  },
  {
    id: 'monthly',
    name: 'Monthly Pass',
    price: '$3.99',
    period: '/ month',
    badge: null,
    description: 'Flexible monthly training pass.',
    features: [
      'Full Access to Public Meets',
      'Unlimited AI Workouts',
      'All Leaderboards & Split Analytics',
    ],
  },
  {
    id: 'lifetime',
    name: 'Lifetime Founder Pass',
    price: '$99.00',
    period: 'one-time payment',
    badge: 'VIP ACCESS',
    description: 'Pay once for permanent VIP access.',
    features: [
      'Permanent VIP Access to All Features',
      'All Future AI & Feature Updates',
      'Lifetime VIP Founder Badge',
    ],
  },
];

export default function PremiumPage() {
  const { isPremium, onTrial, trialDaysLeft, isInitialized } = usePremiumMember();
  const { user } = useAuth();
  const hasPaidPlan = isPremium && !onTrial;
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const image = PlaceHolderImages.find((img) => img.id === 'premium-header');

  const handleSubscribe = async (planId: string) => {
    setLoadingPlan(planId);
    const error = await startCheckout(planId as 'monthly' | 'annual' | 'lifetime');
    if (error) {
      setLoadingPlan(null);
      toast({ variant: 'destructive', title: 'Checkout Unavailable', description: error });
    }
  };

  // Cancel or update payment details in Stripe's billing portal.
  const handleManage = async () => {
    setLoadingPlan('manage');
    const res = await fetch('/api/billing-portal', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) {
      window.location.href = data.url;
      return;
    }
    setLoadingPlan(null);
    toast({ variant: 'destructive', title: 'Could Not Open Billing', description: data.error || 'Please try again.' });
  };

  return (
    <div className="container mx-auto max-w-5xl space-y-10 py-6">
      {/* Hero Header Banner */}
      <div className="relative w-full h-72 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        {image && (
          <Image
            src={image.imageUrl}
            alt={image.description}
            data-ai-hint={image.imageHint}
            fill
            className="object-cover brightness-75"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 space-y-2">
          <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-none font-bold px-3 py-1 text-xs uppercase tracking-widest">
            Dual Pro Member Pass
          </Badge>
          <h1 className="font-headline text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Unlock Full Competitive Advantage
          </h1>
          <p className="text-lg text-blue-200 max-w-2xl">
            Get unlimited access to AI swim workout generation, public virtual meets, advanced leaderboard splits, and live dual match battles.
          </p>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <Card className="bg-black/40 border-white/10 text-white backdrop-blur-md">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-blue-400 flex items-center gap-2">
            <Sparkles className="size-6 text-orange-400 animate-pulse" />
            What’s Included in Dual Pro Membership
          </CardTitle>
          <CardDescription className="text-slate-300">
            Designed specifically for swimmers, coaches, and competitive athletes.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6 pt-2">
          {premiumFeatures.map((feature) => (
            <div key={feature.title} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/40 transition-colors">
              <div className="bg-white/10 p-3 rounded-xl shrink-0">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">{feature.title}</h3>
                <p className="text-sm text-slate-300 mt-1">{feature.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Membership Status & Pricing Tiers */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-white">Choose Your Membership Plan</h2>
          <p className="text-slate-300">Secure checkout by Stripe. Your membership activates as soon as payment clears.</p>
        </div>

        {onTrial && (
          <Card className="bg-cyan-950/40 border-cyan-500/30 text-white backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl text-cyan-300 flex items-center gap-2">
                <Sparkles className="size-6 text-cyan-300" />
                Free trial: {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left
              </CardTitle>
              <CardDescription className="text-cyan-100">
                You have full access to every feature during your trial. Love it? Pick a plan below. Monthly and annual
                plans aren't charged until your trial ends, so you keep your free days.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
        {user && isInitialized && !isPremium && (
          <Card className="bg-orange-950/40 border-orange-500/30 text-white backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl text-orange-300">Your free trial has ended</CardTitle>
              <CardDescription className="text-orange-100">
                Choose a plan to keep racing in meets, generating AI workouts and dueling swimmers worldwide.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {hasPaidPlan ? (
          <Card className="bg-emerald-950/40 border-emerald-500/30 text-white backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="size-7 text-emerald-400" />
                  Dual Pro Membership Active
                </CardTitle>
                <CardDescription className="text-emerald-200 mt-1">
                  You have full access to all swim meets, AI tools, and global leaderboards.
                </CardDescription>
              </div>
              <Badge className="bg-emerald-500 text-black font-bold px-3 py-1">Active Member</Badge>
            </CardHeader>
            <CardFooter className="flex justify-between items-center border-t border-emerald-500/20 pt-4">
              <Link href="/dual" className="text-sm text-emerald-300 hover:underline">
                Explore Dual Meets & Leaderboards →
              </Link>
              <Button variant="outline" onClick={handleManage} disabled={loadingPlan === 'manage'} className="border-emerald-500/30 text-emerald-200 hover:bg-emerald-900/40">
                {loadingPlan === 'manage' ? 'Opening...' : 'Manage Billing / Cancel'}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative flex flex-col justify-between transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-blue-950/80 to-black border-blue-500/80 shadow-[0_0_30px_rgba(59,130,246,0.3)] scale-105 z-10'
                    : 'bg-black/50 border-white/10 hover:border-white/30'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs uppercase px-3 py-0.5 shadow-md">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader className="pt-6">
                  <CardTitle className="text-xl text-white font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-300">{plan.description}</CardDescription>
                  <div className="pt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-sm text-slate-300">{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-200">
                      <Check className="size-4 text-emerald-400 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </CardContent>

                <CardFooter className="pt-4">
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={!!loadingPlan}
                    className={`w-full min-h-[44px] h-auto py-2.5 px-2 text-xs sm:text-sm font-bold tracking-tight text-center flex items-center justify-center ${
                      plan.popular
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-lg'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <span>{loadingPlan === plan.id ? 'Opening secure checkout...' : `Unlock ${plan.name} (${plan.price})`}</span>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
