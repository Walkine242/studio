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
import { getCurrentUserId, useAuth } from '@/lib/auth/auth-provider';

export function getStoredNotifications(): Notification[] {
  if (typeof window === 'undefined') return [];
  try {
    const userId = getCurrentUserId();
    if (!userId) return [];
    const raw = localStorage.getItem(`dual_user_notifications_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  
  return [];
}

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const { user } = useAuth();
  const userId = user?.id ?? null;

  useEffect(() => {
    setNotifications(getStoredNotifications());
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    if (newNotification && !notifications.find(n => n.id === newNotification.id)) {
      const updated = [newNotification, ...notifications];
      setNotifications(updated);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem(`dual_user_notifications_${userId}`, JSON.stringify(updated)); } catch {}
      }
    }
  }, [newNotification, notifications, userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!userId) {
      setNotifications([]);
      return;
    }

    if (!open && notifications.some(n => !n.read)) {
      const readAll = notifications.map(n => ({ ...n, read: true }));
      setNotifications(readAll);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem(`dual_user_notifications_${userId}`, JSON.stringify(readAll)); } catch {}
      }
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
              className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0 text-[10px]"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-slate-950 text-white border-white/10 shadow-2xl">
        <div className="p-4 font-bold border-b border-white/10 flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="outline" className="text-[10px] text-orange-400 border-orange-500/40">
              {unreadCount} New
            </Badge>
          )}
        </div>
        <div className="flex flex-col max-h-80 overflow-y-auto divide-y divide-white/5">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3 p-4 hover:bg-white/5 transition-colors',
                  !n.read && 'bg-orange-500/10'
                )}
              >
                <div className="mt-1 shrink-0">
                  <NotificationIcon type={n.type} />
                </div>
                <div className="flex-1 text-sm">
                  <p className="text-slate-200">
                    <span className="font-bold text-white">{n.from.name}</span> {n.content}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(n.timestamp).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="p-6 text-center text-sm text-slate-400">
              No new notifications.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
