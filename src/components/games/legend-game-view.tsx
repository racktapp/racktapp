

'use client';
import { useState, useEffect, useRef } from 'react';
import { LegendGame, User } from '@/lib/types';
import { submitLegendAnswerAction, startNextLegendRoundAction } from '@/lib/actions';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Trophy, AlertTriangle, ArrowRight, Users } from 'lucide-react';
import { UserAvatar } from '../user-avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { StartLegendSoloDialog } from './start-legend-solo-dialog';
import { StartLegendFriendDialog } from './start-legend-friend-dialog';

interface LegendGameViewProps {
  game: LegendGame;
  currentUser: User;
}

export function LegendGameView({ game, currentUser }: LegendGameViewProps) {
  const { toast } = useToast();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isStartingNextRound, setIsStartingNextRound] = useState(false);
  const [progress, setProgress] = useState(0);
  const prevRoundCount = useRef(game.roundHistory?.length || 0);

  // When new game data comes in, check if a new round has started and reset local state.
  useEffect(() => {
    const currentRoundCount = game.roundHistory?.length || 0;
    if (currentRoundCount > prevRoundCount.current) {
        setIsStartingNextRound(false);
        setSelectedAnswer(null);
        setIsAnswering(false);
        setProgress(0);
    }
    prevRoundCount.current = currentRoundCount;
  }, [game.roundHistory]);

  // Automatically start the next round after a delay when the current round is over.
  useEffect(() => {
    if (game.turnState === 'round_over' && game.status === 'ongoing') {
        setIsStartingNextRound(true);
        // Designate one player to trigger the action to prevent race conditions.
        if (game.currentPlayerId === currentUser.uid) {
            const timer = setTimeout(() => {
                startNextLegendRoundAction(game.id);
            }, 4000); // 4-second delay
            return () => clearTimeout(timer);
        }
    }
  }, [game.turnState, game.status, game.id, game.currentPlayerId, currentUser.uid]);

  // Animate the progress bar during the delay.
  useEffect(() => {
    if (isStartingNextRound) {
        setProgress(0);
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 1;
            });
        }, 40); // 40ms * 100 = 4000ms
        return () => clearInterval(interval);
    }
  }, [isStartingNextRound]);


  // Safely check for a valid, playable round.
  if (
    !game.currentRound ||
    !Array.isArray(game.currentRound.options) ||
    game.currentRound.options.length === 0
  ) {
    if (isStartingNextRound) {
        return (
            <div className="container mx-auto p-4 md:p-6 lg:p-8">
                 <PageHeader title="Guess the Legend" description="Starting the next round..." />
                 <div className="flex justify-center items-center h-64">
                    <LoadingSpinner className="h-12 w-12" />
                 </div>
            </div>
        )
    }
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <PageHeader 
            title="Could not load game" 
            description="There was a problem loading the current round data. Please try again later."
        />
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Game Error</AlertTitle>
            <AlertDescription>{game.error || 'Failed to generate game round.'}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const currentRound = game.currentRound;
  const opponentId = game.participantIds.find(id => id !== currentUser.uid);
  const opponent = opponentId ? game.participantsData[opponentId] as User : null;
  const myGuess = currentRound.guesses?.[currentUser.uid];
  const opponentGuess = opponentId ? currentRound.guesses?.[opponentId] : null;

  const handleAnswerSubmit = async (answer: string) => {
    if (isAnswering || myGuess) return;
    setSelectedAnswer(answer);
    setIsAnswering(true);
    const result = await submitLegendAnswerAction(game.id, answer, currentUser.uid);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
      setIsAnswering(false); 
      setSelectedAnswer(null);
    }
  };

  const getButtonState = (option: string) => {
    if (!myGuess) return 'default';
    if (option === currentRound.correctAnswer) return 'correct';
    if (option === myGuess) return 'incorrect';
    return 'disabled';
  };

  const getOpponentGuessState = (option: string) => {
    if (!myGuess || !opponentGuess) return 'none';
    if (option === opponentGuess) {
        return opponentGuess === currentRound.correctAnswer ? 'correct' : 'incorrect';
    }
    return 'none';
  }
  
  const opponentName = opponent ? (opponent.username || 'Opponent') : 'Opponent';
  const isProcessing = isAnswering || isStartingNextRound;

  const renderFinalScreen = () => {
    const isWinner = game.winnerId === currentUser.uid;
    const isDraw = game.status === 'complete' && game.winnerId === 'draw';
    const finalScore = opponentId ? `${game.score[currentUser.uid]} - ${game.score[opponentId]}` : game.score[currentUser.uid];
    
    let titleText = 'Game Over!';
    if (game.mode === 'friend') {
        if (isDraw) titleText = "It's a Draw!";
        else if (isWinner) titleText = 'You Win!';
        else titleText = 'You Lost!';
    }

    return (
        <div className="mt-8 text-center space-y-4">
            <Alert>
                <Trophy className="mx-auto h-6 w-6" />
                <AlertTitle className="text-2xl font-bold mt-2">
                    {titleText}
                </AlertTitle>
                <AlertDescription>
                    Final Score: {finalScore}
                </AlertDescription>
            </Alert>

            {game.mode === 'solo' ? (
                <StartLegendSoloDialog>
                    <Button>
                        Play Again
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </StartLegendSoloDialog>
            ) : opponent && (
                <StartLegendFriendDialog opponent={opponent}>
                    <Button>
                        Rematch
                        <Users className="ml-2 h-4 w-4" />
                    </Button>
                </StartLegendFriendDialog>
            )}
        </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Guess the Legend"
        description={game.mode === 'solo' ? `A solo ${game.sport} trivia challenge.` : `A ${game.sport} trivia challenge vs ${opponentName}.`}
      />

      <Card className="mb-8">
        <CardContent className="p-4">
            {game.mode === 'solo' ? (
                 <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium text-muted-foreground">Your Score</p>
                    <p className="text-4xl font-bold">{game.score[currentUser.uid]}</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 items-center gap-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <UserAvatar user={currentUser} className="h-14 w-14" />
                        <p className="font-semibold truncate">@{currentUser.username}</p>
                        <p className="text-3xl font-bold">{game.score[currentUser.uid]}</p>
                    </div>
                    
                    <p className="text-4xl font-bold text-muted-foreground">vs</p>

                    <div className="flex flex-col items-center gap-2">
                        <UserAvatar user={opponent} className="h-14 w-14" />
                        <p className="font-semibold truncate">@{opponent?.username}</p>
                        <p className="text-3xl font-bold">{game.score[opponentId!]}</p>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
      
      {game.status === 'complete' ? renderFinalScreen() : (
        <Card>
            <CardHeader>
            <CardTitle>Round {(game.roundHistory?.length || 0) + 1}: Who am I?</CardTitle>
            <CardDescription className="text-lg italic pt-2">"{currentRound.clue}"</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentRound.options.map(option => {
                    const myState = getButtonState(option);
                    const oppState = getOpponentGuessState(option);
                    return (
                        <Button
                            key={option}
                            variant={myGuess ? 'outline' : 'default'}
                            className={cn("h-auto py-4 text-base justify-between", {
                                "bg-green-500/10 border-green-500 text-green-700 hover:bg-green-500/20": myState === 'correct',
                                "bg-red-500/10 border-red-500 text-red-700 hover:bg-red-500/20": myState === 'incorrect',
                                "bg-muted/50": myState === 'disabled',
                            })}
                            disabled={isProcessing || !!myGuess}
                            onClick={() => handleAnswerSubmit(option)}
                        >
                            <div className="flex items-center gap-2">
                                {isAnswering && selectedAnswer === option && <LoadingSpinner className="mr-2 h-4 w-4" />}
                                {myState === 'correct' && <CheckCircle className="mr-2 h-4 w-4" />}
                                {myState === 'incorrect' && <XCircle className="mr-2 h-4 w-4" />}
                                {option}
                            </div>
                            {opponent && myGuess && oppState !== 'none' && (
                                <div className="flex items-center gap-1 text-xs">
                                    <UserAvatar user={opponent} className="h-4 w-4" />
                                    <span>{oppState === 'correct' ? '✅' : '❌'}</span>
                                </div>
                            )}
                        </Button>
                    )
                })}
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
                {myGuess && !opponentGuess && game.status === 'ongoing' && game.mode === 'friend' && (
                    <p className="text-muted-foreground w-full text-center">Waiting for {opponentName} to answer...</p>
                )}
                
                {game.turnState === 'round_over' && (
                    <Alert className="w-full">
                        <AlertTitle className="font-bold">Answer: {currentRound.correctAnswer}</AlertTitle>
                        <AlertDescription className="italic mt-1">{currentRound.justification}</AlertDescription>
                    </Alert>
                )}
                
                {game.turnState === 'round_over' && game.status === 'ongoing' && (
                    <div className="w-full space-y-2 text-center pt-2">
                        <p className="text-sm text-muted-foreground">Starting next round...</p>
                        <Progress value={progress} className="w-full" />
                    </div>
                )}
            </CardFooter>
        </Card>
      )}
    </div>
  );
}
