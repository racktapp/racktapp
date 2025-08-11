
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, OAuthProvider, signInWithPopup, sendEmailVerification } from 'firebase/auth';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { createUserDocumentAction } from '@/lib/actions';
import { getAuthErrorMessage } from '@/lib/utils';

const formSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }).regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores.'),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" {...props}>
        <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
        />
        <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
        />
        <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
        />
        <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
        />
        <path d="M1 1h22v22H1z" fill="none" />
    </svg>
);

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

   const handleProviderSignIn = async (provider: GoogleAuthProvider | OAuthProvider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await createUserDocumentAction({
        uid: user.uid,
        email: user.email!,
        username: user.displayName || 'New User',
        emailVerified: user.emailVerified,
        avatarUrl: user.photoURL,
      });

      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: getAuthErrorMessage(error.code),
      });
    }
  };

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    await handleProviderSignIn(new GoogleAuthProvider());
    setIsGoogleLoading(false);
  }

  async function handleAppleSignIn() {
    setIsAppleLoading(true);
    // IMPORTANT: Apple Sign-In must be enabled in the Firebase console for this to work.
    // Go to Authentication -> Sign-in method -> Add new provider -> Apple.
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    await handleProviderSignIn(provider);
    setIsAppleLoading(false);
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      
      await createUserDocumentAction({
        uid: userCredential.user.uid,
        email: values.email,
        username: values.username,
        emailVerified: userCredential.user.emailVerified,
      });

      // Update the auth profile *after* creating the doc, to match the (potentially unique) username
      await updateProfile(userCredential.user, { displayName: values.username });
      
      await sendEmailVerification(userCredential.user);

      toast({
        title: 'Account Created',
        description: 'Please check your email to verify your account.',
      });
      router.push('/verify-email');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: getAuthErrorMessage(error.code),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create an Account</h1>
          <p className="text-muted-foreground mt-2">Get started with Rackt today.</p>
        </div>

        <div className="mt-8 space-y-4">
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading || isAppleLoading}>
                 {isGoogleLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <GoogleIcon className="mr-2 h-5 w-5" />}
                Continue with Google
            </Button>
            <Button variant="outline" className="w-full" onClick={handleAppleSignIn} disabled={isLoading || isGoogleLoading || isAppleLoading}>
                {isAppleLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <Image src="/AppleLogo.png" alt="Apple Logo" width={20} height={20} className="mr-2" />}
                Continue with Apple
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or
                </span>
              </div>
            </div>

            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="your_username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading || isAppleLoading}>
                {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                Sign Up
              </Button>
            </form>
          </Form>
        </div>
        
        <p className="mt-6 px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{' '}
            <Link href="/legal/terms" className="underline underline-offset-4 hover:text-primary">
                Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/legal/privacy" className="underline underline-offset-4 hover:text-primary">
                Privacy Policy
            </Link>
            .
        </p>
        
        <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline text-primary">
              Sign In
            </Link>
        </div>
    </div>
  );
}
