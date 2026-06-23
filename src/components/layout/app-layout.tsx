'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PanelLeft } from 'lucide-react';
import Image from 'next/image';
import { NavLinks } from './nav-links';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Notifications } from './notifications';
import { useLoginStreak } from '@/lib/hooks/use-login-streak';
import type { Notification } from '@/lib/types';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { streak, isNewStreak } = useLoginStreak();
  const [streakNotification, setStreakNotification] = useState<Notification | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isNewStreak && streak > 0) {
      setStreakNotification({
        id: `streak-${Date.now()}`,
        type: 'streak_award',
        from: { name: 'DUAL' },
        content: `You're on a ${streak}-day streak! Keep it up!`,
        timestamp: new Date().toISOString(),
        read: false,
      });
    }
  }, [isNewStreak, streak]);

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
            poster="https://image2url.com/images/1763760702180-bdd1ac21-d294-4f48-9fbe-5524b262eee3.jpg"
            src="https://storage.googleapis.com/studio-hosting-assets/aqua-speed-bg.mp4"
          />
        )}
        <div className="absolute inset-0 bg-black/60" />
      </div>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/10 bg-black text-white px-4 backdrop-blur-md sm:px-6 shadow-xl">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="https://image2url.com/r2/bucket2/images/1766812844657-01919505-635c-4653-b6ae-cde82128ad7b.png"
            alt="DUAL Logo"
            width={32}
            height={32}
            className="size-8"
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
        <div className="flex items-center gap-2">
          <Notifications newNotification={streakNotification} />
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
                    src="https://image2url.com/r2/bucket2/images/1766812844657-01919505-635c-4653-b6ae-cde82128ad7b.png"
                    alt="DUAL Logo"
                    width={32}
                    height={32}
                    className="size-8"
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
    </div>
  );
}
