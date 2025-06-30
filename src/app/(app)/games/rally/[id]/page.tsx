'use client';
import { useParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { type RallyGame } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { RallyGameView } from '@/components/games/rally-game-view';

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
            setGame(null); // User not part of this game
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

  if (loading || authLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!game) {
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <PageHeader title="Game Not Found" description="This game does not exist or you don't have access." />
        </div>
    );
  }

  return <RallyGameView game={game} currentUser={user!} />;
}
