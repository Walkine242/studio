
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getParty } from '@/lib/services/party-service';
import type { Party } from '@/lib/types';
import { Loader2, Copy, Users, Watch, Send, Check, SkipForward } from 'lucide-react';
import Link from 'next/link';
import { getFriends, Friend } from '@/lib/friends';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function InvitePage({ params }: { params: Promise<{ partyId: string }> }) {
  const { partyId } = React.use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [party, setParty] = useState<Party | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invited, setInvited] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!partyId) return;

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

    getFriends().then(setFriends);

    return () => unsubscribe();
  }, [partyId, router, toast]);

  const copyToClipboard = () => {
    const inviteLink = `${window.location.origin}/dual/lobby/${partyId}`;
    if (party?.code) {
      navigator.clipboard.writeText(inviteLink);
      toast({
        title: 'Copied!',
        description: 'Lobby link copied to clipboard. Share it with anyone!',
      });
    }
  };

  // There is no in-app messaging yet, so "Invite" copies the lobby link
  // for you to send to that friend however you usually reach them.
  const handleInviteToggle = async (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    const inviteLink = `${window.location.origin}/dual/lobby/${partyId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Join my Dual race', text: `Race me in ${party?.event}!`, url: inviteLink });
      } else {
        await navigator.clipboard.writeText(inviteLink);
        toast({
          title: 'Invite Link Copied',
          description: `Send it to ${friend?.name} so they can join "${party?.event}".`,
        });
      }
      setInvited(prev => (prev.includes(friendId) ? prev : [...prev, friendId]));
    } catch {
      // Share sheet dismissed: nothing to do.
    }
  }

  if (isLoading || !party) {
    return (
      <div className="container mx-auto flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <h1 className="mt-4 font-headline text-3xl font-bold">Invite Friends</h1>
        <p className="mt-2 text-muted-foreground">
          Invite your friends to join your private dual for: <span className="font-semibold text-primary">{party.event}</span>
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Friends List</CardTitle>
          <CardDescription>
            Swimmers you follow. Tap Invite to share the lobby link with them.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {friends.length > 0 ? (
                 <ul className="space-y-3">
                    {friends.map(friend => {
                        const isInvited = invited.includes(friend.id);
                        return (
                             <li key={friend.id} className="flex items-center justify-between gap-2 p-2 bg-muted rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={friend.avatar} alt={friend.name} />
                                        <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{friend.name}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                             <Image src={friend.country.flag} alt={friend.country.name} width={16} height={12} />
                                             <span>{friend.country.name}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button size="sm" variant={isInvited ? "secondary" : "default"} onClick={() => handleInviteToggle(friend.id)}>
                                    {isInvited ? (
                                        <>
                                            <Check className="mr-2"/> Shared
                                        </>
                                    ) : (
                                         <>
                                            <Send className="mr-2"/> Invite
                                        </>
                                    )}
                                </Button>
                            </li>
                        )
                    })}
                </ul>
            ) : (
                <p className="text-center text-muted-foreground">You aren't following anyone yet. Search for swimmers on your Profile page's Friends tab to follow them.</p>
            )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Share Manually</CardTitle>
            <CardDescription>
                Alternatively, copy and share the direct lobby link with anyone.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
             <Button onClick={copyToClipboard} size="lg" className="w-full">
                <Copy className="mr-2" /> Copy Lobby Link
            </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
         <Button asChild size="lg" className="w-full">
            <Link href={`/dual/lobby/${partyId}`}>
                <SkipForward className="mr-2"/> Go to Lobby
            </Link>
        </Button>
      </div>
    </div>
  );
}
