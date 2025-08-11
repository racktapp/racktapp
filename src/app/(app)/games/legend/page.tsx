
'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ClientView from "./[id]/ClientView";

function LegendGamePageContent() {
    const searchParams = useSearchParams();
    const gameId = searchParams.get('id');

    if (!gameId) {
        // This can be a redirect to the main games page or an error message
        return <div>Game ID not found.</div>;
    }

    return <ClientView gameId={gameId} />;
}


export default function Page() {
  return (
    <Suspense>
        <LegendGamePageContent />
    </Suspense>
  );
}
