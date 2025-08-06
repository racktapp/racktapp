
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
    if (loading) {
      return; // Do nothing while loading
    }
    if (!user) {
      router.replace('/login');
    } else if (!user.emailVerified) {
      router.replace('/verify-email');
    }
  }, [user, loading, router]);

  // This is the critical change. We return a loading state and prevent
  // rendering the children until we know the user is authenticated and verified.
  // This avoids issues during server-side build and prerendering.
  if (loading || !user || !user.emailVerified) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }

  return <AppLayout user={user}>{children}</AppLayout>;
}
