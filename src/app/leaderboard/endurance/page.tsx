'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Target, Clock, MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { getCountryByCode } from '@/lib/countries';
import Image from 'next/image';

const mockGlobalResults = {
  '1-hour': [],
  '12-hour': [],
  'tether': [],
  '24-hour': [],
};

const mockCountryResults = {
  '1-hour': [],
  '12-hour': [],
  'tether': [],
  '24-hour': [],
};

const mockLocalResults = {
  '1-hour': [],
  '12-hour': [],
  'tether': [],
  '24-hour': [],
};

type Challenge = '1-hour' | '12-hour' | '24-hour' | 'tether';
type Unit = 'meters' | 'yards';

const challengeLabels: Record<Challenge, string> = {
    'tether': 'Daily Swim Tether Challenge',
    '1-hour': 'Daily 1-Hour Swim Challenge',
    '12-hour': 'Daily 12-Hour Swim Challenge',
    '24-hour': 'Daily 24-Hour Swim Challenge',
}

const getUnitLabel = (challenge: Challenge, unit: Unit) => {
    if (challenge === 'tether') return 'Time';
    return unit === 'meters' ? 'Distance (m)' : 'Distance (yd)';
}

// Simple conversion for display purposes
const convertDistance = (distanceStr: string, toUnit: Unit): string => {
    if (!distanceStr) return '';
    const isKm = distanceStr.includes('km');
    const value = parseFloat(distanceStr.replace(/,/g, ''));

    let meters = isKm ? value * 1000 : value;

    if (toUnit === 'yards') {
        const yards = meters * 1.09361;
        if (isKm) {
            return `${(yards / 1760).toFixed(1)}mi`; // a rough conversion to miles for larger distances
        }
        return `${Math.round(yards).toLocaleString()}yd`;
    }
    
    return distanceStr; // Return original if meters
};

const DailyCountdown = () => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const endOfDay = new Date();
            endOfDay.setUTCHours(23, 59, 59, 999);

            const difference = endOfDay.getTime() - now.getTime();

            if (difference > 0) {
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
                const minutes = Math.floor((difference / 1000 / 60) % 60).toString().padStart(2, '0');
                const seconds = Math.floor((difference / 1000) % 60).toString().padStart(2, '0');
                setTimeLeft(`${hours}:${minutes}:${seconds}`);
            } else {
                setTimeLeft('00:00:00');
                // Here you could trigger a leaderboard reset
            }
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="text-primary"/>
                    Daily Challenge Countdown
                </CardTitle>
                <CardDescription>The leaderboards for all daily endurance challenges will reset when this timer hits zero.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center">
                    <p className="font-mono text-4xl font-bold text-primary">{timeLeft || 'Loading...'}</p>
                    <p className="text-sm text-muted-foreground">Time Until Leaderboard Reset</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function EnduranceLeaderboardPage() {
  const [challenge, setChallenge] = useState<Challenge>('1-hour');
  const [unit, setUnit] = useState<Unit>('meters');
  const { profile } = useUserProfile();
  const userCountry = profile ? getCountryByCode(profile.country) : null;

  const globalResults = (mockGlobalResults as any)[challenge] || [];
  const countryResults = (mockCountryResults as any)[challenge] || [];
  const localResults = (mockLocalResults as any)[challenge] || [];

  return (
    <div className="container mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-3xl font-bold">Endurance Leaderboards</h1>
        <p className="text-muted-foreground">
          See how you stack up in the ultimate tests of stamina.
        </p>
      </div>

       <DailyCountdown />

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Select Challenge</CardTitle>
          <Select value={challenge} onValueChange={(val) => setChallenge(val as Challenge)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a challenge" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tether">Daily Swim Tether Challenge</SelectItem>
              <SelectItem value="1-hour">Daily 1-Hour Swim Challenge</SelectItem>
              <SelectItem value="12-hour">Daily 12-Hour Swim Challenge</SelectItem>
              <SelectItem value="24-hour">Daily 24-Hour Swim Challenge</SelectItem>
            </SelectContent>
          </Select>
           {challenge !== 'tether' && (
             <div>
                <CardTitle>Select Unit</CardTitle>
                <Tabs value={unit} onValueChange={(val) => setUnit(val as Unit)} className="w-full pt-2">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="meters">Meters</TabsTrigger>
                        <TabsTrigger value="yards">Yards</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
           )}
        </CardHeader>
      </Card>

      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="global">Global Results</TabsTrigger>
          <TabsTrigger value="country">Country Results</TabsTrigger>
          <TabsTrigger value="local">Your Results</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy /> Global Top 100</CardTitle>
              <CardDescription>{challengeLabels[challenge]}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Swimmer</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead className="text-right">{getUnitLabel(challenge, unit)}</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {globalResults.length > 0 ? (
                    globalResults.map((result: any, index: number) => {
                      const country = getCountryByCode(result.countryCode);
                      return (
                        <TableRow key={index}>
                            <TableCell className="font-bold text-lg">{result.rank}</TableCell>
                            <TableCell>{result.swimmer} {result.swimmer === 'You' && '(You)'}</TableCell>
                            <TableCell>
                               {country && <Image src={country.flag} alt={country.name} width={24} height={18} className="rounded-sm"/>}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                                {result.distance ? convertDistance(result.distance, unit) : result.time}
                            </TableCell>
                             <TableCell className="text-right font-bold text-primary">
                                <div className="flex items-center justify-end gap-2">
                                  {result.rank <=3 && <Trophy className="size-4 text-yellow-500" />}
                                  {result.points}
                                </div>
                            </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        No global results for this challenge yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="country" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin />
                        Top 100 in {userCountry?.name || 'Your Country'}
                    </CardTitle>
                     <CardDescription>{challengeLabels[challenge]}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">Rank</TableHead>
                                <TableHead>Swimmer</TableHead>
                                <TableHead className="text-right">{getUnitLabel(challenge, unit)}</TableHead>
                                <TableHead className="text-right">Points</TableHead>
                            </TableRow>
                        </TableHeader>
                         <TableBody>
                            {countryResults.length > 0 ? (
                                countryResults.map((result: any, index: number) => (
                                <TableRow key={index}>
                                    <TableCell className="font-bold text-lg">{result.rank}</TableCell>
                                    <TableCell>{result.swimmer} {result.swimmer === 'You' && '(You)'}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        {result.distance ? convertDistance(result.distance, unit) : result.time}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-primary">
                                        <div className="flex items-center justify-end gap-2">
                                            {result.rank <= 3 && <Trophy className="size-4 text-yellow-500" />}
                                            {result.points}
                                        </div>
                                    </TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    No results for your country in this challenge yet.
                                </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="local" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target /> Your Bests</CardTitle>
              <CardDescription>{challengeLabels[challenge]}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">{getUnitLabel(challenge, unit)}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localResults.length > 0 ? (
                     localResults.map((result: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-bold text-lg">{result.rank}</TableCell>
                        <TableCell>{result.date}</TableCell>
                        <TableCell className="text-right font-mono">
                           {result.distance ? convertDistance(result.distance, unit) : result.time}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center h-24">
                        You have not participated in this challenge yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}