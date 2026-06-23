'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Anchor, Clock, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const challenges = [
    {
        name: 'Daily Swim Tether Challenge',
        description: 'A "last one standing" endurance challenge where a swim tether is used. The last swimmer going is declared the winner. Leaderboard resets daily.',
        icon: <Anchor className="size-8 text-primary" />,
        href: '/leaderboard/endurance'
    },
    {
        name: 'Daily 1-Hour Swim Challenge',
        description: 'Swim as far as you can in one hour. The swimmer with the longest distance wins. Leaderboard resets daily.',
        icon: <Clock className="size-8 text-primary" />,
        href: '/leaderboard/endurance'
    },
    {
        name: 'Daily 12-Hour Swim Challenge',
        description: 'A serious endurance test. Swim as many meters as possible in 12 hours. Leaderboard resets daily.',
        icon: <Clock className="size-8 text-primary" />,
        href: '/leaderboard/endurance'
    },
    {
        name: 'Daily 24-Hour Swim Challenge',
        description: 'The ultimate endurance challenge. See how far you can push your limits in a full day. Leaderboard resets daily.',
        icon: <Clock className="size-8 text-primary" />,
        href: '/leaderboard/endurance'
    }
]

export default function TetherDualPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-2xl space-y-8">
       <div className="text-center">
          <h1 className="mt-4 font-headline text-3xl font-bold">Endurance Challenges</h1>
          <p className="mt-2 text-muted-foreground">View the global and local leaderboards for our daily endurance events.</p>
        </div>
        <div className="space-y-6">
            {challenges.map(challenge => (
                <Card key={challenge.name}>
                    <CardHeader className="flex flex-row items-start gap-4">
                        {challenge.icon}
                        <div>
                            <CardTitle>{challenge.name}</CardTitle>
                            <CardDescription className="pt-1">
                                {challenge.description}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href={challenge.href}>
                                <BarChart3 className="mr-2"/> View Leaderboard
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
  );
}
