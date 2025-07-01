
'use client';
import { useState } from 'react';
import { LegendGame, User } from '@/lib/types';
import { submitLegendAnswerAction, startNextLegendRoundAction } from '@/lib/actions';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ArrowRight, Trophy } from 'lucide-react';
import { UserAvatar } from '../user-avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '../ui/skeleton';

interface LegendGameViewProps {
  game: LegendGame;
  currentUser: User;
}

const GameSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-5 w-full mt-2" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
        </CardContent>
    </Card>
)

export function LegendGameView({ game, currentUser }: LegendGameViewProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Safeguard against incomplete game data. If the game is initializing, or the
  // current round or its options aren't loaded, display a loading/error state.
  if (
    game.status === 'initializing' ||
    !game.currentRound ||
    !game.currentRound.options ||
    game.currentRound.options.length === 0
  ) {
    let title = "Guess the Legend";
    let description = "Generating the first round...";

    if (game.error) {
        title = "Could not load game";
        description = `Failed to generate game round. ${game.error}`;
    } else if (game.status !== 'initializing') {
        title = "Could not load game";
        description = "There was a problem loading the current round data.";
    }

    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <PageHeader title={title} description={description} />
        {title === "Guess the Legend" && <GameSkeleton />}
      </div>
    );
  }
  
  const currentRound = game.currentRound;
  const opponentId = game.participantIds.find(id => id !== currentUser.uid);
  const opponent = opponentId ? game.participantsData[opponentId] : null;
  const isMyTurn = game.currentPlayerId === currentUser.uid;
  const myGuess = currentRound.guesses?.[currentUser.uid];
  const opponentGuess = opponentId ? currentRound.guesses?.[opponentId] : null;

  const handleAnswerSubmit = async (answer: string) => {
    setSelectedAnswer(answer);
    setIsProcessing(true);
    const result = await submitLegendAnswerAction(game.id, answer, currentUser.uid);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
      setIsProcessing(false); 
      setSelectedAnswer(null);
    }
     // Let onSnapshot handle UI updates, which will implicitly set isProcessing to false.
  };

  const handleNextRound = async () => {
    setIsProcessing(true);
    const result = await startNextLegendRoundAction(game.id, currentUser.uid);
    if (!result.success) {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
        setIsProcessing(false);
    }
    // onSnapshot will handle UI update and set isProcessing to false implicitly
  };
  
  const getButtonState = (option: string) => {
    if (!myGuess) return 'default'; // Not answered yet
    if (option === currentRound.correctAnswer) return 'correct';
    if (option === myGuess) return 'incorrect';
    return 'disabled';
  };

  const getOpponentGuessState = (option: string) => {
    if (!opponentGuess) return 'none';
    if (option === opponentGuess) {
        return opponentGuess === currentRound.correctAnswer ? 'correct' : 'incorrect';
    }
    return 'none';
  }
  
  const opponentName = opponent ? (opponent.name || 'Opponent') : 'Opponent';

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
        <Alert className="mt-8 text-center">
            <Trophy className="mx-auto h-6 w-6" />
            <AlertTitle className="text-2xl font-bold mt-2">
                {titleText}
            </AlertTitle>
            <AlertDescription>
                Final Score: {finalScore}
            </AlertDescription>
        </Alert>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Guess the Legend"
        description={game.mode === 'solo' ? `A solo ${game.sport} trivia challenge.` : `A ${game.sport} trivia challenge vs ${opponentName}.`}
      />

      {/* Scoreboard */}
      <Card className="mb-8">
        <CardContent className="p-4 flex justify-around items-center">
            <div className="flex flex-col items-center gap-2">
                <UserAvatar user={currentUser} className="h-16 w-16" />
                <p className="font-bold text-2xl">{game.score[currentUser.uid]}</p>
            </div>
            {opponent && (
                <>
                    <p className="text-4xl font-bold text-muted-foreground">vs</p>
                    <div className="flex flex-col items-center gap-2">
                        <UserAvatar user={opponent} className="h-16 w-16" />
                        <p className="font-bold text-2xl">{game.score[opponentId!]}</p>
                    </div>
                </>
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
                            disabled={!isMyTurn || isProcessing || !!myGuess}
                            onClick={() => handleAnswerSubmit(option)}
                        >
                            <div className="flex items-center gap-2">
                                {isProcessing && selectedAnswer === option && <LoadingSpinner className="mr-2 h-4 w-4" />}
                                {myState === 'correct' && <CheckCircle className="mr-2 h-4 w-4" />}
                                {myState === 'incorrect' && <XCircle className="mr-2 h-4 w-4" />}
                                {option}
                            </div>
                            {opponent && oppState !== 'none' && (
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
                {!myGuess && !isMyTurn && <p className="text-muted-foreground w-full text-center">Waiting for {opponentName} to play...</p>}
                
                {game.turnState === 'round_over' && (
                    <Alert className="w-full">
                        <AlertTitle className="font-bold">Answer: {currentRound.correctAnswer}</AlertTitle>
                        <AlertDescription className="italic mt-1">{currentRound.justification}</AlertDescription>
                    </Alert>
                )}

                {game.turnState === 'round_over' && (
                    <Button onClick={handleNextRound} disabled={isProcessing} className="w-full">
                        {isProcessing ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                        Next Round
                    </Button>
                )}
            </CardFooter>
        </Card>
      )}
    </div>
  );
}

    