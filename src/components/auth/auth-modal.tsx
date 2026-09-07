'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCheck, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { countries } from '@/lib/countries';
import { useToast } from '@/hooks/use-toast';

export interface UserAccount {
  userId: string;
  name: string;
  email: string;
  country: string;
  isLoggedIn: boolean;
  isPremium?: boolean;
}

const ACCOUNT_STORAGE_KEY = 'dual_current_account';

export function getCurrentAccount(): UserAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCurrentAccount(account: UserAccount) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(account));
  
  // Sync legacy aquaSpeed-userProfile so header & profile pages update
  localStorage.setItem('aquaSpeed-userProfile', JSON.stringify({
    name: account.name,
    country: account.country,
  }));
  localStorage.setItem('userId', account.userId);

  // Restore premium status if previously upgraded under this email
  if (account.email) {
    const savedPremium = localStorage.getItem(`dual_is_premium_${account.email.toLowerCase()}`);
    if (savedPremium === 'true') {
      localStorage.setItem('dual-is-premium', 'true');
    }
  }

  // Dispatch custom storage event for live reactive updates
  window.dispatchEvent(new Event('storage'));
}

export function logoutAccount() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCOUNT_STORAGE_KEY);
  localStorage.setItem('dual-is-premium', 'false');
  window.dispatchEvent(new Event('storage'));
}

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'signup' | 'login'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('USA');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setLoading(true);
    setTimeout(() => {
      const userId = 'user_' + Math.random().toString(36).substring(2, 9);
      const newAccount: UserAccount = {
        userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        country,
        isLoggedIn: true,
      };

      saveCurrentAccount(newAccount);
      setLoading(false);
      onOpenChange(false);

      toast({
        title: 'Account Created! 🎉',
        description: `Welcome to Dual, ${name.trim()}! You now have full access to basic features.`,
      });

      if (onSuccess) onSuccess();
    }, 600);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setTimeout(() => {
      const existingName = name.trim() || email.split('@')[0];
      const userId = 'user_' + Math.random().toString(36).substring(2, 9);
      const account: UserAccount = {
        userId,
        name: existingName,
        email: email.trim().toLowerCase(),
        country,
        isLoggedIn: true,
      };

      saveCurrentAccount(account);
      setLoading(false);
      onOpenChange(false);

      toast({
        title: 'Welcome Back! 👋',
        description: `Logged in as ${account.name}. Your profile and member benefits are active.`,
      });

      if (onSuccess) onSuccess();
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-950 text-white border-white/10 shadow-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="font-headline text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="size-6 text-orange-400 animate-pulse" />
            Join Dual Swim
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Create your Dual Swim account or log in to access basic features, leaderboards, and swim meets.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full pt-2">
          <TabsList className="grid w-full grid-cols-2 bg-white/10">
            <TabsTrigger value="signup" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white font-bold">
              <UserPlus className="size-4 mr-2" /> Create Account
            </TabsTrigger>
            <TabsTrigger value="login" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold">
              <LogIn className="size-4 mr-2" /> Log In
            </TabsTrigger>
          </TabsList>

          {/* SIGN UP FORM */}
          <TabsContent value="signup" className="pt-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-xs font-semibold text-slate-200">
                  Swimmer Display Name / Full Name
                </Label>
                <Input
                  id="signup-name"
                  placeholder="e.g. Caeleb Dressel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-orange-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-xs font-semibold text-slate-200">
                  Email Address
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="swimmer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-orange-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-country" className="text-xs font-semibold text-slate-200">
                  Country
                </Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-orange-500">
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-white/10 max-h-60">
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg mt-2"
              >
                {loading ? 'Creating Account...' : 'Create Dual Swim Profile & Access App'}
              </Button>
            </form>
          </TabsContent>

          {/* LOG IN FORM */}
          <TabsContent value="login" className="pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-xs font-semibold text-slate-200">
                  Email Address
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="swimmer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-name" className="text-xs font-semibold text-slate-200">
                  Swimmer Name (Optional)
                </Label>
                <Input
                  id="login-name"
                  placeholder="e.g. Katie Ledecky"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg mt-2"
              >
                {loading ? 'Logging in...' : 'Log In to Dual Swim'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
