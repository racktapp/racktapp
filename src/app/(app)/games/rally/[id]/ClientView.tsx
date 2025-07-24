'use client';
import { useParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { type RallyGame, User } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PageHeader } from '@/components/page-header';
import { RallyGameView } from '@/components/games/rally-game-view';

export default function ClientView() {
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
        setGame(doc.data() as RallyGame);
      } else {
        // Game not found
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [gameId, user]);

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <div>Please log in to play.</div>;
  }

  if (!game) {
    return <div>Game not found.</div>;
  }

  return (
    <div>
      <PageHeader title={'Rally Game'} description={'Play a game of Rally.'} />
      <RallyGameView game={game} />
    </div>
  );
}
