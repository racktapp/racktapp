'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { type RallyGame, type LegendGame, type User } from '@/lib/types';
import { UserAvatar } from '@/components/user-avatar';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Swords, Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GameListItemProps {
  game: RallyGame | LegendGame;
  gameType: 'Rally' | 'Legend';
  currentUserId: string;
}

function GameListItem({ game, gameType, currentUserId }: GameListItemProps) {
  const opponentId = game.participantIds.find(id => id !== currentUserId);
  const opponent = opponentId ? game.participantsData[opponentId] : null;
  const isYourTurn = 'currentPlayerId' in game ? game.currentPlayerId === currentUserId : ('turn' in game && game.turn === currentUserId);
  const gameStatus = game.status;
  const link = gameType === 'Rally' ? `/games/rally/${game.id}` : `/games/legend/${game.id}`;

  const title = opponent ? `vs ${opponent.name}` : 'Solo Game';

  return (
    <Link href={link}>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="p-4 flex items-center gap-4">
          {opponent ? <UserAvatar user={opponent as User} className="h-10 w-10" /> : <div className="bg-primary/10 p-2 rounded-full"><Brain className="h-6 w-6 text-primary" /></div>}
          <div className="flex-1 overflow-hidden">
            <div className="flex justify-between items-start">
              <p className="font-semibold truncate">{title}</p>
              <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                {formatDistanceToNow(new Date(game.updatedAt), { addSuffix: true })}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
                {isYourTurn && gameStatus === 'ongoing' && <Badge>Your Turn</Badge>}
                {gameStatus === 'complete' && <Badge variant="secondary">Complete</Badge>}
                <p className="text-sm text-muted-foreground truncate">
                    Score: {game.score[currentUserId]} - {opponent ? game.score[opponentId] : 'N/A'}
                </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ActiveGamesList({ currentUserId }: { currentUserId: string }) {
  const [rallyGames, setRallyGames] = useState<RallyGame[]>([]);
  const [legendGames, setLegendGames] = useState<LegendGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const rallyGamesRef = collection(db, 'rallyGames');
    const rallyQuery = query(rallyGamesRef, where('participantIds', 'array-contains', currentUserId), orderBy('updatedAt', 'desc'));
    const rallyUnsub = onSnapshot(rallyQuery, (snapshot) => {
      setRallyGames(snapshot.docs.map(doc => doc.data() as RallyGame));
      setIsLoading(false);
    });

    const legendGamesRef = collection(db, 'legendGames');
    const legendQuery = query(legendGamesRef, where('participantIds', 'array-contains', currentUserId), orderBy('updatedAt', 'desc'));
    const legendUnsub = onSnapshot(legendQuery, (snapshot) => {
      setLegendGames(snapshot.docs.map(doc => doc.data() as LegendGame));
      setIsLoading(false);
    });

    return () => {
      rallyUnsub();
      legendUnsub();
    };
  }, [currentUserId]);

  if (isLoading) {
    return <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const allGames = [...rallyGames, ...legendGames];
  if (allGames.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground">You have no active games.</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="all">
        <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="rally"><Swords className="mr-2 h-4 w-4" />Rally Games</TabsTrigger>
            <TabsTrigger value="legend"><Brain className="mr-2 h-4 w-4" />Guess the Legend</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4 mt-4">
            {allGames.sort((a,b) => b.updatedAt - a.updatedAt).map(game => (
                <GameListItem 
                    key={game.id} 
                    game={game}
                    gameType={'pointHistory' in game ? 'Rally' : 'Legend'}
                    currentUserId={currentUserId}
                />
            ))}
        </TabsContent>
        <TabsContent value="rally" className="space-y-4 mt-4">
            {rallyGames.map(game => <GameListItem key={game.id} game={game} gameType="Rally" currentUserId={currentUserId} />)}
             {rallyGames.length === 0 && <p className="text-muted-foreground text-center py-8">No active Rally Games.</p>}
        </TabsContent>
         <TabsContent value="legend" className="space-y-4 mt-4">
            {legendGames.map(game => <GameListItem key={game.id} game={game} gameType="Legend" currentUserId={currentUserId} />)}
            {legendGames.length === 0 && <p className="text-muted-foreground text-center py-8">No active Guess the Legend games.</p>}
        </TabsContent>
    </Tabs>
  );
}
