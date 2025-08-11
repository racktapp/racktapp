'use client';
import ProfileClientView from './ClientView';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (!id) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <p>No profile ID provided.</p>
      </div>
    );
  }

  return <ProfileClientView id={id} />;
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><LoadingSpinner className="h-8 w-8" /></div>}>
            <ProfilePageContent />
        </Suspense>
    )
}
