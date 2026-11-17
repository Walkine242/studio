'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PanelLeft, User, LogOut, ShieldCheck, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { NavLinks } from './nav-links';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Notifications } from './notifications';
import { WearableStatusPill } from './wearable-status-pill';
import { useLoginStreak } from '@/lib/hooks/use-login-streak';
import type { Notification } from '@/lib/types';
import { usePathname } from 'next/navigation';
import { AuthModal } from '../auth/auth-modal';
import { useAuth } from '@/lib/auth/auth-provider';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const pathname = usePathname();
  const { streak, isNewStreak } = useLoginStreak();
  const { user, profile, isPremium, membership, isLoading, signOut } = useAuth();
  const onTrial = membership?.onTrial ?? false;
  const [streakNotification, setStreakNotification] = useState<Notification | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // App pages need an account: prompt to sign up / log in when there isn't one.
  useEffect(() => {
    if (!isLoading && !user && !pathname.startsWith('/auth')) {
      setIsAuthOpen(true);
    }
    if (user) setIsAuthOpen(false);
  }, [isLoading, user, pathname]);

  useEffect(() => {
    if (user && isNewStreak && streak > 0) {
      setStreakNotification({
        id: `streak-${Date.now()}`,
        type: 'streak_award',
        from: { name: 'DUAL' },
        content: `You're on a ${streak}-day streak! Keep it up!`,
        timestamp: new Date().toISOString(),
        read: false,
      });
    }
    if (!user) setStreakNotification(null);
  }, [user, isNewStreak, streak]);

  return (
    <div className="flex min-h-screen w-full flex-col relative">
      <div className="absolute inset-0 z-[-1]">
        {mounted && (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            poster="/Dual.png?v=2"
            src="https://storage.googleapis.com/studio-hosting-assets/aqua-speed-bg.mp4"
          />
        )}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/10 bg-black text-white px-4 backdrop-blur-md sm:px-6 shadow-xl">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/Dual.png?v=2"
            alt="DUAL Logo"
            width={32}
            height={32}
            className="size-8 object-contain"
          />
          <h1 className="text-xl font-bold font-headline text-white">
            DUAL
          </h1>
        </Link>

        <div className="hidden md:flex flex-1 items-center justify-center">
          <nav className="flex items-center gap-1 text-sm font-medium">
            <NavLinks />
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <WearableStatusPill />
          <Notifications newNotification={streakNotification} />

          {/* Account Profile Status / Login Button */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-semibold gap-2">
                  <User className="size-4 text-orange-400" />
                  <span className="max-w-[120px] truncate">{profile?.name ?? 'Swimmer'}</span>
                  {isPremium && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-bold px-1.5 py-0">{onTrial ? 'TRIAL' : 'PRO'}</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-950 text-white border-white/10 w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none text-white">{profile?.name ?? 'Swimmer'}</p>
                    <p className="text-xs leading-none text-slate-400">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/10">
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="size-4 text-blue-400" /> Swimmer Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/10">
                  <Link href="/premium" className="flex items-center gap-2">
                    <Sparkles className="size-4 text-orange-400" /> Membership ({onTrial ? 'Free Trial' : isPremium ? 'Active Pro' : 'Choose a Plan'})
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    setIsAuthOpen(true);
                  }}
                  className="cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2"
                >
                  <LogOut className="size-4" /> Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => setIsAuthOpen(true)}
              size="sm"
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold hover:from-orange-600 hover:to-amber-600 shadow-md text-xs sm:text-sm"
            >
              Sign Up / Log In
            </Button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-black/95 text-white border-r-white/10">
              <nav className="grid gap-6 text-lg font-medium" onClick={() => setOpen(false)}>
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Image
                    src="/Dual.png?v=2"
                    alt="DUAL Logo"
                    width={32}
                    height={32}
                    className="size-8 object-contain"
                  />
                  <span className="text-white">DUAL</span>
                </Link>
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      <AuthModal open={isAuthOpen} onOpenChange={setIsAuthOpen} />
    </div>
  );
}
