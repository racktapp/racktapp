
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
    if (loading) return; // Wait until loading is done
    
    if (!user) {
      router.replace('/login');
    } else if (!user.emailVerified) {
      router.replace('/verify-email');
    }
  }, [user, loading, router]);

  if (loading || !user || !user.emailVerified) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }

  return <AppLayout user={user}>{children}</AppLayout>;
}
