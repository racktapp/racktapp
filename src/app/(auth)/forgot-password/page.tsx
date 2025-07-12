
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { getAuthErrorMessage } from '@/lib/utils';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, values.email);
      setEmailSent(true);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getAuthErrorMessage(error.code),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Forgot Your Password?</h1>
        <p className="text-muted-foreground mt-2">
          No worries. Enter your email and we'll send you a reset link.
        </p>
      </div>

      {emailSent ? (
        <div className="mt-8 text-center space-y-4 p-4 border rounded-lg bg-muted/50">
          <p className="font-medium">Password reset email sent!</p>
          <p className="text-sm text-muted-foreground">
            Please check your inbox (and spam folder) for instructions on how to reset your password.
          </p>
           <Button asChild className="w-full">
            <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
            </Link>
           </Button>
        </div>
      ) : (
        <>
          <div className="mt-8">
              <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                  Send Reset Link
                  </Button>
              </form>
              </Form>
          </div>
          <div className="mt-6 text-center text-sm">
              <Link href="/login" className="underline text-primary">
                Back to Login
              </Link>
          </div>
        </>
      )}
    </div>
  );
}
