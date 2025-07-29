
'use client';
import { useParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { type RallyGame } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PageHeader } from '@/components/page-header';
import { RallyGameView } from '@/components/games/rally-game-view';

// Required for static export
export async function generateStaticParams() {
  return [];
}

export default function RallyGamePage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const gameId = params.id as string;

  const [game, setGame] = useState<RallyGame | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId || !user) return;

    const gameRef = doc(db, 'rallyGames', gameId);
    const unsubscribe = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        const gameData = doc.data() as RallyGame;
        if (gameData.participantIds.includes(user.uid)) {
          setGame(gameData);
        } else {
          setGame(null);
        }
      } else {
        setGame(null);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching rally game:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [gameId, user]);

  if (authLoading || loading) {
    return (
        <div className="flex h-full items-center justify-center">
            <LoadingSpinner className="h-8 w-8" />
        </div>
    );
  }

  if (!user) {
    return <div className="p-4">Please log in to play.</div>;
  }

  if (!game) {
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <PageHeader title="Game Not Found" description="This game may not exist or you might not have access." />
        </div>
    );
  }

  return <RallyGameView game={game} currentUser={user} />;
}
