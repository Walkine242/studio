'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Swords,
  Flame,
  Plus,
  LogIn,
  Settings,
  Anchor,
  Calendar,
  Lock,
  Snowflake,
  Sun,
  Leaf,
  Flower2,
  ShieldCheck,
  Loader2,
  Wand2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { MEETS } from '@/config/meets';
import { format } from 'date-fns';
import { usePremiumMember } from '@/lib/hooks/use-premium-member';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { leagues, getLeagueDateRange } from '@/config/leagues';
import type { Meet } from '@/lib/types';
import { subscribeToMeets, createMeet } from '@/lib/services/meet-service';
import { getSupabase } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';

import { CheckoutModal } from '@/components/checkout-modal';

const leagueIcons = {
  winter: <Snowflake className="text-blue-300" />,
  spring: <Flower2 className="text-pink-400" />,
  summer: <Sun className="text-yellow-500" />,
  fall: <Leaf className="text-orange-400" />,
};


export default function DualPage() {
  const [joinCode, setJoinCode] = useState<string>('');
  const [dynamicMeets, setDynamicMeets] = useState<Meet[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { isPremium, isAdmin, refreshPremium } = usePremiumMember();

  const customRaceImage = PlaceHolderImages.find(img => img.id === 'dual-custom-race');

  useEffect(() => {
      const unsubscribe = subscribeToMeets((meets) => {
          setDynamicMeets(meets);
      });

      // Back from Stripe Checkout: the webhook activates the membership on our
      // server, so just re-check status (it can take a few seconds to arrive).
      if (typeof window !== 'undefined' && window.location.search.includes('payment=success')) {
        toast({
          title: 'Payment Received! 🎉',
          description: 'Activating your membership. This usually takes a few seconds.',
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        [2000, 5000, 10000].forEach((ms) => setTimeout(() => refreshPremium(), ms));
      }

      return () => unsubscribe();
  }, [refreshPremium, toast]);

  const allMeets = useMemo(() => {
      // Merge static config with dynamic ones from DB
      return [...MEETS, ...dynamicMeets].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [dynamicMeets]);

  const meetsByLeague = useMemo(() => {
    const grouped: Record<string, { league: (typeof leagues)[0], meets: Meet[] }> = {};

    leagues.forEach(league => {
      grouped[league.id] = { league, meets: [] };
    });

    allMeets.forEach(meet => {
      const meetDate = new Date(meet.date);
      const year = meetDate.getUTCFullYear();
      for (const league of leagues) {
        const { startDate, endDate } = getLeagueDateRange(year, league.id);
        if (meetDate >= startDate && meetDate <= endDate) {
          grouped[league.id].meets.push(meet);
          break;
        }
      }
    });

    return Object.values(grouped).filter(g => g.meets.length > 0);
  }, [allMeets]);

  const handleJoinParty = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code) {
      const { data } = await getSupabase().from('parties').select('id, status').eq('code', code).maybeSingle();
      if (!data) {
        toast({ variant: 'destructive', title: 'Party Not Found', description: `No race lobby has the code ${code}.` });
        return;
      }
      router.push(`/dual/lobby/${data.id}`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: 'Please enter a valid party code.',
      });
    }
  };

  const handleGenerateTestMeet = async () => {
      setIsGenerating(true);
      try {
          const randomSuffix = Math.random().toString(36).substring(7);
          const date = new Date();
          date.setFullYear(2027);
          date.setMonth(Math.floor(Math.random() * 12));
          date.setDate(Math.floor(Math.random() * 28) + 1);

          const newMeet: Omit<Meet, 'id'> = {
              name: `Test Meet ${randomSuffix}`,
              date: date.toISOString(),
              isChampionship: Math.random() > 0.8,
              events: [
                  { 
                      name: '50m Freestyle', 
                      rounds: [
                          { name: 'Prelims', startTime: '09:00' },
                          { name: 'Finals', startTime: '18:00' }
                      ] 
                  },
                  { 
                    name: '100m Breaststroke', 
                    rounds: [
                        { name: 'Prelims', startTime: '10:00' },
                        { name: 'Finals', startTime: '19:00' }
                    ] 
                }
              ]
          };

          await createMeet(newMeet);
          toast({
              title: 'Test Meet Created',
              description: `Generated ${newMeet.name} for ${format(date, 'MMM yyyy')}.`,
          });
      } catch (error) {
          toast({
              variant: 'destructive',
              title: 'Generation Failed',
              description: 'Could not create test meet.',
          });
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-center text-center">
        <div>
          <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
            <Image
              src="/Dual.png?v=2"
              alt="DUAL Logo"
              width={144}
              height={144}
              className="relative object-contain"
            />
          </div>
          <h1 className="mt-4 font-headline text-3xl font-bold text-white">Dual Mode</h1>
          <p className="mt-2 text-white/80">
            Challenge other swimmers and race head-to-head!
          </p>
        </div>
      </div>

      {isAdmin && (
          <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                      <CardTitle className="flex items-center gap-2 text-primary">
                          <ShieldCheck />
                          Admin Meet Panel
                      </CardTitle>
                      <CardDescription>Generate random meets for testing purposes. Visible only to you.</CardDescription>
                  </div>
                  <Button onClick={handleGenerateTestMeet} disabled={isGenerating} size="sm">
                      {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 className="mr-2" />}
                      Generate Test Meet
                  </Button>
              </CardHeader>
          </Card>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content: Public Meets */}
        <div className="flex-1 lg:w-2/3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Public Swim Meets</CardTitle>
              <CardDescription>
                Join a scheduled public meet and compete in various events.
                {!isPremium && <span className="font-bold text-accent"> (Premium Feature)</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full" defaultValue={`league-${leagues[0].id}`}>
                {meetsByLeague.map(({ league, meets }) => (
                  <AccordionItem value={`league-${league.id}`} key={league.id}>
                    <AccordionTrigger className="text-xl font-bold">
                      <div className="flex items-center gap-3">
                        {(leagueIcons as any)[league.id] || <Calendar />}
                        {league.name}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      {meets.map((meet) => (
                        <Card key={meet.id} className={cn("transition-shadow", !isPremium && "opacity-70", isPremium && "hover:shadow-md")}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>{meet.name}</span>
                                    {meet.id.startsWith('Test') && <Badge variant="outline" className="text-[10px]">DYNAMIC</Badge>}
                                </CardTitle>
                                <CardDescription>{format(new Date(meet.date), "EEEE, MMMM do, yyyy")}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isPremium ? (
                                  <Button asChild className="w-full">
                                    <Link href={`/dual/meet/${meet.id}`}>
                                        <Calendar className="mr-2" /> View Schedule & Join
                                    </Link>
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => setIsCheckoutOpen(true)}
                                    className="w-full min-h-[40px] h-auto py-2 px-2 text-xs sm:text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-center flex items-center justify-center"
                                  >
                                    <Lock className="mr-1.5 size-3.5 shrink-0" /> <span>Choose a Plan to Join</span>
                                  </Button>
                                )}
                            </CardContent>
                        </Card>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Race Options */}
        <div className="lg:w-1/3 flex flex-col gap-8">
          <Card className="group flex flex-col overflow-hidden transition-all hover:shadow-lg">
             {customRaceImage && (
              <CardContent className="p-0">
                  <div className="relative h-32 w-full">
                      <Image
                        src={customRaceImage.imageUrl}
                        alt={customRaceImage.description}
                        data-ai-hint={customRaceImage.imageHint}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                  </div>
                </CardContent>
             )}
            <CardHeader>
              <CardTitle>Custom Dual</CardTitle>
              <CardDescription>
                Start a private party with custom race types and equipment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/dual/custom">
                  <Settings className="mr-2" /> Create Custom Race
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Swim Tether Dual</CardTitle>
              <CardDescription>
                An endurance challenge to see who is the last one standing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/dual/tether">
                  <Anchor className="mr-2" /> Create Tether Race
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Join a Private Dual</CardTitle>
              <CardDescription>
                Enter a party code to join a private dual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter Party Code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="font-mono text-center"
              />
              <Button
                onClick={handleJoinParty}
                className="w-full"
                variant="secondary"
              >
                <LogIn className="mr-2" /> Join Party
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <CheckoutModal open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen} />
    </div>
  );
}
