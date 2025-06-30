
'use client';
import { useState } from 'react';
import { RallyGame, User } from '@/lib/types';
import { playRallyTurnAction } from '@/lib/actions';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Swords, Shield, Zap } from 'lucide-react';
import { UserAvatar } from '../user-avatar';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface RallyGameViewProps {
  game: RallyGame;
  currentUser: User;
}

const riskIcons = {
  low: Shield,
  medium: Swords,
  high: Zap,
};

export function RallyGameView({ game, currentUser }: RallyGameViewProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const opponentId = game.participantIds.find(id => id !== currentUser.uid)!;
  const opponent = game.participantsData[opponentId];
  const isMyTurn = game.currentPlayerId === currentUser.uid;
  const lastPoint = game.pointHistory[game.pointHistory.length - 1];

  const handleAction = async (choice: any) => {
    setIsProcessing(true);
    const result = await playRallyTurnAction(game.id, choice, currentUser.uid);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    // Let onSnapshot handle the state update
    setIsProcessing(false);
  };

  const options = game.turn === 'serving' ? game.currentPoint.serveOptions : game.currentPoint.returnOptions;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Rally Game"
        description={`A turn-based Tennis point simulator vs ${opponent.name}.`}
      />
      
      {/* Scoreboard */}
      <div className="flex justify-center gap-8 items-center mb-8">
        <div className="flex flex-col items-center gap-2">
          <UserAvatar user={currentUser} className="h-16 w-16" />
          <p className="font-bold text-4xl">{game.score[currentUser.uid]}</p>
        </div>
        <p className="text-4xl font-bold text-muted-foreground">-</p>
         <div className="flex flex-col items-center gap-2">
          <UserAvatar user={{...opponent, uid: opponentId}} className="h-16 w-16" />
          <p className="font-bold text-4xl">{game.score[opponentId]}</p>
        </div>
      </div>
      
      {/* Game State */}
      <Card>
        <CardHeader>
          <CardTitle>
            {game.status === 'complete' ? 'Game Over!' : `Point ${game.pointHistory.length + 1}`}
          </CardTitle>
          <CardDescription>
            {isMyTurn ? "It's your turn to act." : `Waiting for ${opponent.name}...`}
          </CardDescription>
        </CardHeader>
        <CardContent>
            {game.turn === 'point_over' && lastPoint && (
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <p className="font-bold text-lg">{lastPoint.winner === currentUser.uid ? 'You won the point!' : `${game.participantsData[lastPoint.winner]?.name} won the point!`}</p>
                    <p className="text-muted-foreground italic mt-2">"{lastPoint.narrative}"</p>
                    {isMyTurn && <Button className="mt-4" onClick={() => handleAction(null)}>Start Next Point</Button>}
                </div>
            )}
             {game.turn !== 'point_over' && game.turn !== 'game_over' && (
                <div className="space-y-4">
                    <p className="font-semibold text-center">{game.turn === 'serving' ? 'Choose your serve:' : 'Choose your return:'}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {options?.map((option, idx) => {
                            const RiskIcon = 'risk' in option ? riskIcons[option.risk as 'low'|'medium'|'high'] : Swords;
                            return (
                                <Button
                                    key={idx}
                                    variant="outline"
                                    className="h-auto p-4 flex flex-col gap-2 items-start text-left"
                                    disabled={!isMyTurn || isProcessing}
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
                </div>
            )}
        </CardContent>
        <CardFooter>
            {game.status === 'complete' && (
                <div className="text-center w-full">
                    <p className="text-xl font-bold">{game.winnerId === currentUser.uid ? '🎉 You are the winner! 🎉' : `Better luck next time! ${opponent.name} won.`}</p>
                </div>
            )}
        </CardFooter>
      </Card>

    </div>
  );
}
