'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Trophy, Users, Dumbbell, Zap, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';

const featuresList = [
  {
    title: 'Public & Virtual Swim Meets',
    description: 'Enter official scheduled swim meets, prelims, and final championship rounds with zero fees.',
    icon: <Trophy className="size-6 text-yellow-400" />,
    link: '/dual',
    linkText: 'Explore Swim Meets →',
  },
  {
    title: 'AI Workout Generator',
    description: 'Unlimited personalized swim workouts tailored to your stroke, target distance, and heart rate zones.',
    icon: <Dumbbell className="size-6 text-blue-400" />,
    link: '/workout-generator',
    linkText: 'Generate Free Workout →',
  },
  {
    title: 'Global & Endurance Leaderboards',
    description: 'Full access to country rankings, split times, historical analytics, and swimmer head-to-head duals.',
    icon: <Users className="size-6 text-purple-400" />,
    link: '/leaderboard',
    linkText: 'View Leaderboards →',
  },
  {
    title: 'Unlimited Live Dual Battles',
    description: 'Create private custom dual matches or tethered real-time races against swimmers anywhere.',
    icon: <Zap className="size-6 text-orange-400" />,
    link: '/dual',
    linkText: 'Start Dual Battle →',
  },
];

export default function PremiumPage() {
  const image = PlaceHolderImages.find((img) => img.id === 'premium-header');

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
          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold px-3 py-1 text-xs uppercase tracking-widest border-none">
            100% Free Platform
          </Badge>
          <h1 className="font-headline text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            All Features Open to Every Swimmer
          </h1>
          <p className="text-lg text-blue-200 max-w-2xl">
            Dual is completely free for all swimmers! Enjoy full access to AI workout generation, virtual swim meets, leaderboards, and live dual match battles with zero subscriptions or hidden fees.
          </p>
        </div>
      </div>

      {/* Free Status Banner */}
      <Card className="bg-emerald-950/40 border-emerald-500/30 text-white backdrop-blur-md">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="size-7 text-emerald-400" />
              Full Swimmer Access Enabled
            </CardTitle>
            <CardDescription className="text-emerald-200 mt-1">
              No subscriptions required. Every account has instant 100% unlocked access to all training tools, meets, and race lobbies.
            </CardDescription>
          </div>
          <Badge className="bg-emerald-500 text-black font-extrabold px-4 py-1.5 text-xs">
            Free Unlocked Access
          </Badge>
        </CardHeader>
      </Card>

      {/* Feature Highlights Grid */}
      <Card className="bg-black/40 border-white/10 text-white backdrop-blur-md">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-blue-400 flex items-center gap-2">
            <Sparkles className="size-6 text-orange-400 animate-pulse" />
            Everything Included on Dual
          </CardTitle>
          <CardDescription className="text-slate-300">
            Designed specifically for swimmers, coaches, and competitive athletes.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6 pt-2">
          {featuresList.map((feature) => (
            <div key={feature.title} className="flex flex-col justify-between p-5 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/40 transition-colors">
              <div className="flex items-start gap-4">
                <div className="bg-white/10 p-3 rounded-xl shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{feature.title}</h3>
                  <p className="text-sm text-slate-300 mt-1">{feature.description}</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-right">
                <Link href={feature.link} className="text-sm text-cyan-400 hover:text-cyan-300 font-bold inline-flex items-center gap-1">
                  {feature.linkText}
                </Link>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

