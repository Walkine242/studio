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
import { UserCheck, Sparkles, LogIn, UserPlus, Lock, KeyRound } from 'lucide-react';
import { countries } from '@/lib/countries';
import { useToast } from '@/hooks/use-toast';
import { registerUser } from '@/lib/users';

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
  
  // Register in user discovery list
  registerUser({
    id: account.userId,
    name: account.name,
    country: account.country,
    email: account.email,
  });

  // Sync legacy profile so header & profile pages update
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
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('USA');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Name, email, and password are required to create an account.',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters.',
      });
      return;
    }

    const formattedEmail = email.trim().toLowerCase();
    const existingCreds = typeof window !== 'undefined' ? localStorage.getItem(`dual_user_creds_${formattedEmail}`) : null;
    if (existingCreds) {
      toast({
        variant: 'destructive',
        title: 'Account Already Exists',
        description: `An account with email "${formattedEmail}" is already registered. Please log in with your password.`,
      });
      setTab('login');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const newAccount: UserAccount = {
        userId,
        name: name.trim(),
        email: formattedEmail,
        country,
        isLoggedIn: true,
      };

      // Save credentials for login validation
      localStorage.setItem(`dual_user_creds_${formattedEmail}`, JSON.stringify({
        ...newAccount,
        password: password.trim(),
      }));

      saveCurrentAccount(newAccount);

      // Trigger Welcome Email Notification
      fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: formattedEmail,
        }),
      }).catch((err) => console.error('Failed to dispatch welcome email:', err));

      setLoading(false);
      onOpenChange(false);

      toast({
        title: 'Account Created! 🎉',
        description: `Welcome to Dual, ${name.trim()}! Your profile is active.`,
      });

      if (onSuccess) onSuccess();
    }, 600);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Both email and password are required to log in.',
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const formattedEmail = email.trim().toLowerCase();
      const storedCredsRaw = localStorage.getItem(`dual_user_creds_${formattedEmail}`);

      if (!storedCredsRaw) {
        setLoading(false);
        toast({
          variant: 'destructive',
          title: 'No Account Found',
          description: `No registered account found with email "${formattedEmail}". Please check your email or click Create Account.`,
        });
        return;
      }

      try {
        const storedCreds = JSON.parse(storedCredsRaw);
        if (storedCreds.password !== password.trim()) {
          setLoading(false);
          toast({
            variant: 'destructive',
            title: 'Incorrect Password',
            description: 'The password you entered is incorrect. Please try again.',
          });
          return;
        }

        const account: UserAccount = {
          userId: storedCreds.userId || `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          name: storedCreds.name || formattedEmail.split('@')[0],
          email: formattedEmail,
          country: storedCreds.country || 'USA',
          isLoggedIn: true,
        };

        saveCurrentAccount(account);
        setLoading(false);
        onOpenChange(false);

        toast({
          title: 'Welcome Back! 👋',
          description: `Logged in as ${account.name}. Your profile is active.`,
        });

        if (onSuccess) onSuccess();
      } catch (err) {
        setLoading(false);
        toast({
          variant: 'destructive',
          title: 'Login Error',
          description: 'Failed to authenticate account. Please try again.',
        });
      }
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-950 text-white border-white/10 shadow-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="font-headline text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="size-6 text-orange-400 animate-pulse" />
            Dual Swim Account
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Create an account or log in with your email & password to access basic features and swim meets.
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

          {/* CREATE ACCOUNT FORM */}
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
                <Label htmlFor="signup-password" className="text-xs font-semibold text-slate-200">
                  Password
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                {loading ? 'Creating Account...' : 'Create Dual Swim Account & Access App'}
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
                <Label htmlFor="login-password" className="text-xs font-semibold text-slate-200">
                  Password
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
