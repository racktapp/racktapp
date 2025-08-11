
'use client';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { type RallyGame, User } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PageHeader } from '@/components/page-header';
import { RallyGameView } from '@/components/games/rally-game-view';

export default function ClientView({ gameId }: { gameId: string }) {
  const { user, loading: authLoading } = useAuth();
  
  const [game, setGame] = useState<RallyGame | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId || !user) {
      setLoading(false);
      return;
    }

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
  
  if (!game) {
    if (loading) {
         return (
          <div className="flex h-full flex-col items-center justify-center p-4">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        );
    }
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <PageHeader title="Game Not Found" description="This game may not exist or you might not have access." />
        </div>
    );
  }

  return <RallyGameView game={game} currentUser={user!} />;
}
