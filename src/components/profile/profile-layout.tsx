
'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { countries, Country, getCountryByCode } from '@/lib/countries';
import { getRegisteredUsers, type RegisteredUser } from '@/lib/users';
import { 
    Loader2, 
    User, 
    Save, 
    Award as AwardIcon, 
    Search, 
    UserPlus, 
    UserCheck, 
    Swords, 
    Clock, 
    Send, 
    Trophy, 
    Trash2, 
    UserX, 
    Plus, 
    Check, 
    Circle, 
    BarChart3, 
    Calendar, 
    Goal as GoalIconLucide, 
    History, 
    Sparkles, 
    Target, 
    PersonStanding, 
    Watch, 
    MapPin, 
    Calculator, 
    Timer,
    Medal,
    ArrowLeftRight
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { UserProfileData, PersonalBest, Goal, RaceResult } from '@/lib/types';
import { cn, formatTime, formatSwimTime, swimTimeToMs, convertSwimTimeStr } from '@/lib/utils';
import { createParty } from '@/lib/services/party-service';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'next/navigation';
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
import { METER_EVENTS, YARD_EVENTS } from '@/config/events';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MEETS } from '@/config/meets';
import { leagues } from '@/config/leagues';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { usePersonalBests } from '@/lib/hooks/use-personal-bests';
import { useGoals } from '@/lib/hooks/use-goals';
import { useRaceResults } from '@/lib/hooks/use-race-results';
import { getAwardsForUser } from '@/lib/services/awards-service';
import type { Award } from '@/lib/types';
import { Badge } from '../ui/badge';
import { useAllTimePoints } from '@/lib/hooks/use-all-time-points';
import { getAllRaceResults } from '@/lib/services/race-results-service';
import { useWorkoutLogs } from '@/lib/hooks/use-workout-logs';
import { AppleIcon } from '../icons/apple';
import { FitbitIcon } from '../icons/fitbit';
import {
  useConnectedDevices,
  DEVICE_METADATA,
  type ConnectedDeviceKey,
} from '@/lib/hooks/use-connected-devices';
import { ConnectDeviceModal } from '@/components/connect-device-modal';
import { Bluetooth, Radio, Battery, Wifi, CheckCircle2, Unlink, RefreshCw, Zap } from 'lucide-react';

const pbSchema = z.object({
  stroke: z.string().min(1, 'Stroke is required.'),
  distance: z.coerce.number().min(1, 'Distance must be positive.'),
  unit: z.enum(['meters', 'yards']).default('meters'),
  time: z.string().min(1, 'Time is required (e.g., 52.10 or 1:05.23).'),
});

const goalSchema = z.object({
  type: z.enum(['custom', 'personal_best', 'leaderboard_rank', 'meet_qualification', 'goal_time_standard']),
  description: z.string().default(''),
  targetDate: z.string().default(new Date().toISOString().split('T')[0]),
  // Personal Best / Time Standard
  event: z.string().default(''),
  targetTime: z.string().default(''),
  // Leaderboard
  league: z.string().default(''),
  targetRank: z.coerce.number().default(0),
  // Meet
  meetId: z.string().default(''),
});

type GoalFormData = z.infer<typeof goalSchema>;

const strokes = ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'IM'];

const AwardTrophy = ({ rank, type = 'standard' }: { rank: number, type?: 'standard' | 'platinum' }) => {
    if (type === 'platinum') {
        return <Trophy className="size-8 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.8)] animate-pulse" />;
    }

    if (rank === 1) return <Medal className="size-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]" />;
    if (rank === 2) return <Medal className="size-8 text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.5)]" />;
    if (rank === 3) return <Medal className="size-8 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" />;
    
    return <AwardIcon className="size-8 text-muted-foreground" />;
}

interface ProfileLayoutProps {
    profileData: UserProfileData;
    isLoading: boolean;
    onProfileSave?: (data: { name: string; country: string }) => void;
}

type Unit = 'meters' | 'yards';

function CurrentRankings({ userId, countryCode }: { userId: string, countryCode: string }) {
    const { allTimePoints: globalPoints, isInitialized: globalInitialized } = useAllTimePoints();
    const { allTimePoints: countryPoints, isInitialized: countryInitialized } = useAllTimePoints(countryCode);
    
    const getRanking = (pointsData: any[], initialized: boolean) => {
        if (!initialized) return null;
        const rankIndex = pointsData.findIndex(p => p.swimmer === userId);
        if (rankIndex === -1) {
            return { rank: 'N/A', points: 0 };
        }
        return {
            rank: rankIndex + 1,
            points: pointsData[rankIndex].points,
        };
    };

    const globalRanking = getRanking(globalPoints, globalInitialized);
    const countryRanking = getRanking(countryPoints, countryInitialized);

    const isInitialized = globalInitialized && countryInitialized;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target /> Current Rankings</CardTitle>
                <CardDescription>Based on All-Time Points leaderboard.</CardDescription>
            </CardHeader>
            <CardContent>
                {!isInitialized ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center"><Skeleton className="h-4 w-20" /><Skeleton className="h-6 w-12" /></div>
                        <div className="flex justify-between items-center"><Skeleton className="h-4 w-24" /><Skeleton className="h-6 w-16" /></div>
                         <div className="flex justify-between items-center"><Skeleton className="h-4 w-24" /><Skeleton className="h-6 w-16" /></div>
                    </div>
                ) : (
                    <div className="space-y-4 text-lg">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-muted-foreground">Global Rank</span>
                            <span className="font-bold text-primary">{globalRanking?.rank || 'N/A'}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="font-semibold text-muted-foreground">Country Rank</span>
                            <span className="font-bold text-primary">{countryRanking?.rank || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-muted-foreground">Total Points</span>
                            <span className="font-bold text-primary">{globalRanking?.points.toLocaleString() || 0}</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function EventRankings({ userId }: { userId: string }) {
    const [rankings, setRankings] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const { personalBests, isInitialized: pbsInitialized } = usePersonalBests(userId);

    useEffect(() => {
        if (!pbsInitialized || personalBests.length === 0) {
            if (pbsInitialized) setIsLoading(false);
            return;
        }

        const fetchRanks = async () => {
            setIsLoading(true);
            const allResults = await getAllRaceResults();
            const newRankings: Record<string, number> = {};

            for (const pb of personalBests) {
                const pbUnit = pb.unit || 'meters';
                const eventResults = allResults
                    .filter(r => r.event === `${pb.distance}${pbUnit === 'meters' ? 'm' : 'yd'} ${pb.stroke}`)
                    .sort((a, b) => a.totalTime - b.totalTime);

                const rank = eventResults.findIndex(r => r.totalTime >= swimTimeToMs(pb.time)) + 1;
                newRankings[pb.id] = rank > 0 ? rank : eventResults.length + 1;
            }
            setRankings(newRankings);
            setIsLoading(false);
        };

        fetchRanks();
    }, [personalBests, pbsInitialized]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 /> Event Rankings</CardTitle>
                <CardDescription>Your rank based on your personal bests.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <div className="space-y-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                    </div>
                ) : personalBests.length === 0 ? (
                     <div className="text-center text-muted-foreground py-4">
                        <p>No personal bests to rank.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Event</TableHead>
                                <TableHead className="text-right">Rank</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {personalBests.map(pb => (
                                <TableRow key={pb.id}>
                                    <TableCell className="font-medium">{pb.distance}{pb.unit === 'yards' ? 'yd' : 'm'} {pb.stroke}</TableCell>
                                    <TableCell className="text-right font-bold text-primary">{rankings[pb.id] || 'N/A'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

function AwardsList({ userId, countryCode }: { userId: string, countryCode: string }) {
    const [awards, setAwards] = useState<Award[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const { allTimePoints: globalPoints, isInitialized: globalInitialized } = useAllTimePoints();
    const { allTimePoints: countryPoints, isInitialized: countryInitialized } = useAllTimePoints(countryCode);

    useEffect(() => {
        getAwardsForUser(userId).then(userAwards => {
            setAwards(userAwards);
            setIsLoading(false);
        });
    }, [userId]);

    const getRank = (pointsData: any[], initialized: boolean) => {
        if (!initialized) return null;
        const index = pointsData.findIndex(p => p.swimmer === userId);
        return index === -1 ? null : index + 1;
    };

    const globalRank = getRank(globalPoints, globalInitialized);
    const countryRank = getRank(countryPoints, countryInitialized);

    const isDataLoading = isLoading || !globalInitialized || !countryInitialized;

    if (isDataLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        )
    }

    const hasNoAwards = awards.length === 0 && (!globalRank || globalRank > 10) && (!countryRank || countryRank > 10);

    if (hasNoAwards) {
        return (
            <div className="text-center text-muted-foreground py-8">
                <p>No awards yet.</p>
                <p>Reach the Top 10 on a leaderboard or finish top 3 in a meet event to earn one!</p>
            </div>
        );
    }
    
    return (
         <ul className="space-y-3">
            {/* Global Platinum Award */}
            {globalRank && globalRank <= 10 && (
                <li className="flex items-center gap-4 p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-lg">
                    <AwardTrophy rank={0} type="platinum" />
                    <div>
                        <p className="font-bold text-indigo-200">Global Elite Ranking</p>
                        <p className="text-sm text-indigo-400">Achieved Top 10 status worldwide in All-Time Points.</p>
                    </div>
                </li>
            )}

            {/* Local Platinum Award */}
            {countryRank && countryRank <= 10 && (
                <li className="flex items-center gap-4 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-lg">
                    <AwardTrophy rank={0} type="platinum" />
                    <div>
                        <p className="font-bold text-emerald-200">National Star Status</p>
                        <p className="text-sm text-emerald-400">Ranked in the Top 10 for {getCountryByCode(countryCode)?.name}.</p>
                    </div>
                </li>
            )}

            {/* Meet Awards */}
            {awards.map(award => (
                <li key={award.id} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                    <AwardTrophy rank={award.rank} />
                    <div>
                        <p className="font-bold">{award.title}</p>
                        <p className="text-sm text-muted-foreground">{award.meet} - {new Date(award.date).toLocaleDateString()}</p>
                    </div>
                </li>
            ))}
        </ul>
    );
}

function PersonalBestsList({ isCurrentUser, userId }: { isCurrentUser: boolean, userId: string }) {
    const { personalBests, addPersonalBest, removePersonalBest, isInitialized } = usePersonalBests(userId);
    const { addRaceResult } = useRaceResults({userId});
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [displayUnit, setDisplayUnit] = useState<Unit>('meters');
    
    const form = useForm<z.infer<typeof pbSchema>>({
        resolver: zodResolver(pbSchema),
        defaultValues: { stroke: '', distance: 50, time: '', unit: 'meters' },
    });

    function onSubmit(values: z.infer<typeof pbSchema>) {
        let timeStr = values.time;
        if (timeStr.startsWith('0:') || timeStr.startsWith('00:')) {
            timeStr = timeStr.split(':').slice(1).join(':');
        }
        timeStr = formatSwimTime(timeStr);
        const timeMs = swimTimeToMs(timeStr);

        addRaceResult({
            event: `${values.distance}${values.unit === 'yards' ? 'yd' : 'm'} ${values.stroke}`,
            totalTime: timeMs,
            unit: values.unit,
            laps: [],
        });

        addPersonalBest({
            stroke: values.stroke,
            distance: values.distance,
            unit: values.unit,
            time: timeStr,
        });

        form.reset();
        setIsDialogOpen(false);
    }

    if (!isInitialized) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )
    }
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2"><Trophy /> Personal Bests</CardTitle>
                    <CardDescription>Your fastest recorded times. Instantly convert between units using the toggle.</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                    <Tabs value={displayUnit} onValueChange={(v) => setDisplayUnit(v as Unit)} className="w-[200px]">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="meters">Meters</TabsTrigger>
                            <TabsTrigger value="yards">Yards</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    {isCurrentUser && (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                            <Button><Plus className="mr-2" /> Add PB</Button>
                            </DialogTrigger>
                            <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Personal Best</DialogTitle>
                                <DialogDescription>Enter your time and stroke details. This will also be saved to your race history.</DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="stroke"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stroke</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a stroke" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {strokes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="distance"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Distance</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="unit"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unit</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Unit" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="meters">Meters</SelectItem>
                                                    <SelectItem value="yards">Yards</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                
                                <FormField
                                    control={form.control}
                                    name="time"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Time (e.g., 52.10 or 1:05.23)</FormLabel>
                                        <FormControl>
                                        <Input placeholder="Time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />

                                <DialogFooter>
                                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                    <Button type="submit">Save</Button>
                                </DialogFooter>
                                </form>
                            </Form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                 {personalBests.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        <p>No personal bests recorded yet.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Stroke</TableHead>
                                <TableHead>Distance</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Date</TableHead>
                                {isCurrentUser && <TableHead className="w-12"></TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {personalBests
                            .sort((a,b) => a.stroke.localeCompare(b.stroke) || a.distance - b.distance)
                            .map((pb) => {
                                const pbUnit = pb.unit || 'meters';
                                const needsConversion = pbUnit !== displayUnit;
                                const displayTime = needsConversion 
                                    ? convertSwimTimeStr(pb.time, pbUnit, displayUnit)
                                    : pb.time;

                                return (
                                    <TableRow key={pb.id}>
                                    <TableCell>{pb.stroke}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {pb.distance}{displayUnit === 'yards' ? 'yd' : 'm'}
                                            {needsConversion && (
                                                <Badge variant="outline" className="text-[10px] py-0 px-1 opacity-70">
                                                    <ArrowLeftRight className="size-2 mr-1" /> CONV
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className={cn("font-mono font-bold", needsConversion && "text-primary italic")}>
                                        {formatSwimTime(displayTime)}
                                    </TableCell>
                                    <TableCell>{new Date(pb.date).toLocaleDateString()}</TableCell>
                                    {isCurrentUser && (
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => removePersonalBest(pb.id)}>
                                                <Trash2 className="size-4 text-muted-foreground" />
                                            </Button>
                                        </TableCell>
                                    )}
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
             <CardFooter className="bg-muted/30 py-3 text-xs text-muted-foreground italic flex items-center gap-2">
                <ArrowLeftRight className="size-3" />
                Conversion factors: {displayUnit === 'yards' ? 'Meters to Yards (* 0.902)' : 'Yards to Meters (* 1.108)'}
            </CardFooter>
        </Card>
    )
}

function RaceHistoryList({ isCurrentUser, userId }: { isCurrentUser: boolean, userId: string }) {
    const { raceResults, removeRaceResult, isInitialized: raceResultsInitialized } = useRaceResults({userId});
    const [displayUnit, setDisplayUnit] = useState<Unit>('meters');

    if (!raceResultsInitialized) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2"><History /> Race History</CardTitle>
                    <CardDescription>A complete log of all your saved race attempts.</CardDescription>
                </div>
                <Tabs value={displayUnit} onValueChange={(v) => setDisplayUnit(v as Unit)} className="w-[200px]">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="meters">Meters</TabsTrigger>
                        <TabsTrigger value="yards">Yards</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent>
                {raceResults.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {raceResults.map((result) => {
                            const resultUnit = result.unit || 'meters';
                            const needsConversion = resultUnit !== displayUnit;
                            const displayMs = needsConversion 
                                ? swimTimeToMs(convertSwimTimeStr(formatTime(result.totalTime), resultUnit, displayUnit))
                                : result.totalTime;

                            return (
                                <AccordionItem value={`item-${result.id}`} key={result.id}>
                                    <AccordionTrigger>
                                        <div className="flex justify-between w-full pr-4">
                                            <div className="flex flex-col text-left">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-lg">{result.event}</span>
                                                    {needsConversion && (
                                                        <Badge variant="outline" className="text-[10px] py-0 px-1 opacity-70">
                                                            <ArrowLeftRight className="size-2 mr-1" /> CONV
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className={cn("font-mono text-2xl", needsConversion ? "text-primary/70 italic" : "text-primary")}>
                                                    {formatTime(displayMs)}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-sm text-muted-foreground">{new Date(result.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className='flex flex-col gap-4'>
                                            <div className="flex-1">
                                                <Table className="mt-2">
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Lap</TableHead>
                                                            <TableHead className="text-right">Lap Time</TableHead>
                                                            <TableHead className="text-right">Split Time</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {(() => {
                                                            let cumulativeTime = 0;
                                                            return result.laps.map((lapTime, index) => {
                                                                const displayLapMs = needsConversion ? swimTimeToMs(convertSwimTimeStr(formatTime(lapTime), resultUnit, displayUnit)) : lapTime;
                                                                cumulativeTime += displayLapMs;
                                                                return (
                                                                    <TableRow key={index}>
                                                                        <TableCell>Lap {index + 1}</TableCell>
                                                                        <TableCell className="font-mono text-right">{formatTime(displayLapMs)}</TableCell>
                                                                        <TableCell className="font-mono text-right">{formatTime(cumulativeTime)}</TableCell>
                                                                    </TableRow>
                                                                );
                                                            });
                                                        })()}
                                                        {result.laps.length === 0 && (
                                                            <TableRow>
                                                                <TableCell colSpan={3} className="text-center text-muted-foreground italic">No lap details available.</TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                            {isCurrentUser && (
                                                <div className="flex justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className='text-destructive hover:text-destructive hover:bg-destructive/10'
                                                        onClick={() => removeRaceResult(result.id)}
                                                    >
                                                        <Trash2 className="mr-2 size-4" /> Delete Result
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
                ) : (
                    <div className="text-center text-muted-foreground py-12">
                        <p>You haven't saved any races yet.</p>
                        <p>Go to the Personal Bests tab or Race Timer to record your first race!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function WorkoutLogsList({ userId }: { userId: string }) {
    const { workoutLogs, isInitialized } = useWorkoutLogs({userId});

    const SourceIcon = ({ source }: { source: string }) => {
        switch (source) {
            case 'apple-watch': return <AppleIcon className="size-5" />;
            case 'form-goggles': return <Watch className="size-5" />;
            case 'garmin': case 'suunto': case 'polar': case 'wahoo': case 'coros': return <Watch className="size-5" />;
            case 'fitbit': return <FitbitIcon className="size-5" />;
            default: return null;
        }
    };

    if (!isInitialized) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Workout History</CardTitle>
                <CardDescription>A log of this swimmer's workouts.</CardDescription>
            </CardHeader>
            <CardContent>
                 {workoutLogs.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Distance</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Avg. Pace</TableHead>
                                <TableHead className="text-center">Source</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {workoutLogs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell>
                                    {new Date(log.date).toLocaleDateString(undefined, {
                                        timeZone: 'UTC',
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </TableCell>
                                <TableCell className="font-medium">{log.title}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="size-4 text-muted-foreground" />
                                        {log.location}
                                    </div>
                                </TableCell>
                                <TableCell>{log.distance}</TableCell>
                                <TableCell>{log.duration}</TableCell>
                                <TableCell className="font-mono">{log.avgPace}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className="flex items-center justify-center gap-2">
                                    <SourceIcon source={log.source} />
                                    <span className="capitalize">{log.source.replace('-', ' ')}</span>
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                 ) : (
                    <div className="text-center text-muted-foreground py-12">
                        <p>This user has no workout logs.</p>
                    </div>
                 )}
            </CardContent>
        </Card>
    );
}

function FriendsList({ profileData }: { profileData: UserProfileData }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [following, setFollowing] = useState<string[]>([]);
    const [followers, setFollowers] = useState<string[]>([]);
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);

    useEffect(() => {
        setRegisteredUsers(getRegisteredUsers());
        const handleStorage = () => setRegisteredUsers(getRegisteredUsers());
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);
    
    const handleFollowToggle = (userId: string) => {
        setLoadingStates(prev => ({ ...prev, [userId]: true }));
        // Simulate API call
        setTimeout(() => {
            setFollowing(prev => 
                prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
            );
            setLoadingStates(prev => ({ ...prev, [userId]: false }));
        }, 500);
    };

    const handleRemoveFollower = (userId: string) => {
         setLoadingStates(prev => ({ ...prev, [userId]: true }));
        // Simulate API call
        setTimeout(() => {
            setFollowers(prev => prev.filter(id => id !== userId));
            setLoadingStates(prev => ({ ...prev, [userId]: false }));
        }, 500);
    }

    const searchResults = useMemo(() => {
        if (!searchTerm) return [];
        return registeredUsers.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            user.id !== profileData.id // Exclude self from search
        );
    }, [searchTerm, profileData.id, registeredUsers]);

    const renderUserList = (userIds: string[], type: 'following' | 'followers' | 'search') => {
        let users = userIds.map(id => registeredUsers.find(u => u.id === id)).filter(Boolean) as RegisteredUser[];
        if(type === 'search') users = searchResults;

        if (users.length === 0) {
            return <p className="text-muted-foreground text-center pt-4">
                {type === 'search' ? 'No users found.' : `No ${type}.`}
            </p>;
        }

        return (
            <ul className="space-y-3 mt-4">
                {users.map(user => {
                    const isFollowing = following.includes(user.id);
                    const isLoading = loadingStates[user.id];
                    
                    return (
                         <li key={user.id} className="flex items-center justify-between gap-2 p-2 bg-muted rounded-lg">
                            <Link href={`/profile/${user.id}`} className="flex items-center gap-2 hover:underline">
                                {getCountryByCode(user.country) && <Image src={getCountryByCode(user.country)!.flag} alt={user.country} width={20} height={15} />}
                                <span className="font-medium">{user.name}</span>
                            </Link>
                            {profileData.isCurrentUser && user.id !== profileData.id && (
                                <div className="flex gap-2">
                                    {type === 'followers' && !isFollowing && (
                                         <Button size="sm" variant="destructive" onClick={() => handleRemoveFollower(user.id)} disabled={isLoading}>
                                            {isLoading ? <Loader2 className="animate-spin" /> : <Trash2 />}
                                        </Button>
                                    )}
                                    <Button 
                                        size="sm" 
                                        variant={isFollowing ? 'secondary' : 'default'} 
                                        onClick={() => handleFollowToggle(user.id)} 
                                        disabled={isLoading}
                                        className="group"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" /> : (
                                            isFollowing ? (
                                                <>
                                                    <UserCheck className="mr-2 group-hover:hidden" /> 
                                                    <UserX className="mr-2 hidden group-hover:inline" />
                                                    <span className="group-hover:hidden">Following</span>
                                                    <span className="hidden group-hover:inline">Unfollow</span>
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="mr-2" />
                                                    {followers.includes(user.id) ? 'Follow Back' : 'Follow'}
                                                </>
                                            )
                                        )}
                                    </Button>
                                </div>
                            )}
                        </li>
                    )
                })}
            </ul>
        );
    }
    
    return (
        <>
            {profileData.isCurrentUser && (
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search for swimmers..." 
                        className="pl-9" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            )}
            
            {searchTerm ? (
                renderUserList([], 'search')
            ) : (
                <Tabs defaultValue="following" className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="following">Following ({following.length})</TabsTrigger>
                        <TabsTrigger value="followers">Followers ({followers.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="following">
                        {renderUserList(following, 'following')}
                    </TabsContent>
                    <TabsContent value="followers">
                        {renderUserList(followers, 'followers')}
                    </TabsContent>
                </Tabs>
            )}
        </>
    )
}

function GoalsList({ isCurrentUser, userId }: { isCurrentUser: boolean, userId: string }) {
    const { goals, addGoal, removeGoal, toggleGoal, isInitialized } = useGoals(userId);
    const { personalBests, isInitialized: pbsInitialized } = usePersonalBests(userId);
    const { raceResults, isInitialized: raceResultsInitialized } = useRaceResults({userId});
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [goalType, setGoalType] = useState<GoalFormData['type']>('custom');

    const form = useForm<GoalFormData>({
        resolver: zodResolver(goalSchema),
        defaultValues: {
            type: 'custom',
            description: '',
            targetDate: new Date().toISOString().split('T')[0],
            event: '50m Freestyle',
            targetTime: '',
            league: 'summer',
            targetRank: 0,
            meetId: '',
        },
    });

    // Automatically check for completed time standard goals
    useEffect(() => {
        if (!isInitialized || !pbsInitialized || !raceResultsInitialized || !isCurrentUser) return;

        goals.forEach(goal => {
            if (!goal.completed && (goal.type === 'goal_time_standard' || goal.type === 'personal_best') && goal.event && goal.targetTime) {
                const targetMs = swimTimeToMs(goal.targetTime);
                
                // Check if any personal best for this event is faster than the goal
                const achieved = personalBests.some(pb => 
                    `${pb.distance}${pb.unit === 'yards' ? 'yd' : 'm'} ${pb.stroke}` === goal.event && 
                    swimTimeToMs(pb.time) <= targetMs
                ) || raceResults.some(r => 
                    r.event === goal.event && 
                    r.totalTime <= targetMs
                );

                if (achieved) {
                    toggleGoal(goal.id);
                }
            }
        });
    }, [goals, personalBests, raceResults, isInitialized, pbsInitialized, raceResultsInitialized, isCurrentUser, toggleGoal]);

    function onSubmit(values: GoalFormData) {
        let description = '';
        switch(values.type) {
            case 'personal_best':
            case 'goal_time_standard':
                description = `Achieve ${values.targetTime} in ${values.event}`;
                break;
            case 'leaderboard_rank':
                const leagueName = leagues.find(l => l.id === values.league)?.name;
                description = `Reach Top ${values.targetRank} in ${leagueName}`;
                break;
            case 'meet_qualification':
                const meetName = MEETS.find(m => m.id === values.meetId)?.name;
                description = `Qualify for Finals in ${meetName}`;
                break;
            default:
                description = values.description || 'Unnamed Goal';
        }

        addGoal({ ...values, description });
        form.reset({
            type: 'custom',
            description: '',
            targetDate: new Date().toISOString().split('T')[0],
            event: '50m Freestyle',
            targetTime: '',
            league: 'summer',
            targetRank: 0,
            meetId: '',
        });
        setIsDialogOpen(false);
    }
    
    if (!isInitialized || !pbsInitialized || !raceResultsInitialized) {
        return (
             <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
             </div>
        )
    }

    const ongoingGoals = goals.filter(g => !g.completed);
    const completedGoals = goals.filter(g => g.completed);
    
    const GoalCard = ({ goal }: { goal: Goal }) => (
        <Card key={goal.id} className={cn("flex flex-col shadow-sm border-2", goal.completed ? "opacity-60 border-green-500/20" : "border-primary/10")}>
            <CardHeader>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <GoalIcon type={goal.type} />
                    <span className="capitalize">{(goal.type || 'custom').replace(/_/g, ' ')}</span>
                </div>
                <CardTitle className={cn("text-lg", goal.completed && "line-through")}>
                    {goal.description}
                </CardTitle>
                <CardDescription>
                    {goal.completed ? (
                         <Badge className="bg-green-500 text-white">Achieved!</Badge>
                    ) : (
                        `Target: ${new Date(goal.targetDate).toLocaleDateString()}`
                    )}
                </CardDescription>
            </CardHeader>
            <div className="flex-grow" />
            <CardFooter className="flex justify-between">
                {isCurrentUser && (
                    <Button variant="outline" size="sm" onClick={() => toggleGoal(goal.id)}>
                        {goal.completed ? <Circle className="mr-2 size-4"/> : <Check className="mr-2 size-4"/>}
                        {goal.completed ? 'Mark as Ongoing' : 'Mark as Done'}
                    </Button>
                )}
                {isCurrentUser && (
                    <Button variant="ghost" size="icon" onClick={() => removeGoal(goal.id)}>
                        <Trash2 className="size-4 text-muted-foreground" />
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
    
    const GoalIcon = ({ type }: { type: Goal['type'] }) => {
        switch (type) {
            case 'personal_best':
            case 'goal_time_standard': return <Trophy className="size-4 text-yellow-500" />;
            case 'leaderboard_rank': return <BarChart3 className="size-4 text-primary" />;
            case 'meet_qualification': return <Calendar className="size-4 text-accent" />;
            default: return <GoalIconLucide className="size-4 text-muted-foreground" />;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white"><GoalIconLucide /> Your Goals</CardTitle>
                {isCurrentUser && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2" /> New Goal
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Set a New Goal</DialogTitle>
                                <DialogDescription>Choose a target to work towards. Time standards are tracked automatically!</DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField control={form.control} name="type" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Goal Type</FormLabel>
                                            <Select onValueChange={(value) => { field.onChange(value); setGoalType(value as GoalFormData['type']) }} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select goal type" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="custom">Custom Goal</SelectItem>
                                                    <SelectItem value="goal_time_standard">Goal Time Standard (Automatic)</SelectItem>
                                                    <SelectItem value="personal_best">Beat a Personal Best (Automatic)</SelectItem>
                                                    <SelectItem value="leaderboard_rank">Reach Leaderboard Rank</SelectItem>
                                                    <SelectItem value="meet_qualification">Qualify in a Meet</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    
                                    {goalType === 'custom' && (
                                        <FormField control={form.control} name="description" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl><Input placeholder="e.g., Swim 1500m under 25 minutes" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    )}

                                    {(goalType === 'personal_best' || goalType === 'goal_time_standard') && (
                                        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                                            <FormField control={form.control} name="event" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Event</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            {METER_EVENTS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="targetTime" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Target Time (e.g. 59.99 or 1:05.50)</FormLabel>
                                                    <FormControl><Input placeholder="Time" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <p className="text-[10px] text-muted-foreground italic mt-2">The app will mark this as done once you swim this event in the specified time or faster.</p>
                                        </div>
                                    )}
                                    
                                    {goalType === 'leaderboard_rank' && (
                                        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                                            <FormField control={form.control} name="league" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>League</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select league" /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            {leagues.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="targetRank" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Target Rank</FormLabel>
                                                    <FormControl><Input type="number" placeholder="e.g., 10" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                    )}
                                    
                                    {goalType === 'meet_qualification' && (
                                        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                                            <FormField control={form.control} name="meetId" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Meet</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select meet" /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            {MEETS.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                    )}

                                    <FormField control={form.control} name="targetDate" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Target Date</FormLabel>
                                            <FormControl><Input type="date" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <DialogFooter>
                                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                        <Button type="submit">Save Goal</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-bold font-headline text-white">Ongoing Goals</h3>
                {ongoingGoals.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {ongoingGoals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground bg-muted/50 rounded-lg">
                        <p className="font-bold">No ongoing goals.</p>
                        <p className="text-sm">Set one to get started!</p>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-bold font-headline text-white">Completed Goals</h3>
                {completedGoals.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {completedGoals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground bg-muted/50 rounded-lg">
                        <p className="font-bold">No completed goals yet.</p>
                        <p className="text-sm">Keep pushing!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function GoalSimulator() {
    const [targetTime, setTargetTime] = useState('1:00.00');
    const [distance, setDistance] = useState(100);
    const [poolLength, setPoolLength] = useState(25);
    const [unit, setUnit] = useState<Unit>('meters');
    const [pacingStrategy, setPacingStrategy] = useState<'even' | 'negative_split'>('even');
    const [selectedEvent, setSelectedEvent] = useState<string>('');

    const swimEvents = unit === 'meters' ? METER_EVENTS : YARD_EVENTS;

    const handleEventChange = (val: string) => {
        setSelectedEvent(val);
        // Extract distance from string like "100m Freestyle" or "200yd Butterfly"
        const match = val.match(/^(\d+)/);
        if (match) {
            setDistance(parseInt(match[1]));
        }
    };

    const splits = useMemo(() => {
        const totalMs = swimTimeToMs(targetTime);
        if (!totalMs || distance <= 0 || poolLength <= 0) return [];

        const lapCount = Math.ceil(distance / poolLength);
        const evenLapTime = totalMs / lapCount;
        
        let calculatedSplits: { lap: number; time: number; cumulative: number }[] = [];
        let currentCumulative = 0;

        for (let i = 1; i <= lapCount; i++) {
            let lapTime = evenLapTime;
            
            if (pacingStrategy === 'negative_split') {
                // First half slightly slower, second half slightly faster
                const midPoint = lapCount / 2;
                const adjustmentFactor = 0.03; // 3% variance
                if (i <= midPoint) {
                    lapTime = evenLapTime * (1 + adjustmentFactor);
                } else {
                    lapTime = evenLapTime * (1 - adjustmentFactor);
                }
            }

            currentCumulative += lapTime;
            calculatedSplits.push({
                lap: i,
                time: lapTime,
                cumulative: currentCumulative,
            });
        }

        return calculatedSplits;
    }, [targetTime, distance, poolLength, pacingStrategy]);

    const unitLabel = unit === 'meters' ? 'm' : 'yd';

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="text-primary" />
                        Goal Simulator
                    </CardTitle>
                    <CardDescription>
                        Plan your race by simulating lap splits to hit your target goal time.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Tabs value={unit} onValueChange={(v) => {
                        setUnit(v as Unit);
                        setSelectedEvent(''); // Reset event selection when unit changes
                    }} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="meters">Meters</TabsTrigger>
                            <TabsTrigger value="yards">Yards</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Standard Event (Quick Fill)</label>
                            <Select value={selectedEvent} onValueChange={handleEventChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an event" />
                                </SelectTrigger>
                                <SelectContent>
                                    {swimEvents.map((event) => (
                                        <SelectItem key={event} value={event}>{event}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm font-medium">Pool Length ({unitLabel})</label>
                            <Select value={poolLength.toString()} onValueChange={(v) => setPoolLength(parseInt(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="25">25 {unitLabel}</SelectItem>
                                    <SelectItem value="50">50 {unitLabel}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Race Distance ({unitLabel})</label>
                            <Input 
                                type="number"
                                value={distance} 
                                onChange={(e) => {
                                    setDistance(parseInt(e.target.value) || 0);
                                    setSelectedEvent(''); // User is entering custom distance
                                }} 
                                placeholder={`Distance in ${unitLabel}`}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Goal Time (e.g. 1:05.20)</label>
                            <Input 
                                value={targetTime} 
                                onChange={(e) => setTargetTime(e.target.value)} 
                                placeholder="MM:SS.ms"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Pacing Strategy</label>
                        <Select value={pacingStrategy} onValueChange={(v: any) => setPacingStrategy(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="even">Even Splits</SelectItem>
                                <SelectItem value="negative_split">Negative Split (Fast Finish)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="rounded-lg border bg-muted/50 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-24">Lap</TableHead>
                                    <TableHead>Suggested Split</TableHead>
                                    <TableHead className="text-right">Total Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {splits.map((s) => (
                                    <TableRow key={s.lap}>
                                        <TableCell className="font-medium">{s.lap} ({poolLength}{unitLabel})</TableCell>
                                        <TableCell className="font-mono text-primary font-bold">
                                            {formatTime(s.time)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground">
                                            {formatTime(s.cumulative)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {splits.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                            Enter a valid distance and target time to see split suggestions.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="bg-primary/5 p-4 text-xs text-muted-foreground italic">
                    <Timer className="size-3 mr-2 inline" />
                    Tip: Negative splitting is often the most efficient way to swim middle and long distance events.
                </CardFooter>
            </Card>
        </div>
    );
}


export function ProfileLayout({ profileData, isLoading, onProfileSave }: ProfileLayoutProps) {
    const [name, setName] = useState(profileData.name);
    const [selectedCountry, setSelectedCountry] = useState(profileData.country);
    const [isDualDialogOpen, setIsDualDialogOpen] = useState(false);
    const [dualEvent, setDualEvent] = useState('');
    const [dualUnit, setDualUnit] = useState<Unit>('meters');
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get('tab') || 'overview';

    useEffect(() => {
        setName(profileData.name);
        setSelectedCountry(profileData.country);
    }, [profileData]);

    const handleSave = () => {
        if (name && selectedCountry && onProfileSave) {
            onProfileSave({ name, country: selectedCountry });
            toast({
                title: 'Profile Updated',
                description: 'Your changes have been saved.',
            });
        }
    };
    
    const handleRequestDual = async () => {
        if (!dualEvent) {
            toast({
                variant: 'destructive',
                title: 'No Event Selected',
                description: 'Please select an event for the dual.',
            });
            return;
        }

        try {
            const unitStr = dualUnit === 'meters' ? 'm' : 'yd';
            const party = await createParty({
                event: `${dualEvent} (${unitStr})`,
                isPublic: false,
            });

            toast({
                title: 'Dual Challenge Created!',
                description: `Created dual challenge for ${dualEvent}. Redirecting to lobby...`,
            });
            setIsDualDialogOpen(false);
            setDualEvent('');
            router.push(`/dual/lobby/${party.id}`);
        } catch (e) {
            console.error(e);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not create dual challenge.',
            });
        }
    }
    
    const swimEvents = dualUnit === 'meters' ? METER_EVENTS : YARD_EVENTS;

    return (
        <div className="container mx-auto max-w-6xl space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {selectedCountry && getCountryByCode(selectedCountry) ? (
                        <Image src={getCountryByCode(selectedCountry)!.flag} alt={selectedCountry} width={64} height={40} className="rounded-md" />
                    ) : (
                        <Skeleton className="h-10 w-16 rounded-md" />
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                           <h1 className="font-headline text-3xl font-bold text-white">{name}</h1>
                           {profileData.isPremium && (
                            <Badge variant="secondary" className="ml-2 bg-yellow-200/20 text-yellow-500 border-yellow-500/50">
                                <Sparkles className="mr-1 text-yellow-500" />
                                Premium
                            </Badge>
                           )}
                        </div>
                        <p className="text-muted-foreground">{getCountryByCode(selectedCountry)?.name}</p>
                    </div>
                </div>
                {!profileData.isCurrentUser && (
                    <Dialog open={isDualDialogOpen} onOpenChange={setIsDualDialogOpen}>
                        <DialogTrigger asChild>
                             <Button>
                                <Swords className="mr-2"/> Request Dual
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Request a Dual with {profileData.name}</DialogTitle>
                                <CardDescription>Select an event for the challenge. They will have 24 hours to accept.</CardDescription>
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
                                 <div className="flex items-center text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                                    <Clock className="size-4 mr-2" />
                                    <span>The challenge will expire in 24 hours if not accepted.</span>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="button" onClick={handleRequestDual} disabled={!dualEvent}>
                                    <Send className="mr-2"/> Send Challenge
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
            
            <Tabs defaultValue={defaultTab}>
                <TabsList className="flex-wrap h-auto gap-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="pbs">Personal Bests</TabsTrigger>
                    <TabsTrigger value="goals">Goals</TabsTrigger>
                    <TabsTrigger value="simulator">Goal Simulator</TabsTrigger>
                    <TabsTrigger value="race_history">Race History</TabsTrigger>
                    <TabsTrigger value="workout_logs">Workout Logs</TabsTrigger>
                    <TabsTrigger value="wearables">Wearables & Devices</TabsTrigger>
                    <TabsTrigger value="friends">Friends</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                       <div className="lg:col-span-2 grid gap-8 content-start">
                            {profileData.isCurrentUser && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><User /> Edit Profile</CardTitle>
                                        <CardDescription>Update your display name and country.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium">Display Name</label>
                                            <Input value={name} onChange={(e) => setName(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Country</label>
                                            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select your country" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {countries.map(c => (
                                                        <SelectItem key={c.code} value={c.code}>
                                                            <div className="flex items-center gap-2">
                                                                <Image src={c.flag} alt={c.name} width={20} height={15} />
                                                                <span>{c.name} ({c.code})</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button onClick={handleSave} className="w-full" disabled={isLoading}>
                                            {isLoading ? <Loader2 className="animate-spin" /> : <Save className="mr-2" />} 
                                            Save Changes
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><AwardIcon /> Digital Awards</CardTitle>
                                    <CardDescription>Collection of top 3 victories in Finals and leaderboard milestones.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AwardsList userId={profileData.id} countryCode={profileData.country} />
                                </CardContent>
                            </Card>
                       </div>
                       <div className="space-y-8">
                            <CurrentRankings userId={profileData.id} countryCode={profileData.country} />
                            <EventRankings userId={profileData.id} />
                       </div>
                    </div>
                </TabsContent>
                
                <TabsContent value="pbs" className="mt-6">
                    <PersonalBestsList 
                        isCurrentUser={profileData.isCurrentUser}
                        userId={profileData.id}
                    />
                </TabsContent>
                
                <TabsContent value="race_history" className="mt-6">
                    <RaceHistoryList
                        isCurrentUser={profileData.isCurrentUser}
                        userId={profileData.id}
                    />
                </TabsContent>

                 <TabsContent value="goals" className="mt-6">
                    <GoalsList 
                        isCurrentUser={profileData.isCurrentUser}
                        userId={profileData.id}
                    />
                </TabsContent>

                <TabsContent value="simulator" className="mt-6">
                    <GoalSimulator />
                </TabsContent>
                 
                <TabsContent value="workout_logs" className="mt-6">
                    <WorkoutLogsList userId={profileData.id} />
                </TabsContent>

                <TabsContent value="wearables" className="mt-6">
                    <WearableDevicesManager />
                </TabsContent>
                
                <TabsContent value="friends" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Friends</CardTitle>
                            {profileData.isCurrentUser && <CardDescription>Find and follow other swimmers.</CardDescription>}
                        </CardHeader>
                        <CardContent>
                           <FriendsList profileData={profileData} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function WearableDevicesManager() {
  const {
    devices,
    getConnectedList,
    testDeviceConnection,
    disconnectDevice,
    isBleSupported,
  } = useConnectedDevices();
  const { toast } = useToast();
  const [selectedDevice, setSelectedDevice] = useState<ConnectedDeviceKey | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const connectedList = getConnectedList();
  const deviceKeys: ConnectedDeviceKey[] = [
    'garmin',
    'apple-watch',
    'form-goggles',
    'fitbit',
    'polar',
    'suunto',
    'coros',
  ];

  const handlePair = (key: ConnectedDeviceKey) => {
    setSelectedDevice(key);
    setIsModalOpen(true);
  };

  const handleTest = (key: ConnectedDeviceKey) => {
    const res = testDeviceConnection(key);
    const meta = DEVICE_METADATA[key];
    toast({
      title: `${meta.name} Telemetry Pinged! ⚡`,
      description: `Live HR: ${res?.liveHeartRate || 142} bpm • Battery: ${res?.batteryLevel || 85}%.`,
    });
  };

  const handleDisconnect = (key: ConnectedDeviceKey) => {
    disconnectDevice(key);
    const meta = DEVICE_METADATA[key];
    toast({
      title: `${meta.name} Disconnected`,
      description: `Device removed from active telemetry stream.`,
    });
  };

  return (
    <Card className="bg-slate-950/80 text-white border-slate-800 shadow-xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl text-white">
              <Watch className="size-6 text-cyan-400" /> Wearables & Swim Devices
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs mt-1">
              Connect your smartwatch, smart goggles, or heart rate sensors via Bluetooth LE or Cloud APIs to automatically capture split times and swim metrics.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs px-3 py-1">
              {connectedList.length} / 7 Paired
            </Badge>
            {isBleSupported && (
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs px-3 py-1 flex items-center gap-1">
                <Bluetooth className="size-3" /> Web BLE Active
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deviceKeys.map((key) => {
            const meta = DEVICE_METADATA[key];
            const info = devices[key];
            const isConnected = info?.connected ?? false;

            return (
              <div
                key={key}
                className={`p-4 rounded-xl border transition-all ${
                  isConnected
                    ? 'bg-slate-900/90 border-cyan-500/40 shadow-lg shadow-cyan-950/20'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                      {meta.iconType === 'apple' ? (
                        <AppleIcon className="size-6 text-slate-100" />
                      ) : meta.iconType === 'fitbit' ? (
                        <FitbitIcon className="size-6 text-sky-400" />
                      ) : meta.iconType === 'goggles' ? (
                        <Watch className="size-6 text-cyan-400" />
                      ) : (
                        <Watch className="size-6 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        {meta.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">{meta.brand} Integration</p>
                    </div>
                  </div>

                  {isConnected ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-slate-800 text-slate-500 text-[10px]">
                      Not Paired
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-3 line-clamp-2">{meta.description}</p>

                {isConnected ? (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Account / ID:</span>
                      <span className="font-mono text-cyan-300 truncate max-w-[160px]">{info.accountId}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Hardware / Protocol:</span>
                      <span className="text-slate-300">
                        {info.connectionType === 'bluetooth-le' ? 'Bluetooth LE' : 'Cloud API OAuth'}
                      </span>
                    </div>
                    {info.batteryLevel && (
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">Battery Level:</span>
                        <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                          <Battery className="size-3 text-emerald-400" /> {info.batteryLevel}%
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTest(key)}
                        className="flex-1 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/60 font-semibold text-xs h-8"
                      >
                        <RefreshCw className="size-3 mr-1.5" /> Ping Test
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDisconnect(key)}
                        className="border-red-500/30 text-red-400 hover:bg-red-950/40 font-semibold text-xs h-8 px-2.5"
                      >
                        <Unlink className="size-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <Button
                      size="sm"
                      onClick={() => handlePair(key)}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-xs h-8"
                    >
                      <Bluetooth className="size-3.5 mr-1.5" /> Pair & Connect Device
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      <ConnectDeviceModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        deviceKey={selectedDevice}
      />
    </Card>
  );
}

