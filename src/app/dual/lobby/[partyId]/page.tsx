'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  getParty,
  joinParty,
  startParty,
  finishParty,
  submitPartyResult,
  getPartyResults,
} from '@/lib/services/party-service';
import type { Party } from '@/lib/types';
import { Loader2, Copy, Users, Watch, CheckCircle, UserCog, Play, Square, RotateCcw, Flag, Crown } from 'lucide-react';
import { AppleIcon } from '@/components/icons/apple';
import { FitbitIcon } from '@/components/icons/fitbit';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth/auth-provider';
import { formatTime, swimTimeToMs } from '@/lib/utils';
import Link from 'next/link';
import { LobbyPoolScene } from '@/components/avatar/lobby-pool-scene';

type TimingMethod = 'wearable' | 'timer';

function Stopwatch({ onStop }: { onStop: (ms: number, laps: number[]) => void }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const startRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed(Date.now() - startRef.current), 31);
    return () => clearInterval(id);
  }, [running]);

  const start = () => {
    startRef.current = Date.now() - elapsed;
    setRunning(true);
  };
  const stop = () => {
    const final = Date.now() - startRef.current;
    setRunning(false);
    setElapsed(final);
    onStop(final, laps);
  };
  const lap = () => {
    const now = Date.now() - startRef.current;
    const previous = laps.reduce((a, b) => a + b, 0);
    setLaps((l) => [...l, now - previous]);
  };
  const reset = () => {
    setRunning(false);
    setElapsed(0);
    setLaps([]);
  };

  return (
    <div className="space-y-4 text-center">
      <p className="font-mono text-5xl font-bold tabular-nums">{formatTime(elapsed)}</p>
      <div className="flex justify-center gap-2">
        {!running ? (
          <Button onClick={start} className="bg-green-600 hover:bg-green-700 text-white"><Play className="mr-2" /> Start</Button>
        ) : (
          <>
            <Button onClick={lap} variant="outline"><Flag className="mr-2" /> Lap</Button>
            <Button onClick={stop} variant="destructive"><Square className="mr-2" /> Stop</Button>
          </>
        )}
        {!running && elapsed > 0 && (
          <Button onClick={reset} variant="ghost"><RotateCcw className="mr-2" /> Reset</Button>
        )}
      </div>
      {laps.length > 0 && (
        <p className="text-sm text-muted-foreground font-mono">
          {laps.map((l, i) => `L${i + 1} ${formatTime(l)}`).join('  ·  ')}
        </p>
      )}
    </div>
  );
}

export default function LobbyPage({ params }: { params: Promise<{ partyId: string }> }) {
  const { partyId } = React.use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [party, setParty] = useState<Party | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timingMethod, setTimingMethod] = useState<TimingMethod | null>(null);
  const [timerName, setTimerName] = useState('');
  const [manualTime, setManualTime] = useState('');
  const [pendingTime, setPendingTime] = useState<{ ms: number; laps: number[] } | null>(null);
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  // Join, then follow the party live.
  useEffect(() => {
    if (!partyId || !user) return;
    let unsubscribe = () => {};
    let cancelled = false;

    (async () => {
      try {
        await joinParty(partyId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not join this race.';
        // Already-started races can still be watched by existing members.
        if (!/already started/i.test(message)) {
          toast({ variant: 'destructive', title: 'Could Not Join', description: message });
          router.push('/dual');
          return;
        }
      }
      if (cancelled) return;
      unsubscribe = getParty(partyId, (updatedParty) => {
        if (!updatedParty) {
          toast({ variant: 'destructive', title: 'Party Not Found', description: 'This race lobby does not exist.' });
          router.push('/dual');
          return;
        }
        setParty(updatedParty);
        setIsLoading(false);
        if (updatedParty.status !== 'waiting') {
          getPartyResults(partyId).then((r) => setSubmittedIds(r.map((x) => x.swimmerId!))).catch(() => {});
        }
        if (updatedParty.status === 'finished') {
          router.push(`/dual/results?party=${partyId}`);
        }
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [partyId, user, router, toast]);

  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/dual/lobby/${partyId}` : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({ title: 'Copied!', description: 'Lobby link copied to clipboard.' });
  };

  const handleSetTimer = () => {
    if (!timerName.trim()) {
      toast({ variant: 'destructive', title: 'Timer Name Required', description: 'Enter the name of the person timing you.' });
      return;
    }
    setTimingMethod('timer');
  };

  const run = async (fn: () => Promise<void>, failTitle: string) => {
    setBusy(true);
    try {
      await fn();
    } catch (error) {
      toast({ variant: 'destructive', title: failTitle, description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const submitTime = (ms: number, laps: number[] = []) =>
    run(async () => {
      if (!ms || ms <= 0) throw new Error('Enter a valid time, for example 1:05.23.');
      await submitPartyResult(partyId, ms, laps, party?.event.includes('yd') ? 'yards' : 'meters');
      setSubmittedIds((ids) => [...ids, user!.id]);
      setPendingTime(null);
      toast({ title: 'Time Submitted', description: `${formatTime(ms)} recorded. Waiting for the other swimmers.` });
    }, 'Could Not Submit Time');

  if (isLoading || !party || !user) {
    return (
      <div className="container mx-auto flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isHost = party.hostId === user.id;
  const hasSubmitted = submittedIds.includes(user.id);
  const members = party.memberProfiles ?? [];

  return (
    <div className="container mx-auto max-w-4xl space-y-8">
      <div className="space-y-2 pt-4">
        <LobbyPoolScene
          swimmers={members}
          currentUserId={user.id}
          hostId={party.hostId}
          waiting={party.status === 'waiting'}
          lanes={party.isPublic ? 8 : 4}
          title={party.status === 'waiting' ? (members.length > 1 && isHost ? 'Swimmers ready' : 'Waiting for swimmers') : 'Race in progress'}
          subtitle={`${party.event}${party.round ? ` · ${party.round}` : ''} · ${members.length} ${members.length === 1 ? 'swimmer' : 'swimmers'} on deck`}
        />
        <p className="text-center text-sm text-muted-foreground">
          {party.status === 'waiting'
            ? isHost ? 'Start the race when everyone is in.' : 'Waiting for the host to start the race...'
            : 'Race in progress. Submit your time when you touch the wall.'}
          {' '}
          <Link href="/profile?tab=avatar" className="underline hover:text-foreground">Customize your swimmer</Link>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event: {party.event}{party.round && ` - ${party.round}`}</CardTitle>
          {!party.isPublic && (
            <CardDescription>Share the lobby link with your friends so they can join the dual.</CardDescription>
          )}
        </CardHeader>
        {!party.isPublic && party.status === 'waiting' && (
          <CardContent className="flex items-center gap-4">
            <Input value={inviteLink} readOnly className="font-mono" />
            <Button onClick={copyToClipboard} size="icon" variant="outline">
              <Copy className="size-5" />
            </Button>
          </CardContent>
        )}
      </Card>

      {party.status === 'waiting' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Your Timing Method</CardTitle>
            <CardDescription>Choose how your race will be timed before it starts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="wearable" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="wearable">Wearable Device</TabsTrigger>
                <TabsTrigger value="timer">Designated Timer</TabsTrigger>
              </TabsList>
              <TabsContent value="wearable" className="pt-4">
                <div className="flex flex-col items-center gap-4">
                  {timingMethod === 'wearable' ? (
                    <div className="flex items-center justify-center p-4 bg-green-100 dark:bg-green-900/50 rounded-lg w-full">
                      <CheckCircle className="size-6 text-green-600 dark:text-green-400" />
                      <p className="ml-2 font-medium text-green-800 dark:text-green-200">
                        Wearable selected. Enter the time from your watch when you finish.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">Time yourself with your Apple Watch, Fitbit or other swim watch.</p>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <AppleIcon className="size-8" />
                        <FitbitIcon className="size-8" />
                        <Watch className="size-8" />
                      </div>
                      <Button onClick={() => setTimingMethod('wearable')} className="w-full md:w-auto">
                        <Watch className="mr-2" /> Use My Watch
                      </Button>
                    </>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="timer" className="pt-4">
                <div className="flex flex-col items-center gap-4">
                  {timingMethod === 'timer' ? (
                    <div className="flex items-center justify-center p-4 bg-green-100 dark:bg-green-900/50 rounded-lg w-full">
                      <CheckCircle className="size-6 text-green-600 dark:text-green-400" />
                      <p className="ml-2 font-medium text-green-800 dark:text-green-200">
                        <span className="font-bold">{timerName}</span> will run the stopwatch on this phone.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">Hand this phone to a coach or friend to run the stopwatch for you.</p>
                      <div className="w-full space-y-2">
                        <Input placeholder="Enter Timer's Name" value={timerName} onChange={(e) => setTimerName(e.target.value)} />
                        <Button onClick={handleSetTimer} className="w-full">
                          <UserCog className="mr-2" /> Set Timer
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {party.status === 'in-progress' && (
        <Card>
          <CardHeader>
            <CardTitle>Your Time</CardTitle>
            <CardDescription>
              {hasSubmitted ? 'Your time is in. Results appear as soon as everyone finishes.' : 'Record your swim and submit it.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {hasSubmitted ? (
              <div className="flex items-center justify-center p-4 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <CheckCircle className="size-6 text-green-600 dark:text-green-400" />
                <p className="ml-2 font-medium text-green-800 dark:text-green-200">Time submitted.</p>
              </div>
            ) : (
              <>
                {timingMethod === 'timer' && (
                  <Stopwatch onStop={(ms, laps) => setPendingTime({ ms, laps })} />
                )}
                {pendingTime && (
                  <Button disabled={busy} className="w-full" size="lg" onClick={() => submitTime(pendingTime.ms, pendingTime.laps)}>
                    Submit {formatTime(pendingTime.ms)}
                  </Button>
                )}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {timingMethod === 'timer' ? 'Or type the time in:' : 'Enter the time from your watch (e.g. 32.45 or 1:05.23):'}
                  </p>
                  <div className="flex gap-2">
                    <Input placeholder="1:05.23" value={manualTime} onChange={(e) => setManualTime(e.target.value)} className="font-mono" />
                    <Button disabled={busy || !manualTime.trim()} onClick={() => submitTime(swimTimeToMs(manualTime.trim()))}>
                      Submit
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {party.status === 'in-progress' && (
      <Card>
        <CardHeader>
          <CardTitle>Swimmers ({party.memberCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {members.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-2 p-2 bg-muted rounded-md">
                <span className="flex items-center gap-2">
                  {member.id === party.hostId ? <Crown className="size-5 text-yellow-500" /> : <Users className="size-5 text-primary" />}
                  {member.name}{member.id === user.id && ' (You)'}
                </span>
                {party.status === 'in-progress' && (
                  submittedIds.includes(member.id)
                    ? <Badge className="bg-green-600 text-white">Finished</Badge>
                    : <Badge variant="secondary">Swimming</Badge>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      )}

      {isHost && party.status === 'waiting' && (
        <Button
          size="lg"
          className="w-full bg-green-500 hover:bg-green-600 text-white"
          disabled={!timingMethod || busy}
          onClick={() => run(() => startParty(partyId), 'Could Not Start Race')}
        >
          {timingMethod ? 'Start Race' : 'Pick a timing method to start'}
        </Button>
      )}
      {!isHost && party.status === 'waiting' && !timingMethod && (
        <p className="text-center text-sm text-muted-foreground">Pick a timing method while you wait.</p>
      )}
      {isHost && party.status === 'in-progress' && (
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          disabled={busy}
          onClick={() => run(() => finishParty(partyId), 'Could Not End Race')}
        >
          End Race Now (swimmers without a time are left off the results)
        </Button>
      )}
    </div>
  );
}
