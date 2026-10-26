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

import { getSupabase } from '@/lib/supabase/client';

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
  const supabase = getSupabase();

  const finish = (title: string, description: string) => {
    setPassword('');
    setLoading(false);
    onOpenChange(false);
    toast({ title, description });
    if (onSuccess) onSuccess();
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Name, email, and password are required to create an account.',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Password Too Short',
        description: 'Password must be at least 8 characters.',
      });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { name: name.trim(), country },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      setLoading(false);
      toast({ variant: 'destructive', title: 'Could Not Create Account', description: error.message });
      return;
    }

    if (!data.session) {
      // Email confirmation is on: the account exists but must be confirmed first.
      setLoading(false);
      setTab('login');
      toast({
        title: 'Check Your Email 📬',
        description: `We sent a confirmation link to ${email.trim()}. Click it, then log in.`,
      });
      return;
    }

    finish('Account Created! 🎉', `Welcome to Dual, ${name.trim()}!`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Both email and password are required to log in.',
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setLoading(false);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message === 'Invalid login credentials'
          ? 'That email and password don\'t match an account.'
          : error.message,
      });
      return;
    }

    finish('Welcome Back! 👋', 'You are logged in.');
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast({ variant: 'destructive', title: 'Enter Your Email', description: 'Type your email above first.' });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });
    toast(error
      ? { variant: 'destructive', title: 'Could Not Send Email', description: error.message }
      : { title: 'Reset Email Sent', description: 'Check your inbox for a link to choose a new password.' });
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
                  minLength={8}
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
              <button
                type="button"
                onClick={handleForgotPassword}
                className="w-full text-center text-xs text-slate-400 hover:text-white underline"
              >
                Forgot your password?
              </button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
