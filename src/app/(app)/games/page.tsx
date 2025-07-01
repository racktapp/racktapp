
'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { ActiveGamesList } from '@/components/games/active-games-list';
import { StartLegendSoloDialog } from '@/components/games/start-legend-solo-dialog';
import { Gamepad2, Brain, Swords } from 'lucide-react';
import { StartRallyFriendDialog } from '@/components/games/start-rally-friend-dialog';
import { Badge } from '@/components/ui/badge';

export default function GamesPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Games"
        description="Challenge your friends to fun, AI-powered minigames."
      />
      <div className="grid gap-8">
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="flex flex-col">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                            <Swords className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <span>Rally Game</span>
                                <Badge variant="outline">Beta</Badge>
                            </CardTitle>
                            <CardDescription>A turn-based tennis point simulator. Outsmart your opponent!</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardFooter className="mt-auto flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Challenge a friend to a game.</p>
                    <StartRallyFriendDialog>
                        <Button variant="outline">Challenge Friend</Button>
                    </StartRallyFriendDialog>
                </CardFooter>
            </Card>
            <Card className="flex flex-col">
                <CardHeader>
                     <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                            <Brain className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <span>Guess the Legend</span>
                                <Badge variant="outline">Beta</Badge>
                            </CardTitle>
                            <CardDescription>Test your sports trivia knowledge against friends or the AI.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardFooter className="mt-auto flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Challenge friends or play solo.</p>
                    <StartLegendSoloDialog>
                        <Button variant="outline">Play Solo</Button>
                    </StartLegendSoloDialog>
                </CardFooter>
            </Card>
        </div>
        
        <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Your Active Games</h2>
            <ActiveGamesList currentUserId={user.uid} />
        </div>
      </div>
    </div>
  );
}
