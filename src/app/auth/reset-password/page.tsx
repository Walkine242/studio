'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSupabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ variant: 'destructive', title: 'Password Too Short', description: 'Use at least 8 characters.' });
      return;
    }
    setSaving(true);
    const { error } = await getSupabase().auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Could Not Update Password', description: error.message });
      return;
    }
    toast({ title: 'Password Updated', description: 'You can now log in with your new password.' });
    router.push('/dashboard');
  };

  return (
    <div className="container mx-auto max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Choose a New Password</CardTitle>
          <CardDescription>Enter a new password for your Dual account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Saving...' : 'Save Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
