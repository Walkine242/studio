
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getParty, Party } from '@/lib/services/party-service';
import { Loader2, Copy, Users, Watch, Send, Check, SkipForward } from 'lucide-react';
import Link from 'next/link';
import { getFriends, Friend } from '@/lib/friends';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function InvitePage({ params }: { params: { partyId: string } }) {
  const partyId = params.partyId;
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

    const userFriends = getFriends();
    setFriends(userFriends);

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

  const handleInviteToggle = (friendId: string) => {
    const isAlreadyInvited = invited.includes(friendId);
    
    // Simulate sending/retracting invitation
    if (isAlreadyInvited) {
        setInvited(prev => prev.filter(id => id !== friendId));
    } else {
        setInvited(prev => [...prev, friendId]);
        const friend = friends.find(f => f.id === friendId);
        toast({
            title: 'Invitation Sent',
            description: `An invite to join "${party?.event}" has been sent to ${friend?.name}.`
        })
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
            Click to send an invitation. They'll receive a notification to join.
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
                                            <Check className="mr-2"/> Invited
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
                <p className="text-center text-muted-foreground">You don't have any friends yet. Go to a swimmer's profile to follow them!</p>
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
