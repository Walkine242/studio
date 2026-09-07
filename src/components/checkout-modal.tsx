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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ShieldCheck, Lock, Sparkles } from 'lucide-react';
import { usePremiumMember } from '@/lib/hooks/use-premium-member';
import { useToast } from '@/hooks/use-toast';

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CheckoutModal({ open, onOpenChange, onSuccess }: CheckoutModalProps) {
  const { setPremiumStatus } = usePremiumMember();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setPremiumStatus(true);
      setLoading(false);
      onOpenChange(false);

      toast({
        title: 'Membership Activated! 🎉',
        description: 'Your Dual Annual Membership ($20.00 USD/year) is now active. All locked features are unlocked!',
      });

      if (onSuccess) {
        onSuccess();
      }
    }, 1200);
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
              <ShieldCheck className="size-3.5" /> Secure Checkout
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

        {/* Pricing Summary Box */}
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

        {/* Payment Form */}
        <form onSubmit={handlePayment} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="cardName" className="text-xs font-semibold text-slate-200">
              Cardholder Name
            </Label>
            <Input
              id="cardName"
              placeholder="e.g. Alex Morgan"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber" className="text-xs font-semibold text-slate-200">
              Card Number
            </Label>
            <div className="relative">
              <Input
                id="cardNumber"
                placeholder="4532 •••• •••• 8892"
                maxLength={19}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 pl-10 focus:border-blue-500"
              />
              <CreditCard className="absolute left-3 top-2.5 size-5 text-slate-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry" className="text-xs font-semibold text-slate-200">
                Expires (MM/YY)
              </Label>
              <Input
                id="expiry"
                placeholder="08/28"
                maxLength={5}
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc" className="text-xs font-semibold text-slate-200">
                Security Code (CVC)
              </Label>
              <Input
                id="cvc"
                placeholder="382"
                maxLength={4}
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Guarantee / Privacy disclaimer */}
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-center pt-1">
            <Lock className="size-3 text-emerald-400" />
            <span>Member feature access unlocked immediately. No admin permissions granted.</span>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] h-auto py-2.5 px-2 text-xs sm:text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg text-center flex items-center justify-center"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Processing $20.00 Payment...
                </span>
              ) : (
                'Complete Purchase — $20.00 USD / Year'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
