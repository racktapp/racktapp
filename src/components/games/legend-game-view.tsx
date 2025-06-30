
'use client';
import { useState } from 'react';
import { LegendGame, User } from '@/lib/types';
import { submitLegendAnswerAction } from '@/lib/actions';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { UserAvatar } from '../user-avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface LegendGameViewProps {
  game: LegendGame;
  currentUser: User;
}

export function LegendGameView({ game, currentUser }: LegendGameViewProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const opponentId = game.participantIds.find(id => id !== currentUser.uid);
  const opponent = opponentId ? game.participantsData[opponentId] : null;
  const isMyTurn = game.mode === 'solo' || game.turn === currentUser.uid;
  const myGuess = game.currentRound.guesses[currentUser.uid];
  const opponentGuess = opponentId ? game.currentRound.guesses[opponentId] : null;
  const roundOver = game.mode === 'solo' ? !!myGuess : !!myGuess && !!opponentGuess;
  
  const handleAnswerSubmit = async (answer: string) => {
    setSelectedAnswer(answer);
    setIsProcessing(true);
    const result = await submitLegendAnswerAction(game.id, answer, currentUser.uid);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    // No need to set state here, onSnapshot will handle it.
    setIsProcessing(false);
  };
  
  const getButtonState = (option: string) => {
    if (!myGuess) return 'default'; // Not answered yet
    if (option === game.currentRound.correctAnswer) return 'correct';
    if (option === myGuess) return 'incorrect';
    return 'disabled';
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Guess the Legend"
        description={game.mode === 'solo' ? `A solo ${game.sport} trivia challenge.` : `A ${game.sport} trivia challenge vs ${opponent?.name}.`}
      />

      {/* Scoreboard */}
      <div className="flex justify-center gap-8 items-center mb-8">
        <div className="flex flex-col items-center gap-2">
          <UserAvatar user={currentUser} className="h-16 w-16" />
          <p className="font-bold text-2xl">{game.score[currentUser.uid]}</p>
        </div>
        <p className="text-4xl font-bold text-muted-foreground">vs</p>
         <div className="flex flex-col items-center gap-2">
            {opponent ? (
                <>
                    <UserAvatar user={opponent as User} className="h-16 w-16" />
                    <p className="font-bold text-2xl">{game.score[opponentId!]}</p>
                </>
            ) : (
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted">
                    <p className="text-2xl font-bold">AI</p>
                </div>
            )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Who am I?</CardTitle>
          <CardDescription className="text-lg italic pt-2">"{game.currentRound.clue}"</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {game.currentRound.options.map(option => (
                <Button
                    key={option}
                    variant={myGuess ? 'outline' : 'default'}
                    className={cn("h-auto py-4 text-base justify-start", {
                        "bg-green-500/10 border-green-500 text-green-700 hover:bg-green-500/20": getButtonState(option) === 'correct',
                        "bg-red-500/10 border-red-500 text-red-700 hover:bg-red-500/20": getButtonState(option) === 'incorrect',
                        "bg-muted/50": getButtonState(option) === 'disabled',
                    })}
                    disabled={!isMyTurn || isProcessing || !!myGuess}
                    onClick={() => handleAnswerSubmit(option)}
                >
                    {isProcessing && selectedAnswer === option && <LoadingSpinner className="mr-2 h-4 w-4" />}
                    {getButtonState(option) === 'correct' && <CheckCircle className="mr-2 h-4 w-4" />}
                    {getButtonState(option) === 'incorrect' && <XCircle className="mr-2 h-4 w-4" />}
                    {option}
                </Button>
            ))}
        </CardContent>
        <CardFooter>
            {!myGuess && !isMyTurn && <p className="text-muted-foreground">Waiting for {opponent?.name} to play...</p>}
            {roundOver && (
                <div className="bg-muted/50 p-4 rounded-lg w-full">
                    <h3 className="font-bold">The answer is: {game.currentRound.correctAnswer}</h3>
                    <p className="text-muted-foreground italic mt-1">{game.currentRound.justification}</p>
                </div>
            )}
        </CardFooter>
      </Card>
       {game.status === 'complete' && (
           <div className="mt-8 text-center">
                <h2 className="text-2xl font-bold">{game.winnerId === currentUser.uid ? 'You Win!' : 'You Lost!'}</h2>
                <p>Final Score: {game.score[currentUser.uid]} - {game.score[opponentId!]}</p>
           </div>
       )}
    </div>
  );
}
