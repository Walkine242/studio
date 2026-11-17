
'use client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(false);


  useEffect(() => {
    if (countdown === null || !isStarting) return;

    if (countdown === 0) {
      const goTimer = setTimeout(() => {
        router.push('/dashboard');
      }, 500);
      return () => clearTimeout(goTimer);
    }

    // The numerical countdown logic is bypassed by setting countdown to 0 in handleStart
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, isStarting, router]);

  const handleStart = () => {
    if (isStarting) return;
    setIsStarting(true);
    setCountdown(0); // Skip numerical countdown and show "GO!" immediately
  };

  const getButtonText = () => {
    if (countdown === null) return 'TAKE YOUR MARK';
    return 'GO!';
  };

  return (
    <div className="flex flex-col items-center justify-center text-center min-h-screen relative overflow-hidden bg-black">
      <div className="relative z-10 flex flex-col items-center justify-center text-white w-full">
        <div className="flex h-[500px] w-[500px] items-center justify-center">
            <img
            src="/Dual.png?v=2"
            alt="DUAL Logo"
            width={500}
            height={500}
            className="relative object-contain max-w-[85vw] max-h-[50vh]"
            />
        </div>

        <div className="mt-8 flex justify-center w-full">
          <Button
            onClick={handleStart}
            size="lg"
            variant="outline"
            disabled={isStarting}
            className={cn(
              'bg-transparent hover:bg-white/10 border-2 border-white text-base font-bold tracking-widest px-6 py-4',
              isStarting && 'bg-white/10'
            )}
          >
            {getButtonText()}
          </Button>
        </div>
      </div>
    </div>
  );
}
