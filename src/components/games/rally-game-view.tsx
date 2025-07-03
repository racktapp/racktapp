
'use client';
import { useState, useEffect, useRef } from 'react';
import { RallyGame, User } from '@/lib/types';
import { playRallyTurnAction } from '@/lib/actions';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Swords, Shield, Zap } from 'lucide-react';
import { UserAvatar } from '../user-avatar';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { RallyCourt } from './rally-court';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Trophy } from 'lucide-react';

interface RallyGameViewProps {
  game: RallyGame;
  currentUser: User;
}

const riskIcons = {
  low: Shield,
  medium: Swords,
  high: Zap,
};

const GameSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
        </CardHeader>
        <CardContent className="min-h-[150px] space-y-4">
            <Skeleton className="h-5 w-1/3 mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        </CardContent>
    </Card>
)

export function RallyGameView({ game, currentUser }: RallyGameViewProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const prevTurnRef = useRef(game.turn);

  const opponentId = game.participantIds.find(id => id !== currentUser.uid);
  const opponent = opponentId ? game.participantsData[opponentId] : null;
  const isMyTurn = game.currentPlayerId === currentUser.uid;
  const lastPoint = game.pointHistory[game.pointHistory.length - 1];
  
  const options = game.turn === 'serving' ? game.currentPoint?.serveOptions : game.currentPoint?.returnOptions;

  // Effect to automatically start the next point after a delay.
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const turnChangedToPointOver = game.turn === 'point_over' && prevTurnRef.current !== 'point_over';

    if (turnChangedToPointOver && game.status === 'ongoing') {
        setIsTransitioning(true);
        // Both clients will attempt to trigger the action.
        // The server-side action is now idempotent and will only be executed once.
        timer = setTimeout(() => {
            playRallyTurnAction(game.id, null, currentUser.uid)
                .catch((error) => {
                    toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to start next point.' });
                    setIsTransitioning(false); // Reset on error
                });
        }, 4000);
    }
    
    // When the game successfully moves to a new turn, reset the transitioning state.
    if (game.turn !== 'point_over' && isTransitioning) {
        setIsTransitioning(false);
    }

    // Update the ref to the current turn for the next render.
    prevTurnRef.current = game.turn;

    return () => {
        if (timer) clearTimeout(timer);
    };
  }, [game.id, game.turn, game.status, currentUser.uid, isTransitioning, toast]);

  // Effect to animate the progress bar during the transition.
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTransitioning) {
        setProgress(0);
        interval = setInterval(() => {
            setProgress(prev => (prev >= 100 ? 100 : prev + 1));
        }, 40); // 4000ms total
    } else {
        setProgress(0);
    }
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [isTransitioning]);


  const handleAction = async (choice: any) => {
    // This function is only for player actions (serve/return).
    if (isProcessing || !isMyTurn || isTransitioning) return;

    setIsProcessing(true);
    const result = await playRallyTurnAction(game.id, choice, currentUser.uid);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    // On success or failure, reset processing state. The snapshot listener will handle UI updates.
    setIsProcessing(false);
  };
  
  if (!opponent || !opponentId) {
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <PageHeader title="Error" description="Opponent data could not be loaded for this game." />
        </div>
    )
  }

  const renderFinalScreen = () => {
    const isWinner = game.winnerId === currentUser.uid;
    const finalScore = `${game.score[currentUser.uid]} - ${game.score[opponentId]}`;

    return (
        <Alert className="mt-8 text-center">
            <Trophy className="mx-auto h-6 w-6" />
            <AlertTitle className="text-2xl font-bold mt-2">
                {isWinner ? 'You Win!' : 'You Lost'}
            </AlertTitle>
            <AlertDescription>
                Final Score: {finalScore}
            </AlertDescription>
        </Alert>
    );
  };


  const renderContent = () => {
    if (isMyTurn && game.turn !== 'point_over' && !options) {
        return <GameSkeleton />;
    }

    if (game.status === 'complete') {
        return renderFinalScreen();
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {`Point ${game.pointHistory.length + 1}`}
          </CardTitle>
          <CardDescription>
             {game.turn === 'point_over'
                ? 'Point finished.'
                : isMyTurn
                ? "It's your turn to act."
                : `Waiting for ${opponent.name}...`}
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[150px]">
            {game.turn === 'point_over' && lastPoint ? (
                <div className="bg-muted/50 p-4 rounded-lg text-center opacity-0 animate-fade-in-slide-up space-y-4">
                    <div>
                        <p className="font-bold text-lg">{lastPoint.winner === currentUser.uid ? 'You won the point!' : `${game.participantsData[lastPoint.winner]?.name} won the point!`}</p>
                        <p className="text-muted-foreground italic mt-2">"{lastPoint.narrative}"</p>
                    </div>
                     {isTransitioning && game.status === 'ongoing' && (
                        <div className="w-full space-y-2 text-center pt-2">
                            <p className="text-sm text-muted-foreground">Starting next point...</p>
                            <Progress value={progress} className="w-full" />
                        </div>
                    )}
                </div>
            ) : game.turn !== 'game_over' ? (
                <div className="space-y-4">
                    <p className="font-semibold text-center">{game.turn === 'serving' ? 'Choose your serve:' : 'Choose your return:'}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {options?.map((option, idx) => {
                            const RiskIcon = 'risk' in option ? riskIcons[option.risk as 'low'|'medium'|'high'] : Swords;
                            return (
                                <Button
                                    key={`${game.turn}-${idx}`}
                                    variant="outline"
                                    className="h-auto p-4 flex flex-col gap-2 items-start text-left opacity-0 animate-fade-in-slide-up"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                    disabled={!isMyTurn || isProcessing || isTransitioning}
                                    onClick={() => handleAction(option)}
                                >
                                    <div className="flex items-center gap-2 font-bold">
                                        <RiskIcon className="h-4 w-4" />
                                        <span>{option.name}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground font-normal">{option.description}</p>
                                </Button>
                            );
                        })}
                    </div>
                    {isProcessing && <div className="flex justify-center pt-4"><LoadingSpinner className="h-6 w-6" /></div>}
                    {!isMyTurn && !isTransitioning && <p className="text-muted-foreground text-center pt-4">Waiting for opponent...</p>}
                </div>
            ) : null}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Rally Game"
        description={`A turn-based Tennis point simulator vs ${opponent.name}.`}
      />
      
      {/* Scoreboard */}
      <div className="flex justify-center gap-8 items-center mb-4">
        <div className="flex flex-col items-center gap-2">
          <UserAvatar user={currentUser} className="h-16 w-16" />
          <p className="font-bold text-4xl">{game.score[currentUser.uid]}</p>
        </div>
        <p className="text-4xl font-bold text-muted-foreground">-</p>
         <div className="flex flex-col items-center gap-2">
          <UserAvatar user={opponent} className="h-16 w-16" />
          <p className="font-bold text-4xl">{game.score[opponentId]}</p>
        </div>
      </div>
      
      {/* Animated Court */}
      <RallyCourt game={game} currentUser={currentUser} />

      {/* Game State */}
      {renderContent()}

    </div>
  );
}
