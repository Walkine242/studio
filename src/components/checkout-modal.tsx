'use client';

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
import { ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPlan?: string;
  onSuccess?: () => void;
}

export function CheckoutModal({ open, onOpenChange }: CheckoutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-950 text-white border-white/10 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-xs uppercase px-2.5 py-0.5">
              100% FREE PLATFORM
            </Badge>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="size-3.5" /> No Subscription Fees
            </span>
          </div>
          <DialogTitle className="font-headline text-2xl font-bold text-white flex items-center gap-2 pt-1">
            <Sparkles className="size-6 text-emerald-400 animate-pulse" />
            Dual is 100% Free!
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            All features on Dual are completely free for all swimmers! Enjoy full access to AI workout generation, virtual swim meets, global leaderboards, and live dual match lobbies.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2 my-2">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
            <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
            Full Swimmer Access Unlocked
          </div>
          <p className="text-xs text-slate-300">
            You don't need any subscription or payment to use Dual. Explore all features right now.
          </p>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full h-11 text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-black shadow-lg"
          >
            Start Swimming Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



