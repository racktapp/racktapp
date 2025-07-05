
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function VerifyEmailPage() {
  const { user, loading: authLoading, reloadUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.emailVerified) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleResend = async () => {
    if (!auth.currentUser) {
      toast({ variant: 'destructive', title: 'Not logged in', description: 'Please log in again to verify your email.' });
      router.push('/login');
      return;
    }
    setIsSending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast({ title: 'Verification email sent!', description: 'Please check your inbox (and spam folder).' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };
  
  const handleReload = async () => {
    await reloadUser();
    toast({ title: 'Checking status...', description: 'Checking for email verification.' });
  }

  if (authLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm text-center">
      <MailCheck className="mx-auto h-12 w-12 text-primary" />
      <h1 className="text-3xl font-bold mt-4">Verify Your Email</h1>
      <p className="text-muted-foreground mt-2">
        We've sent a verification link to{' '}
        <span className="font-semibold text-foreground">{user?.email || 'your email'}</span>.
      </p>
      <p className="text-muted-foreground mt-2">
        Please check your inbox and click the link to finish creating your account.
      </p>

      <div className="mt-8 space-y-4">
        <Button onClick={handleReload} className="w-full">
            I've verified, continue
        </Button>
        <Button onClick={handleResend} variant="secondary" className="w-full" disabled={isSending}>
          {isSending && <LoadingSpinner className="mr-2 h-4 w-4" />}
          Resend Verification Email
        </Button>
        <Button onClick={handleLogout} variant="outline" className="w-full">
          Back to Login
        </Button>
      </div>
    </div>
  );
}
