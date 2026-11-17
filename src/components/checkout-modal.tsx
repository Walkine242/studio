'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Lock, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/** Sends the swimmer to Stripe's hosted checkout. Card details never touch Dual's servers. */
export async function startCheckout(plan: 'monthly' | 'annual' | 'lifetime'): Promise<string | null> {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) return data.error || 'Could not start checkout. Please try again.';
  window.location.href = data.url;
  return null;
}

export function CheckoutModal({ open, onOpenChange }: CheckoutModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    const error = await startCheckout('annual');
    if (error) {
      setLoading(false);
      toast({ variant: 'destructive', title: 'Checkout Unavailable', description: error });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-950 text-white border-white/10 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs uppercase tracking-wider px-2.5 py-0.5">
              Annual Membership
            </Badge>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="size-3.5" /> Secure Checkout by Stripe
            </span>
          </div>
          <DialogTitle className="font-headline text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="size-6 text-orange-400 animate-pulse" />
            Unlock Dual Pro
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Get 1 full year of unlimited swim meets, AI workout generation, and global leaderboards.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between my-2">
          <div>
            <h4 className="font-bold text-white text-base">Dual Annual Pass</h4>
            <p className="text-xs text-blue-200">Billed annually • Cancel anytime</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-extrabold text-white">$20.00</span>
            <span className="text-xs text-slate-400 block">USD / year</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-center pt-1">
          <Lock className="size-3 text-emerald-400" />
          <span>You'll enter your card on Stripe's secure page. Membership activates once payment clears.</span>
        </div>

        <DialogFooter className="pt-2">
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full min-h-[44px] h-auto py-2.5 px-2 text-xs sm:text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg"
          >
            {loading ? 'Opening secure checkout...' : 'Continue to Payment — $20.00 USD / Year'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
