'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Trophy, Award as AwardIcon, Loader2, Swords } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getCountryByCode, type Country } from '@/lib/countries';
import { getParty, getPartyResults } from '@/lib/services/party-service';
import type { Party } from '@/lib/types';
import { formatTime } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-provider';

const FINALS_POINTS = [9, 7, 6, 5, 4, 3, 2, 1];

interface Standing {
  id: string;
  name: string;
  rank: number;
  points: number;
  time: string;
  country?: Country;
}

const CountryTag = ({ country }: { country?: Country }) =>
  country ? (
    <div className="flex items-center gap-2">
      <Image src={country.flag} alt={country.name} width={20} height={15} />
      <span className="text-sm">{country.code}</span>
    </div>
  ) : null;

const Podium = ({ winners }: { winners: Standing[] }) => (
    <div className="flex justify-center items-end gap-4 mt-8 h-64">
        {/* 2nd Place */}
        <div className="flex flex-col items-center w-1/4">
            <Trophy className="text-gray-400 size-10"/>
            <p className="font-bold">{winners[1].name}</p>
            <CountryTag country={winners[1].country} />
            <div className="bg-muted w-full rounded-t-lg text-center p-4 mt-2 h-24 flex items-center justify-center">
                <span className="font-bold text-2xl">2</span>
            </div>
        </div>
        {/* 1st Place */}
        <div className="flex flex-col items-center w-1/4">
            <Trophy className="text-yellow-500 size-14"/>
            <p className="font-bold">{winners[0].name}</p>
             <CountryTag country={winners[0].country} />
            <div className="bg-primary w-full rounded-t-lg text-center p-4 mt-2 h-36 flex items-center justify-center">
                <span className="font-bold text-3xl text-primary-foreground">1</span>
            </div>
        </div>
        {/* 3rd Place */}
        <div className="flex flex-col items-center w-1/4">
             <Trophy className="text-orange-400 size-8"/>
             <p className="font-bold">{winners[2].name}</p>
              <CountryTag country={winners[2].country} />
             <div className="bg-muted w-full rounded-t-lg text-center p-4 mt-2 h-16 flex items-center justify-center">
                <span className="font-bold text-xl">3</span>
            </div>
        </div>
    </div>
)

function ResultsView() {
  const searchParams = useSearchParams();
  const partyId = searchParams.get('party');
  const [party, setParty] = useState<Party | null>(null);
  const [standings, setStandings] = useState<Standing[] | null>(null);
  const { user } = useAuth();
  const me = user?.id;

  useEffect(() => {
    if (!partyId) return;
    const unsubscribe = getParty(partyId, setParty);
    getPartyResults(partyId)
      .then((results) =>
        setStandings(
          results.map((r, index) => ({
            id: r.swimmerId!,
            name: r.swimmerName,
            rank: index + 1,
            points: FINALS_POINTS[index] ?? 0,
            time: formatTime(r.totalTime),
            country: r.country ? getCountryByCode(r.country) : undefined,
          }))
        )
      )
      .catch(() => setStandings([]));
    return () => unsubscribe();
  }, [partyId]);

  if (!partyId) {
    return (
      <div className="container mx-auto max-w-xl text-center space-y-4 py-10">
        <h1 className="text-2xl font-bold">No race selected</h1>
        <p className="text-muted-foreground">Finish a dual to see its results here.</p>
        <Button asChild><Link href="/dual"><Swords className="mr-2" /> Go to Dual Mode</Link></Button>
      </div>
    );
  }

  if (!standings || !party) {
    return (
      <div className="container mx-auto flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const countsForPoints = party.isPublic && party.round === 'Finals';

  return (
    <div className="container mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <AwardIcon className="mx-auto h-24 w-24 text-primary" />
        <h1 className="mt-4 font-headline text-4xl font-bold">
          {party.status === 'finished' ? 'Race Finished!' : 'Live Results'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {party.event}{party.round && ` - ${party.round}`}
        </p>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .result-card {
          animation: slide-in 0.5s ease-out forwards;
        }
        @keyframes point-gain {
          from { transform: scale(1); color: hsl(var(--foreground)); }
          to { transform: scale(1.2); color: hsl(var(--chart-2)); }
        }
        @keyframes point-loss {
          from { transform: scale(1); color: hsl(var(--foreground)); }
          to { transform: scale(1.2); color: hsl(var(--destructive)); }
        }
        .points-gain {
          animation: point-gain 0.7s ease-in-out forwards;
          animation-delay: 0.5s;
        }
         .points-loss {
          animation: point-loss 0.7s ease-in-out forwards;
          animation-delay: 0.5s;
        }
      `}</style>

      {standings.length >= 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Podium</CardTitle>
            <CardDescription>Event: {party.event}</CardDescription>
          </CardHeader>
          <CardContent>
            <Podium winners={standings.slice(0, 3)} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Final Standings</CardTitle>
          {countsForPoints && <CardDescription>Points count toward the All-Time Points leaderboard.</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          {standings.length === 0 && (
            <p className="text-center text-muted-foreground">No times were submitted for this race.</p>
          )}
          {standings.map((result, index) => (
            <div
              key={result.id}
              className="result-card flex items-center justify-between p-4 rounded-lg bg-muted"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold w-8 text-center">{result.rank}</span>
                <div>
                  <Link href={`/profile/${result.id}`} className="font-bold text-lg hover:underline">
                    {result.name}{result.id === me && ' (You)'}
                  </Link>
                  <p className="font-mono text-muted-foreground">{result.time}</p>
                </div>
                <CountryTag country={result.country} />
              </div>
              {countsForPoints && result.points > 0 && (
                <div className="flex items-center gap-1 text-xl font-bold points-gain">
                  +{result.points}
                  <span className="text-sm font-normal ml-1">pts</span>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Button asChild className="w-full" size="lg">
        <Link href="/dashboard">
          <Home className="mr-2" /> Back to Dashboard
        </Link>
      </Button>
    </div>
  );
}

export default function DualResultsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <ResultsView />
    </Suspense>
  );
}
