
'use client';
import { AppLayout } from '@/components/layout/app-layout';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AuthenticatedAppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect now only runs on the client after the initial render.
    // The initial guard is handled by the conditional return below.
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // This is the critical change. We return a loading state and prevent
  // rendering the children until we know the user is authenticated.
  // This avoids issues during server-side build and prerendering.
  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }

  // If the user exists but the email is not verified, we can handle that redirection.
  if (!user.emailVerified) {
    router.replace('/verify-email');
    return (
       <div className="flex h-screen w-screen items-center justify-center bg-background">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }

  return <AppLayout user={user}>{children}</AppLayout>;
}
