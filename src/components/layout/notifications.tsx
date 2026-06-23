'use client';
import { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, UserPlus, Swords, Trophy, Flame, Dumbbell } from 'lucide-react';
import type { Notification } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import Link from 'next/link';

// Mock data for notifications with static timestamps to avoid hydration mismatches
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'dual_request',
    from: { name: 'Alex Johnson' },
    content: '50m Freestyle. You have 24 hours to accept and complete the race.',
    timestamp: '2025-02-20T10:00:00Z',
    read: false,
    partyId: 'mockParty1',
  },
  {
    id: '2',
    type: 'new_follower',
    from: { name: 'Yuki Tanaka' },
    content: 'started following you',
    timestamp: '2025-02-20T09:30:00Z',
    read: false,
  },
  {
    id: '3',
    type: 'result_update',
    from: { name: 'DUAL' },
    content: 'Alex Johnson finished 1st in the Summer Splash 50m Freestyle final!',
    timestamp: '2025-02-20T08:00:00Z',
    read: true,
  },
  {
    id: '4',
    type: 'friend_request',
    from: { name: 'Fatima Al-Fahim' },
    content: 'sent you a friend request',
    timestamp: '2025-02-20T05:00:00Z',
    read: true,
  },
];

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  switch (type) {
    case 'dual_request':
      return <Swords className="size-4 text-primary" />;
    case 'new_follower':
    case 'friend_request':
      return <UserPlus className="size-4 text-accent" />;
    case 'result_update':
      return <Trophy className="size-4 text-yellow-500" />;
    case 'streak_award':
      return <Flame className="size-4 text-orange-500" />;
    case 'workout_share':
      return <Dumbbell className="size-4 text-green-500" />;
    default:
      return <Bell className="size-4 text-muted-foreground" />;
  }
};

export function Notifications({ newNotification }: { newNotification?: Notification | null }) {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (newNotification && !notifications.find(n => n.id === newNotification.id)) {
      setNotifications(prev => [newNotification, ...prev]);
    }
  }, [newNotification, notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Mark all as read when popover closes
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative bg-transparent border-white/50 text-white hover:bg-white/10 hover:text-white">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4 font-bold border-b">Notifications</div>
        <div className="flex flex-col">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3 p-4 border-b hover:bg-muted',
                  !n.read && 'bg-primary/5'
                )}
              >
                <div className="mt-1">
                  <NotificationIcon type={n.type} />
                </div>
                <div className="flex-1 text-sm">
                  <p>
                    <span className="font-bold">{n.from.name}</span> {n.content}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(n.timestamp).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {n.type === 'dual_request' && !n.read && n.partyId && (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" asChild>
                        <Link href={`/dual/connecting/${n.partyId}`}>Accept</Link>
                      </Button>
                      <Button size="sm" variant="outline">Decline</Button>
                    </div>
                  )}
                  {n.type === 'new_follower' && !n.read && (
                    <div className="mt-2">
                      <Button size="sm" asChild>
                        <Link href="/profile">Follow Back</Link>
                      </Button>
                    </div>
                  )}
                  {n.type === 'workout_share' && !n.read && (
                    <div className="mt-2">
                      <Button size="sm" asChild>
                        <Link href="/workout-generator">View Workout</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No new notifications.
            </p>
          )}
        </div>
        <div className="p-2 text-center border-t">
          <Button variant="link" size="sm" asChild>
            <Link href="/notifications">View all</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
