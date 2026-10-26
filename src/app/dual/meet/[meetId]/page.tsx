
'use client';

import { useRouter } from 'next/navigation';
import { MEETS } from '@/config/meets';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Clock, ChevronRight, Lock, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { findOrCreatePartyForEvent, getQualifiedSwimmersForNextRound } from '@/lib/services/party-service';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { getDynamicMeets } from '@/lib/services/meet-service';
import type { Meet } from '@/lib/types';
import { usePremiumMember } from '@/lib/hooks/use-premium-member';
import { CheckoutModal } from '@/components/checkout-modal';
import { getSupabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-provider';

// Championship meets are open to swimmers who have raced in at least one Finals.
const checkChampionshipQualification = async (userId: string): Promise<boolean> => {
    const { count } = await getSupabase()
        .from('race_results')
        .select('id', { count: 'exact', head: true })
        .eq('swimmer_id', userId)
        .eq('round', 'Finals');
    return (count ?? 0) > 0;
};

const EventCountdown = ({ meetDate, startTime }: { meetDate: string, startTime: string }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    const eventCloseDateTime = useMemo(() => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const eventStartDateTime = new Date(meetDate);
        eventStartDateTime.setUTCHours(hours, minutes, 0, 0);
        return new Date(eventStartDateTime.getTime() + 24 * 60 * 60 * 1000);
    }, [meetDate, startTime]);
    
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const difference = eventCloseDateTime.getTime() - now.getTime();

            if (difference > 0) {
                const hoursLeft = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutesLeft = Math.floor((difference / 1000 / 60) % 60);
                const secondsLeft = Math.floor((difference / 1000) % 60);
                setTimeLeft(`${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`);
                setIsExpired(false);
            } else {
                setTimeLeft('Closed');
                setIsExpired(true);
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [eventCloseDateTime]);

    return { timeLeft, isExpired };
};

export default function MeetPage({ params }: { params: Promise<{ meetId: string }> }) {
  const { meetId } = React.use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { isPremium } = usePremiumMember();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [qualifications, setQualifications] = useState<Record<string, boolean>>({});
  const [isChampionshipQualified, setIsChampionshipQualified] = useState<boolean | null>(null);
  const [meet, setMeet] = useState<Meet | null>(null);
  const [isMeetLoading, setIsMeetLoading] = useState(true);


  useEffect(() => {
      async function fetchMeet() {
          setIsMeetLoading(true);
          // Check static list
          const staticMeet = MEETS.find(m => m.id === meetId);
          if (staticMeet) {
              setMeet(staticMeet);
              setIsMeetLoading(false);
              return;
          }

          // Check dynamic list
          const dynamicMeets = await getDynamicMeets();
          const dynamicMeet = dynamicMeets.find(m => m.id === meetId);
          setMeet(dynamicMeet || null);
          setIsMeetLoading(false);
      }
      fetchMeet();
  }, [meetId]);

  useEffect(() => {
    async function checkChampQual() {
        if (meet?.isChampionship && userId) {
            const qualified = await checkChampionshipQualification(userId);
            setIsChampionshipQualified(qualified);
        } else if (meet) {
            setIsChampionshipQualified(true); // Not a championship, so everyone is "qualified"
        }
    }
    checkChampQual();
  }, [userId, meet]);

  const checkQualifications = useCallback(async () => {
    if (!userId || !meetId || typeof meetId !== 'string' || !meet) return;

    const newQualifications: Record<string, boolean> = {};

    for (const event of meet.events) {
        // Check for Quarters
        const quartersQual = await getQualifiedSwimmersForNextRound(meetId, event.name, 'Prelims');
        newQualifications[`${event.name}-Quarterfinals`] = quartersQual.includes(userId);

        // Check for Semis
        const semisQual = await getQualifiedSwimmersForNextRound(meetId, event.name, 'Quarterfinals');
        newQualifications[`${event.name}-Semifinals`] = semisQual.includes(userId);
        
        // Check for Finals
        const finalsQual = await getQualifiedSwimmersForNextRound(meetId, event.name, 'Semifinals');
        newQualifications[`${event.name}-Finals`] = finalsQual.includes(userId);
    }
    setQualifications(newQualifications);
  }, [userId, meetId, meet]);


  useEffect(() => {
    checkQualifications();
  }, [checkQualifications]);

  if (isMeetLoading) {
      return <div className="container mx-auto flex justify-center py-20"><Loader2 className="animate-spin size-12" /></div>;
  }

  if (!meet) {
    return (
      <div className="container mx-auto text-center">
        <h1 className="text-2xl font-bold">Meet not found</h1>
        <p className="text-muted-foreground">
          The swim meet you are looking for does not exist.
        </p>
      </div>
    );
  }

  const handleJoin = async (eventName: string, roundName: string) => {
    if (!isPremium) {
      setIsCheckoutOpen(true);
      toast({
        title: 'Membership Required',
        description: 'Your free trial has ended. Choose a plan to keep racing in public meets.'
      });
      return;
    }

    const loadingKey = `${eventName}-${roundName}`;
    setIsLoading(loadingKey);
    try {
        const party = await findOrCreatePartyForEvent(meet.id, eventName, roundName);
        toast({
            title: 'Joining Party...',
            description: `Redirecting you to the lobby for ${eventName} - ${roundName}.`
        });
        router.push(`/dual/lobby/${party.id}`);
    } catch(error) {
        console.error("Failed to join or create party", error);
        const errorMessage = error instanceof Error ? error.message : 'Could not join the party for this event. Please try again.';
        toast({
            variant: 'destructive',
            title: 'Failed to Join',
            description: errorMessage
        });
    } finally {
        setIsLoading(null);
    }
  };

  const RoundButton = ({ eventName, round, meetDate, isPrelimOpen }: { eventName: string, round: { name: string, startTime: string }, meetDate: string, isPrelimOpen: boolean }) => {
    const { timeLeft, isExpired } = EventCountdown({ meetDate, startTime: round.startTime });

    const isPrelim = round.name === 'Prelims';
    const isJoining = isLoading === `${eventName}-${round.name}`;

    let isLocked = false;
    let lockReason = '';
    
    if (isChampionshipQualified === false) {
        isLocked = true;
        lockReason = 'Not Qualified';
    } else if (isPrelim) {
        isLocked = isExpired;
        if(isLocked) lockReason = 'Closed';
    } else { // Quarterfinals, Semifinals or Finals
        if (isPrelimOpen) {
            isLocked = true;
            lockReason = 'Prelims Open';
        } else if (qualifications[`${eventName}-${round.name}`] === false) {
             isLocked = true;
             lockReason = 'Not Qualified';
        }
    }
    
    const buttonDisabled = !!isLoading || isLocked;

    const getButtonContent = () => {
        if (isJoining) return <Loader2 className="animate-spin" />;
        if (isChampionshipQualified === null) return <Loader2 className="animate-spin" />;
        if (isLocked) {
             return (
                <>
                  <Lock className="mr-2"/> 
                  {lockReason}
                </>
             )
        }
        return <>Join <ChevronRight className="ml-2" /></>
    };

    return (
        <li className="flex items-center justify-between p-4">
            <div>
                <p className="font-semibold text-lg">{round.name}</p>
                <div className="flex items-center text-muted-foreground text-sm gap-2 mt-1">
                    <Clock className="size-4" />
                    {isPrelim && timeLeft ? (
                        <span>
                           {timeLeft !== 'Closed' ? 'Closes in: ' : ''}{timeLeft}
                        </span>
                    ) : (
                        <span>Starts at {round.startTime}</span>
                    )}
                </div>
            </div>
            <Button onClick={() => handleJoin(eventName, round.name)} disabled={buttonDisabled}>
                {getButtonContent()}
            </Button>
        </li>
    );
};


  return (
    <div className="container mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold flex items-center gap-3">
          {meet.isChampionship && <Trophy className="text-yellow-500" />}
          {meet.name}
        </h1>
        <p className="text-muted-foreground text-lg">
          {format(new Date(meet.date), 'EEEE, MMMM do, yyyy')}
        </p>
         {meet.isChampionship && (
            <CardDescription className="mt-2 text-base border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-500/10">
                This is a championship meet! It is open to swimmers who have already raced in a Finals.
            </CardDescription>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meet Schedule</CardTitle>
          <CardDescription>
            Join a prelim event within 24 hours of its start time. Top 32 advance to Quarterfinals, Top 16 advance to Semifinals, and top 8 from Semis advance to Finals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {meet.events.map((event, index) => {
              const prelimRound = event.rounds.find(r => r.name === 'Prelims');
              const prelimStatus = prelimRound ? EventCountdown({ meetDate: meet.date, startTime: prelimRound.startTime }) : { isExpired: true };
              const isPrelimOpen = prelimRound ? !prelimStatus.isExpired : false;

              return (
                <AccordionItem value={`event-${index}`} key={index}>
                  <AccordionTrigger className="font-bold text-xl p-4 bg-muted rounded-t-lg">
                    {event.name}
                  </AccordionTrigger>
                  <AccordionContent className="p-0 border border-t-0 rounded-b-lg">
                    <ul className="divide-y">
                      {event.rounds.map((round) => (
                         <RoundButton key={round.name} eventName={event.name} round={round} meetDate={meet.date} isPrelimOpen={isPrelimOpen} />
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </CardContent>
      </Card>
      <CheckoutModal open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen} />
    </div>
  );
}
