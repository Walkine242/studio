'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Trophy, ArrowUp, ArrowDown, Award as AwardIcon, CheckCircle2, Watch, Share2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { countries } from '@/lib/countries';
import Image from 'next/image';
import { getRaceResults } from '@/lib/services/race-results-service';
import type { RaceResult } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { AppleIcon } from '@/components/icons/apple';
import { FitbitIcon } from '@/components/icons/fitbit';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile } from '@/lib/hooks/use-user-profile';

const getCountry = (code?: string) => {
  if (!code) return countries[0];
  const found = countries.find((c) => c.code.toLowerCase() === code.toLowerCase() || c.name.toLowerCase() === code.toLowerCase());
  return found || countries[0];
};

const SourceIcon = ({ source }: { source?: string }) => {
  switch (source) {
    case 'apple-watch':
      return <AppleIcon className="size-4 text-slate-100" />;
    case 'form-goggles':
      return <Watch className="size-4 text-cyan-400" />;
    case 'garmin':
    case 'suunto':
    case 'polar':
    case 'coros':
      return <Watch className="size-4 text-emerald-400" />;
    case 'fitbit':
      return <FitbitIcon className="size-4 text-sky-400" />;
    default:
      return <Watch className="size-4 text-orange-400" />;
  }
};

function DualResultsContent() {
  const searchParams = useSearchParams();
  const partyId = searchParams.get('partyId');
  const resultId = searchParams.get('resultId');
  const { toast } = useToast();

  const [results, setResults] = useState<RaceResult[]>([]);
  const [eventName, setEventName] = useState<string>('Dual Challenge Event');
  const [userResult, setUserResult] = useState<RaceResult | null>(null);

  useEffect(() => {
    async function loadResults() {
      const allResults = await getRaceResults();
      
      let matched = allResults;
      if (partyId) {
        matched = allResults.filter((r) => r.partyId === partyId);
      } else if (resultId) {
        matched = allResults.filter((r) => r.id === resultId);
      }

      if (matched.length > 0) {
        setResults(matched);
        setEventName(matched[0].event || 'Dual Challenge Event');
        setUserResult(matched[0]);
      } else if (allResults.length > 0) {
        setResults(allResults.slice(0, 5));
        setEventName(allResults[0].event || 'Dual Challenge Event');
        setUserResult(allResults[0]);
      }
    }
    loadResults();
  }, [partyId, resultId]);

  const profile = getUserProfile();

  const displayStandings = results.length > 0 ? results.map((r, index) => ({
    name: r.swimmerName || (index === 0 ? (profile.name || 'You') : `Swimmer ${index + 1}`),
    rank: index + 1,
    points: index === 0 ? 50 : index === 1 ? 25 : 10,
    time: r.formattedTime || `${r.totalTime.toFixed(2)}s`,
    country: getCountry(r.country || profile.country),
    source: r.source || 'apple-watch',
  })) : [
    { name: profile.name || 'You', rank: 1, points: 50, time: '00:24.85', country: getCountry(profile.country), source: 'apple-watch' },
    { name: 'Swimmer 2', rank: 2, points: 25, time: '00:25.40', country: getCountry('US'), source: 'form-goggles' },
    { name: 'Swimmer 3', rank: 3, points: 10, time: '00:26.10', country: getCountry('GB'), source: 'garmin' },
  ];

  const topThree = displayStandings.slice(0, 3);

  const handleShareResult = () => {
    toast({
      title: 'Result Shared! 🚀',
      description: 'Your verified wearable swim time was posted to your profile and feed.',
    });
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-8 py-4">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <AwardIcon className="mx-auto size-16 text-yellow-400 animate-bounce" />
        <h1 className="font-headline text-4xl font-extrabold text-white">Dual Challenge Complete!</h1>
        <p className="text-cyan-200 text-sm max-w-md mx-auto">
          Official telemetry recorded and posted to leaderboards for <strong className="text-white">{eventName}</strong>.
        </p>

        {userResult?.source && (
          <div className="inline-flex items-center gap-2 bg-slate-900 border border-cyan-500/40 px-4 py-1.5 rounded-full text-xs font-semibold text-cyan-300 shadow-md mt-2">
            <CheckCircle2 className="size-4 text-emerald-400" />
            <SourceIcon source={userResult.source} />
            <span>Verified via {userResult.source.replace('-', ' ').toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Podium Card */}
      <Card className="border-slate-800 bg-slate-900/70 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl text-white">Challenge Podium</CardTitle>
          <CardDescription className="text-slate-400 text-xs">Event: {eventName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-end gap-3 mt-4 h-64">
            {/* 2nd Place */}
            {topThree[1] && (
              <div className="flex flex-col items-center w-1/3 max-w-[130px]">
                <Trophy className="text-slate-400 size-8 mb-1" />
                <p className="font-bold text-sm text-slate-200 truncate max-w-full">{topThree[1].name}</p>
                <div className="flex items-center gap-1 text-xs text-slate-400 my-1">
                  <Image src={topThree[1].country.flag} alt={topThree[1].country.name} width={18} height={12} className="rounded-xs" />
                  <span>{topThree[1].country.code}</span>
                </div>
                <div className="bg-slate-800 border border-slate-700 w-full rounded-t-xl text-center p-3 h-28 flex flex-col items-center justify-center">
                  <span className="font-bold text-2xl text-slate-300">2</span>
                  <span className="font-mono text-xs text-cyan-400 font-semibold">{topThree[1].time}</span>
                </div>
              </div>
            )}

            {/* 1st Place Winner */}
            {topThree[0] && (
              <div className="flex flex-col items-center w-1/3 max-w-[150px]">
                <Trophy className="text-yellow-400 size-12 mb-1 animate-pulse" />
                <p className="font-extrabold text-base text-yellow-300 truncate max-w-full">{topThree[0].name}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-300 my-1">
                  <Image src={topThree[0].country.flag} alt={topThree[0].country.name} width={20} height={14} className="rounded-xs" />
                  <span className="font-bold">{topThree[0].country.code}</span>
                </div>
                <div className="bg-gradient-to-t from-cyan-600 to-blue-600 w-full rounded-t-2xl text-center p-4 h-40 flex flex-col items-center justify-center shadow-lg shadow-cyan-500/20">
                  <span className="font-extrabold text-3xl text-white">1</span>
                  <span className="font-mono text-sm text-yellow-200 font-extrabold">{topThree[0].time}</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <div className="flex flex-col items-center w-1/3 max-w-[130px]">
                <Trophy className="text-amber-600 size-7 mb-1" />
                <p className="font-bold text-sm text-slate-300 truncate max-w-full">{topThree[2].name}</p>
                <div className="flex items-center gap-1 text-xs text-slate-400 my-1">
                  <Image src={topThree[2].country.flag} alt={topThree[2].country.name} width={18} height={12} className="rounded-xs" />
                  <span>{topThree[2].country.code}</span>
                </div>
                <div className="bg-slate-800 border border-slate-700 w-full rounded-t-xl text-center p-3 h-20 flex flex-col items-center justify-center">
                  <span className="font-bold text-xl text-amber-500">3</span>
                  <span className="font-mono text-xs text-cyan-400 font-semibold">{topThree[2].time}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Standings Table */}
      <Card className="border-slate-800 bg-slate-900/70 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl text-white">Official Standings & Telemetry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {displayStandings.map((result, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-all"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl font-extrabold w-8 text-center text-cyan-400">{result.rank}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-100">{result.name}</p>
                    <Badge variant="outline" className="border-slate-700 bg-slate-900 text-slate-300 text-[10px] gap-1">
                      <SourceIcon source={result.source} />
                      <span className="capitalize">{result.source.replace('-', ' ')}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm text-cyan-300 font-bold">{result.time}</span>
                    <span className="text-slate-600">•</span>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Image src={result.country.flag} alt={result.country.name} width={16} height={11} className="rounded-xs" />
                      <span>{result.country.code}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-lg font-bold text-emerald-400">
                <ArrowUp className="size-5" />
                <span>+{result.points}</span>
                <span className="text-xs text-slate-400 font-normal ml-1">pts</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Footer CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <Button onClick={handleShareResult} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-6 text-base">
          <Share2 className="mr-2 size-5" /> Share Result to Swimmer Feed
        </Button>
        <Button asChild size="lg" variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 hover:text-white">
          <Link href="/dual">
            <Home className="mr-2 size-5" /> Back to Dual Mode Hub
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function DualResultsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto flex flex-col justify-center items-center h-64 gap-3">
        <AwardIcon className="size-12 animate-bounce text-yellow-400" />
        <p className="text-sm text-slate-400">Loading Challenge Results...</p>
      </div>
    }>
      <DualResultsContent />
    </Suspense>
  );
}

