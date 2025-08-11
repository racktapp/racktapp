
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { type RallyGame, type LegendGame, type User } from '@/lib/types';
import { UserAvatar } from '@/components/user-avatar';
import { formatDistanceToNow } from 'date-fns';
import { Swords, Brain, Bot, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteGameAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';

interface GameListItemProps {
  game: RallyGame | LegendGame;
  gameType: 'Rally' | 'Legend';
  currentUserId: string;
}

function GameListItem({ game, gameType, currentUserId }: GameListItemProps) {
  const opponentId = game.participantIds.find(id => id !== currentUserId);
  const opponent = opponentId ? game.participantsData[opponentId] : null;
  const isMyTurn = game.currentPlayerId === currentUserId;
  const gameStatus = game.status;
  const link = gameType === 'Rally' ? `/games/rally?id=${game.id}` : `/games/legend?id=${game.id}`;
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const title = opponent ? `vs @${opponent.username}` : 'Solo Game';
  
  const myScore = game.score[currentUserId] ?? 0;
  const opponentScore = opponentId ? (game.score[opponentId] ?? 0) : null;
  const scoreDisplay = opponentId !== undefined && opponentScore !== null 
    ? `${myScore} - ${opponentScore}` 
    : `${myScore}`;


  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    const result = await deleteGameAction(game.id, gameType, currentUserId);
    if (result.success) {
      toast({ title: 'Game Deleted', description: 'The game has been removed.' });
      // The parent listener will remove this from the UI, and the dialog will be gone.
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    // Always reset the loading state to prevent the UI from getting stuck.
    setIsDeleting(false);
  };
  
  if (!opponent && (game as any).mode !== 'solo') {
    return (
        <Card>
            <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 w-[100px]" />
                </div>
            </CardContent>
        </Card>
    );
  }


  return (
    <Card className="transition-colors group">
      <CardContent className="p-0 flex items-center justify-between">
        <Link href={link} className="flex-1 p-4 flex items-center gap-4 overflow-hidden rounded-l-md group-hover:bg-muted/50">
          {opponent ? <UserAvatar user={opponent as User} className="h-10 w-10" /> : <div className="bg-primary/10 p-2 rounded-full"><Bot className="h-6 w-6 text-primary" /></div>}
          <div className="flex-1 overflow-hidden">
            <div className="flex justify-between items-start">
              <p className="font-semibold truncate">{title}</p>
              <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                {formatDistanceToNow(new Date(game.updatedAt), { addSuffix: true })}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {isMyTurn && gameStatus === 'ongoing' && <Badge>Your Turn</Badge>}
              {gameStatus === 'complete' && <Badge variant="secondary">Complete</Badge>}
              <p className="text-sm text-muted-foreground truncate">
                Score: {scoreDisplay}
              </p>
            </div>
          </div>
        </Link>
        <div className="pr-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete Game</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Game?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove this game for all participants. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  {isDeleting && <LoadingSpinner className="mr-2" />}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

export function ActiveGamesList({ currentUserId }: { currentUserId: string }) {
  const [rallyGames, setRallyGames] = useState<RallyGame[]>([]);
  const [legendGames, setLegendGames] = useState<LegendGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let rallyUnsub: () => void;
    let legendUnsub: () => void;
    let mounted = true;

    try {
        const rallyGamesRef = collection(db, 'rallyGames');
        const rallyQuery = query(rallyGamesRef, where('participantIds', 'array-contains', currentUserId), orderBy('updatedAt', 'desc'));
        rallyUnsub = onSnapshot(rallyQuery, (snapshot) => {
            if (mounted) setRallyGames(snapshot.docs.map(doc => doc.data() as RallyGame));
            if (mounted) setIsLoading(false);
        });

        const legendGamesRef = collection(db, 'legendGames');
        const legendQuery = query(legendGamesRef, where('participantIds', 'array-contains', currentUserId), orderBy('updatedAt', 'desc'));
        legendUnsub = onSnapshot(legendQuery, (snapshot) => {
            if (mounted) setLegendGames(snapshot.docs.map(doc => doc.data() as LegendGame));
            if (mounted) setIsLoading(false);
        });
    } catch (e) {
        console.error("Error attaching game listeners:", e);
        if (mounted) setIsLoading(false);
    }
    
    return () => {
        mounted = false;
        if (rallyUnsub) rallyUnsub();
        if (legendUnsub) legendUnsub();
    }
  }, [currentUserId]);

  if (isLoading) {
    return <div className="flex h-40 items-center justify-center"><LoadingSpinner className="h-8 w-8" /></div>;
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
            {rallyGames.length > 0 ? rallyGames.map(game => <GameListItem key={game.id} game={game} gameType="Rally" currentUserId={currentUserId} />) : <p className="text-muted-foreground text-center py-8">No active Rally Games.</p>}
        </TabsContent>
         <TabsContent value="legend" className="space-y-4 mt-4">
            {legendGames.length > 0 ? legendGames.map(game => <GameListItem key={game.id} game={game} gameType="Legend" currentUserId={currentUserId} />) : <p className="text-muted-foreground text-center py-8">No active Guess the Legend games.</p>}
        </TabsContent>
    </Tabs>
  );
}
