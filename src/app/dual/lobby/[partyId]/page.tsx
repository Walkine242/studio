'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getParty, joinParty } from '@/lib/services/party-service';
import type { Party } from '@/lib/types';
import { Loader2, Copy, Users, Watch, CheckCircle, BarChart, UserCog } from 'lucide-react';
import { AppleIcon } from '@/components/icons/apple';
import { FitbitIcon } from '@/components/icons/fitbit';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TimingMethod = 'wearable' | 'timer';

export default function LobbyPage({ params }: { params: Promise<{ partyId: string }> }) {
  const { partyId } = React.use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [party, setParty] = useState<Party | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timingMethod, setTimingMethod] = useState<TimingMethod | null>(null);
  const [timerName, setTimerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (!partyId) return;
    
    // Auto-join the party when landing on the lobby
    const attemptJoin = async () => {
        try {
            await joinParty(partyId);
            setHasJoined(true);
        } catch (error) {
            // This might fail if the user is already in the party, which is fine.
             setHasJoined(true); // Assume joined if already in members list server-side
        }
    }
    
    if(!hasJoined) {
        attemptJoin();
    }

    const unsubscribe = getParty(partyId, (updatedParty) => {
      if (updatedParty) {
        setParty(updatedParty);
      } else {
        toast({
          variant: 'destructive',
          title: 'Party Not Found',
          description: 'The party you are trying to join does not exist.',
        });
        router.push('/dual');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [partyId, router, toast, hasJoined]);

  const copyToClipboard = () => {
    const inviteLink = `${window.location.origin}/dual/lobby/${partyId}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Copied!',
      description: 'Lobby link copied to clipboard.',
    });
  };

  const handleConnectDevice = () => {
    setTimingMethod('wearable');
    toast({
      title: 'Device Connected!',
      description: 'Your wearable is ready to track your race.',
    });
  };
  
  const handleSetTimer = () => {
    if (!timerName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Timer Name Required',
        description: 'Please enter the name of your designated timer.',
      });
      return;
    }
    setTimingMethod('timer');
    toast({
      title: 'Timer Set!',
      description: `${timerName} is now your designated timer.`,
    });
  };

  const isReadyToRace = timingMethod !== null;

  if (isLoading || !party) {
    return (
      <div className="container mx-auto flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <h1 className="mt-4 font-headline text-3xl font-bold">Dual Lobby</h1>
        <p className="mt-2 text-muted-foreground">
          Waiting for swimmers to join...
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Event: {party.event}{party.round && ` - ${party.round}`}</CardTitle>
          {!party.isPublic && (
            <CardDescription>
              Share the lobby link with your friends so they can join the dual.
            </CardDescription>
          )}
        </CardHeader>
       {!party.isPublic && (
        <CardContent className="flex items-center gap-4">
            <Input value={`${window.location.origin}/dual/lobby/${party.id}`} readOnly className="font-mono" />
            <Button onClick={copyToClipboard} size="icon" variant="outline">
            <Copy className="size-5" />
            </Button>
        </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select Your Timing Method</CardTitle>
          <CardDescription>
            Choose how your race will be timed. This must be selected before starting the race.
          </CardDescription>
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
                        Device Connected!
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">Sync your Apple Watch or Fitbit for real-time race tracking.</p>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <AppleIcon className="size-8" />
                        <FitbitIcon className="size-8" />
                        <Watch className="size-8" />
                      </div>
                      <Button onClick={handleConnectDevice} className="w-full md:w-auto" disabled={!!timingMethod}>
                        <Watch className="mr-2" /> Connect Device
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
                        Timer <span className="font-bold">{timerName}</span> is set!
                      </p>
                    </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Assign a coach or friend to start and stop the timer for you.</p>
                    <div className="w-full space-y-2">
                      <Input 
                        placeholder="Enter Timer's Name"
                        value={timerName}
                        onChange={(e) => setTimerName(e.target.value)}
                        disabled={!!timingMethod}
                      />
                       <Button onClick={handleSetTimer} className="w-full" disabled={!!timingMethod}>
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

      <Card>
        <CardHeader>
          <CardTitle>Party Members ({party.memberCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {party.members.map((member: string, index: number) => (
              <li
                key={index}
                className="flex items-center gap-2 p-2 bg-muted rounded-md"
              >
                <Users className="size-5 text-primary" />
                <span>Swimmer {index + 1}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-4">
        <Button
          size="lg"
          className="w-full bg-green-500 hover:bg-green-600 text-white"
          disabled={!isReadyToRace}
        >
          Start Race
        </Button>
         <Button asChild size="lg" variant="outline" className="w-full">
            <Link href="/dual/results">
                <BarChart className="mr-2"/> View Mock Results
            </Link>
        </Button>
      </div>
    </div>
  );
}
