'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Anchor, Clock, BarChart3, Swords, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createParty } from '@/lib/services/party-service';
import { useToast } from '@/hooks/use-toast';

const challenges = [
    {
        id: 'tether-daily',
        name: 'Daily Swim Tether Challenge',
        description: 'A "last one standing" endurance challenge where a swim tether is used. The last swimmer going is declared the winner.',
        icon: <Anchor className="size-8 text-cyan-400" />,
        href: '/leaderboard/endurance'
    },
    {
        id: 'tether-1h',
        name: 'Daily 1-Hour Swim Challenge',
        description: 'Swim as far as you can in one hour. The swimmer with the longest distance wins.',
        icon: <Clock className="size-8 text-cyan-400" />,
        href: '/leaderboard/endurance'
    },
    {
        id: 'tether-12h',
        name: 'Daily 12-Hour Swim Challenge',
        description: 'A serious endurance test. Swim as many meters as possible in 12 hours.',
        icon: <Clock className="size-8 text-cyan-400" />,
        href: '/leaderboard/endurance'
    },
    {
        id: 'tether-24h',
        name: 'Daily 24-Hour Swim Challenge',
        description: 'The ultimate endurance challenge. See how far you can push your limits in a full day.',
        icon: <Clock className="size-8 text-cyan-400" />,
        href: '/leaderboard/endurance'
    }
];

export default function TetherDualPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loadingChallenge, setLoadingChallenge] = useState<string | null>(null);

  const handleStartTetherRace = async (challengeName: string, id: string) => {
    setLoadingChallenge(id);
    try {
      const party = await createParty({
        event: challengeName,
        isPublic: true,
      });
      toast({
        title: 'Tether Dual Created! ⚓',
        description: `Entering lobby for ${challengeName}...`,
      });
      router.push(`/dual/lobby/${party.id}`);
    } catch (error) {
      console.error('Error creating tether party:', error);
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: 'Could not initialize tether race lobby. Please try again.',
      });
    } finally {
      setLoadingChallenge(null);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl space-y-8 py-4">
       <div className="text-center">
          <h1 className="mt-4 font-headline text-3xl font-bold text-white">Swim Tether & Endurance Challenges</h1>
          <p className="mt-2 text-slate-300 text-sm">Start a live tether race or view endurance leaderboards.</p>
        </div>
        <div className="space-y-6">
            {challenges.map(challenge => (
                <Card key={challenge.name} className="border-slate-800 bg-slate-900/60 shadow-xl">
                    <CardHeader className="flex flex-row items-start gap-4">
                        {challenge.icon}
                        <div>
                            <CardTitle className="text-white text-xl">{challenge.name}</CardTitle>
                            <CardDescription className="pt-1 text-slate-400 text-xs">
                                {challenge.description}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={() => handleStartTetherRace(challenge.name, challenge.id)}
                            disabled={!!loadingChallenge}
                            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold"
                        >
                            {loadingChallenge === challenge.id ? (
                              <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                              <Swords className="mr-2 size-4" />
                            )}
                            Start Tether Dual Race
                        </Button>
                        <Button asChild variant="outline" className="border-slate-700 bg-slate-950 text-slate-200 hover:text-white">
                            <Link href={challenge.href}>
                                <BarChart3 className="mr-2 size-4"/> Leaderboard
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
  );
}
