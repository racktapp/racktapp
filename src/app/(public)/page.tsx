'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect will only run on the client, after the component has mounted
    // and the loading state is resolved.
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/intro');
      }
    }
  }, [user, loading, router]);

  // Always return a valid component, even during the server-side build.
  // This prevents the build from crashing.
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <LoadingSpinner className="h-12 w-12" />
    </div>
  );
}
