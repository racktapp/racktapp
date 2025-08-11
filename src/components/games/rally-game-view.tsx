
'use client';
import { useState, useEffect, useRef } from 'react';
import { RallyGame, User } from '@/lib/types';
import { playRallyTurnAction, startNextRallyPointAction } from '@/lib/actions';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Swords, Shield, Zap, Users, ArrowRight } from 'lucide-react';
import { UserAvatar } from '../user-avatar';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { RallyCourt } from './rally-court';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Trophy } from 'lucide-react';
import { StartRallyFriendDialog } from './start-rally-friend-dialog';

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
  const [pointResult, setPointResult] = useState<{ narrative: string, winnerName: string } | null>(null);
  const [progress, setProgress] = useState(0);

  const opponentId = game.participantIds.find(id => id !== currentUser.uid)!;
  const opponent = game.participantsData[opponentId];
  const pointHistoryLength = game.pointHistory.length;
  const prevPointHistoryLength = useRef(pointHistoryLength);
  
  // Effect to handle the end of a point and trigger the start of the next one
  useEffect(() => {
    if (game.turn === 'point_over' && pointHistoryLength > prevPointHistoryLength.current) {
        const lastPoint = game.pointHistory[pointHistoryLength - 1];
        if (lastPoint) {
            const winnerName = game.participantsData[lastPoint.winner]?.username ?? 'Somebody';
            setPointResult({ narrative: lastPoint.narrative, winnerName: `${winnerName} won the point!` });
            prevPointHistoryLength.current = pointHistoryLength;
            
            // Designate one player to trigger the next round action to prevent race conditions
            if (game.currentPlayerId === currentUser.uid) {
                const timer = setTimeout(() => {
                    startNextRallyPointAction(game.id);
                }, 4000); // 4-second delay before starting next point
                return () => clearTimeout(timer);
            }
        }
    } else if (game.turn !== 'point_over') {
        setPointResult(null); // Clear result when new turn starts
    }
  }, [game.turn, pointHistoryLength, game.pointHistory, game.participantsData, game.id, game.currentPlayerId, currentUser.uid]);

  // Effect to animate the progress bar when a point result is being shown
  useEffect(() => {
    if (pointResult) {
        setProgress(0);
        const interval = setInterval(() => {
            setProgress(prev => (prev >= 100 ? 100 : prev + 1.25));
        }, 50); // 4000ms total
        return () => clearInterval(interval);
    }
  }, [pointResult]);

  const handleAction = async (choice: any) => {
    if (isProcessing || game.currentPlayerId !== currentUser.uid) return;
    setIsProcessing(true);
    try {
        await playRallyTurnAction(game.id, choice, currentUser.uid);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsProcessing(false);
    }
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
        <div className="text-center space-y-4">
            <Alert className="mt-8 text-center">
                <Trophy className="mx-auto h-6 w-6" />
                <AlertTitle className="text-2xl font-bold mt-2">
                    {isWinner ? 'You Win!' : 'You Lost'}
                </AlertTitle>
                <AlertDescription>
                    Final Score: {finalScore}
                </AlertDescription>
            </Alert>
            <StartRallyFriendDialog opponent={opponent as User}>
                <Button>
                    Rematch
                    <Users className="mr-2 h-4 w-4" />
                </Button>
            </StartRallyFriendDialog>
        </div>
    );
  };


  const renderContent = () => {
    const isMyTurn = game.currentPlayerId === currentUser.uid;
    const options = game.turn === 'serving' ? game.currentPoint?.serveOptions : game.currentPoint?.returnOptions;
    
    if (pointResult) {
        return (
            <div className="bg-muted/50 p-4 rounded-lg text-center opacity-0 animate-fade-in-slide-up space-y-4">
                <div>
                    <p className="font-bold text-lg">{pointResult.winnerName}</p>
                    <p className="text-muted-foreground italic mt-2">"{pointResult.narrative}"</p>
                </div>
                {game.status === 'ongoing' && (
                    <div className="w-full space-y-2 text-center pt-2">
                        <p className="text-sm text-muted-foreground">Starting next point...</p>
                        <Progress value={progress} className="w-full" />
                    </div>
                )}
            </div>
        )
    }

    if (isMyTurn && !options) {
        return <GameSkeleton />;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {`Point ${game.pointHistory.length + 1}`}
          </CardTitle>
          <CardDescription>
             {isMyTurn ? "It's your turn to act." : `Waiting for ${opponent.username}...`}
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[150px]">
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
                                disabled={!isMyTurn || isProcessing}
                                onClick={() => handleAction(option)}
                            >
                                <div className="flex items-center gap-2 font-bold">
                                    <RiskIcon className="h-4 w-4" />
                                    <span>{option.name}</span>
                                </div>
                                <p className="text-sm text-muted-foreground font-normal whitespace-normal">{option.description}</p>
                            </Button>
                        );
                    })}
                </div>
                {isProcessing && <div className="flex justify-center pt-4"><LoadingSpinner className="h-6 w-6" /></div>}
                {!isMyTurn && <p className="text-muted-foreground text-center pt-4">Waiting for opponent...</p>}
            </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Rally Game"
        description={`A turn-based Tennis point simulator vs ${opponent.username}.`}
      />
      
      {/* Scoreboard */}
      <div className="flex justify-center gap-8 items-center mb-4">
        <div className="flex flex-col items-center gap-2">
          <UserAvatar user={currentUser} className="h-16 w-16" />
          <p className="font-bold text-4xl">{game.score[currentUser.uid]}</p>
        </div>
        <p className="text-4xl font-bold text-muted-foreground">-</p>
         <div className="flex flex-col items-center gap-2">
          <UserAvatar user={opponent as User} className="h-16 w-16" />
          <p className="font-bold text-4xl">{game.score[opponentId]}</p>
        </div>
      </div>
      
      {/* Animated Court */}
      <RallyCourt game={game} currentUser={currentUser} />

      {/* Game State */}
      {game.status === 'complete' ? renderFinalScreen() : renderContent()}

    </div>
  );
}
