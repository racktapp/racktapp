
'use client';

import ClientView from './[id]/ClientView';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function RallyGamePageContent() {
    const searchParams = useSearchParams();
    const gameId = searchParams.get('id');

    if (!gameId) {
        return <div>Game not found.</div>
    }

    return <ClientView gameId={gameId} />;
}

export default function Page() {
  return (
    <Suspense>
        <RallyGamePageContent />
    </Suspense>
  );
}
