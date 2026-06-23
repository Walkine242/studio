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
  '1-hour': [
    { rank: 1, swimmer: 'Alex Johnson', distance: '4,520m', countryCode: 'USA', points: 100 },
    { rank: 2, swimmer: 'Yuki Tanaka', distance: '4,480m', countryCode: 'JPN', points: 90 },
    { rank: 3, swimmer: 'Sven Eriksson', distance: '4,450m', countryCode: 'SWE', points: 80 },
    { rank: 4, swimmer: 'Maria Garcia', distance: '4,430m', countryCode: 'ESP', points: 70 },
    { rank: 5, swimmer: 'David Lee', distance: '4,415m', countryCode: 'CAN', points: 60 },
    { rank: 6, swimmer: 'Anya Petrova', distance: '4,405m', countryCode: 'RUS', points: 50 },
    { rank: 7, swimmer: 'Carlos Silva', distance: '4,390m', countryCode: 'BRA', points: 40 },
    { rank: 8, swimmer: 'You', distance: '4,380m', countryCode: 'USA', points: 30 },
    { rank: 9, swimmer: 'Li Wei', distance: '4,375m', countryCode: 'CHN', points: 20 },
    { rank: 10, swimmer: 'John Smith', distance: '4,360m', countryCode: 'GBR', points: 10 },
  ],
  '12-hour': [
    { rank: 1, swimmer: 'Fatima Al-Fahim', distance: '40.1km', countryCode: 'UAE', points: 100 },
    { rank: 2, swimmer: 'Chloe Dubois', distance: '38.9km', countryCode: 'FRA', points: 90 },
    { rank: 3, swimmer: 'You', distance: '35.5km', countryCode: 'USA', points: 80 },
    { rank: 4, swimmer: 'Sven Eriksson', distance: '34.2km', countryCode: 'SWE', points: 70 },
    { rank: 5, swimmer: 'Yuki Tanaka', distance: '33.8km', countryCode: 'JPN', points: 60 },
    { rank: 6, swimmer: 'Alex Johnson', distance: '33.5km', countryCode: 'USA', points: 50 },
  ],
   'tether': [
    { rank: 1, swimmer: 'You', time: '03:15:22', countryCode: 'USA', points: 100 },
    { rank: 2, swimmer: 'Alex Johnson', time: '03:12:01', countryCode: 'USA', points: 90 },
    { rank: 3, swimmer: 'Yuki Tanaka', time: '02:58:45', countryCode: 'JPN', points: 80 },
    { rank: 4, swimmer: 'Fatima Al-Fahim', time: '02:55:10', countryCode: 'UAE', points: 70 },
    { rank: 5, swimmer: 'Sven Eriksson', time: '02:51:33', countryCode: 'SWE', points: 60 },
  ],
};

const mockCountryResults = {
    '1-hour': [
        { rank: 1, swimmer: 'Alex Johnson', distance: '4,520m', points: 50 },
        { rank: 2, swimmer: 'You', distance: '4,380m', points: 45 },
        { rank: 3, swimmer: 'Michael Phelps', distance: '4,350m', points: 40 },
    ],
    '12-hour': [
        { rank: 1, swimmer: 'You', distance: '35.5km', points: 50 },
        { rank: 2, swimmer: 'Alex Johnson', distance: '33.5km', points: 45 },
    ],
    'tether': [
         { rank: 1, swimmer: 'You', time: '03:15:22', points: 50 },
         { rank: 2, swimmer: 'Alex Johnson', time: '03:12:01', points: 45 },
    ]
}

const mockLocalResults = {
  '1-hour': [{ rank: 8, distance: '4,380m', date: '2024-08-01' }],
  '12-hour': [{ rank: 3, distance: '35.5km', date: '2024-07-15' }],
  'tether': [{ rank: 1, time: '03:15:22', date: '2024-06-20' }],
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