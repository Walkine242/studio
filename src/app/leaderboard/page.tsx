
'use client';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { useRaceResults, useMyRaceResults } from '@/lib/hooks/use-race-results';
import { useAuth } from '@/lib/auth/auth-provider';
import { createParty } from '@/lib/services/party-service';
import { useRouter } from 'next/navigation';
import { useAllTimeBestByEvent } from '@/lib/hooks/use-all-time-best-by-event';
import { useAllTimePoints } from '@/lib/hooks/use-all-time-points';
import { formatTime } from '@/lib/utils';
import { Trophy, Loader2, Star, Target, Swords, Send, Clock, Flame, BarChart3 } from 'lucide-react';
import { useState, useMemo, Fragment } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { leagues, getLeagueDateRange } from '@/config/leagues';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { METER_EVENTS, YARD_EVENTS } from '@/config/events';


type Unit = 'meters' | 'yards';


function LeaderboardTable({ results, isInitialized }: { results: ReturnType<typeof useRaceResults>['raceResults'], isInitialized: boolean }) {
  const sortedRaces = (results || []).sort((a, b) => a.totalTime - b.totalTime);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Rank</TableHead>
          <TableHead>Swimmer</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Event</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {!isInitialized ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center h-24">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            </TableCell>
          </TableRow>
        ) : sortedRaces.length > 0 ? (
          sortedRaces.map((result, index) => {
            const rank = index + 1;
            return (
              <TableRow key={result.id}>
                <TableCell className="font-bold text-lg">
                  <div className="flex items-center gap-2">
                    {index === 0 && <Trophy className="size-5 text-yellow-500" />}
                    {index === 1 && <Trophy className="size-5 text-gray-400" />}
                    {index === 2 && <Trophy className="size-5 text-orange-400" />}
                    <span>{rank}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Link href={`/profile/${result.swimmerId}`} className="hover:underline">{result.swimmerName ?? 'Swimmer'}</Link>
                </TableCell>
                <TableCell className="font-mono font-semibold text-primary text-lg">
                  {formatTime(result.totalTime)}
                </TableCell>
                <TableCell>{result.event}</TableCell>
                <TableCell>{new Date(result.date).toLocaleDateString()}</TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center h-24">
              No races recorded for this league and year.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

function LeagueLeaderboardDisplay({ title, description, useDataHook, isCountryScoped, isGlobalScoped }: { title: string, description: string, useDataHook: typeof useRaceResults | typeof useMyRaceResults, isCountryScoped?: boolean, isGlobalScoped?: boolean }) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(Math.max(currentYear, 2027));
  const [selectedLeague, setSelectedLeague] = useState<string>('summer');
  const { profile } = useUserProfile();

  const years = useMemo(() => {
    const startYear = 2027;
    const endYear = Math.max(currentYear, startYear);
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i);
  }, [currentYear]);

  const dateRange = useMemo(() => getLeagueDateRange(selectedYear, selectedLeague), [selectedYear, selectedLeague]);
  
  // The type assertion is complex, so we manage it here.
  const hookOptions: any = { dateRange };
  if (isCountryScoped && profile) {
      hookOptions.country = profile.country;
  }
   if (isGlobalScoped) {
      hookOptions.global = true;
  }
  const { raceResults, isInitialized } = useDataHook(hookOptions);


  return (
      <Card className="shadow-lg w-full">
          <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <BarChart3 />
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
              <div className="flex gap-4 pt-4">
                  <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
                      <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                          {years.map(year => (
                              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                  <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                      <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select League" />
                      </SelectTrigger>
                      <SelectContent>
                          {leagues.map(league => (
                              <SelectItem key={league.id} value={league.id}>{league.name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
          </CardHeader>
          <CardContent>
              <LeaderboardTable results={raceResults} isInitialized={isInitialized} />
          </CardContent>
      </Card>
  );
}

function AllTimeBestByEventLeaderboard() {
    const { bestTimes, isInitialized } = useAllTimeBestByEvent();
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSending, setIsSending] = useState(false);
    const [isDualDialogOpen, setIsDualDialogOpen] = useState(false);
    const [dualEvent, setDualEvent] = useState('');
    const [dualUnit, setDualUnit] = useState<Unit>('meters');
    const [challengedSwimmer, setChallengedSwimmer] = useState<{name: string, id: string, rank: number} | null>(null);

    const bestTimesByEvent = useMemo(() => {
        return bestTimes.reduce((acc, record) => {
            if (!acc[record.event]) {
                acc[record.event] = [];
            }
            acc[record.event].push(record);
            return acc;
        }, {} as Record<string, typeof bestTimes>);
    }, [bestTimes]);

    // Opens a private race for the chosen event; share the lobby link with the swimmer you're challenging.
    const handleRequestDual = async () => {
        if (!dualEvent || !challengedSwimmer) {
            toast({
                variant: 'destructive',
                title: 'No Event Selected',
                description: 'Please select an event for the dual.',
            });
            return;
        }
        setIsSending(true);
        try {
            const party = await createParty({ event: dualEvent, isPublic: false });
            toast({
                title: 'Dual Created!',
                description: `Share the lobby link with ${challengedSwimmer.name} to start racing.`,
            });
            setIsDualDialogOpen(false);
            setDualEvent('');
            setChallengedSwimmer(null);
            router.push(`/dual/invite/${party.id}`);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Could Not Create Dual', description: error instanceof Error ? error.message : 'Please try again.' });
        } finally {
            setIsSending(false);
        }
    }

    const swimEvents = dualUnit === 'meters' ? METER_EVENTS : YARD_EVENTS;

    return (
        <Card className="shadow-lg w-full">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2"><Star className="text-yellow-500"/>All-Time Fastest Times</CardTitle>
                <CardDescription>Top 8 fastest times recorded for each event across all users. Challenge them to a dual!</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>Rank</TableHead>
                            <TableHead>Swimmer</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead className="w-24"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!isInitialized ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
                        ) : Object.keys(bestTimesByEvent).length > 0 ? (
                           Object.entries(bestTimesByEvent).map(([event, records]) => (
                               <Fragment key={event}>
                                {records.map((record, index) => {
                                    const rank = index + 1;
                                    const isCurrentUser = record.swimmerId === user?.id;
                                    return (
                                        <TableRow key={`${event}-${record.swimmerId}`}>
                                            {index === 0 && <TableCell rowSpan={records.length} className="font-semibold align-top">{event}</TableCell>}
                                            <TableCell className="font-bold">{rank}</TableCell>
                                            <TableCell>
                                                <Link href={`/profile/${record.swimmerId}`} className="hover:underline">
                                                    {record.swimmerName} {isCurrentUser && "(You)"}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="font-mono font-bold text-primary">{formatTime(record.totalTime)}</TableCell>
                                            <TableCell>
                                                 {!isCurrentUser && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setChallengedSwimmer({name: record.swimmerName, id: record.swimmerId, rank});
                                                            setIsDualDialogOpen(true);
                                                        }}
                                                    >
                                                        <Swords className="mr-2" /> Dual
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                               </Fragment>
                           ))
                        ) : (
                            <TableRow><TableCell colSpan={5} className="text-center h-24">No records found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
             <Dialog open={isDualDialogOpen} onOpenChange={setIsDualDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request a Dual with {challengedSwimmer?.name}</DialogTitle>
                        <CardDescription>Pick an event. We'll open a private race and give you a link to send them.</CardDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Tabs value={dualUnit} onValueChange={(value) => setDualUnit(value as Unit)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="meters">Meters</TabsTrigger>
                                <TabsTrigger value="yards">Yards</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Select onValueChange={setDualEvent} value={dualEvent}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select event type" />
                            </SelectTrigger>
                            <SelectContent>
                            {swimEvents.map((event) => (
                                <SelectItem key={event} value={event}>{event}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>

                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="button" onClick={handleRequestDual} disabled={!dualEvent || isSending}>
                            <Send className="mr-2"/> Create Dual
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

function AllTimePointsLeaderboard() {
    const { allTimePoints, isInitialized } = useAllTimePoints();

    return (
        <Card className="shadow-lg w-full">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2"><Trophy className="text-yellow-500"/>All-Time Points</CardTitle>
                <CardDescription>Global leaderboard based on total points earned in Finals events.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16">Rank</TableHead>
                            <TableHead>Swimmer</TableHead>
                            <TableHead>Races</TableHead>
                            <TableHead className="text-right">Total Points</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!isInitialized ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : allTimePoints.length > 0 ? (
                            allTimePoints.map((swimmer, index) => {
                                const rank = index + 1;
                                return (
                                    <TableRow key={swimmer.swimmer}>
                                        <TableCell className="font-bold text-lg">
                                            <div className="flex items-center gap-2">
                                                {rank === 1 && <Trophy className="size-5 text-yellow-500" />}
                                                {rank === 2 && <Trophy className="size-5 text-gray-400" />}
                                                {rank === 3 && <Trophy className="size-5 text-orange-400" />}
                                                <span>{rank}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                             <Link href={`/profile/${swimmer.swimmer}`} className="hover:underline">
                                                {swimmer.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{swimmer.races}</TableCell>
                                        <TableCell className="font-bold text-primary text-right">{swimmer.points.toLocaleString()}</TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    No points recorded yet. Compete in Finals to earn points!
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function LeaderboardPage() {
  const { profile } = useUserProfile();

  return (
    <div className="container mx-auto max-w-6xl space-y-8">
        <div className="text-center">
            <h1 className="font-headline text-3xl font-bold">Leaderboards</h1>
            <p className="text-muted-foreground">See where you stand against the competition.</p>
        </div>
        <Tabs defaultValue="all-time-points" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all-time-points">All-Time Points</TabsTrigger>
                <TabsTrigger value="all-time-best">All-Time Bests</TabsTrigger>
                <TabsTrigger value="league">League Standings</TabsTrigger>
            </TabsList>

            <TabsContent value="all-time-points" className="mt-6">
                <AllTimePointsLeaderboard />
            </TabsContent>

            <TabsContent value="all-time-best" className="mt-6">
                <AllTimeBestByEventLeaderboard />
            </TabsContent>

            <TabsContent value="league" className="mt-6">
                <div className="space-y-8">
                     <LeagueLeaderboardDisplay
                        title="Your League Standings"
                        description="Your personal bests for each event within the selected league."
                        useDataHook={useMyRaceResults as any}
                     />
                     <LeagueLeaderboardDisplay
                        title="Country League Standings"
                        description="The fastest times recorded in your country for the selected league."
                        useDataHook={useRaceResults as any}
                        isCountryScoped={true}
                    />
                    <LeagueLeaderboardDisplay
                        title="Global League Standings"
                        description="The fastest times recorded in the world for the selected league."
                        useDataHook={useRaceResults as any}
                        isGlobalScoped={true}
                    />
                </div>
            </TabsContent>
        </Tabs>
    </div>
  );
}
