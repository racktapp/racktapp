
'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { ActiveGamesList } from '@/components/games/active-games-list';
import { StartLegendSoloDialog } from '@/components/games/start-legend-solo-dialog';
import { Gamepad2, Brain, Swords, ArrowRight, Users } from 'lucide-react';
import { StartRallyFriendDialog } from '@/components/games/start-rally-friend-dialog';
import { Badge } from '@/components/ui/badge';
import { StartLegendFriendDialog } from '@/components/games/start-legend-friend-dialog';

export default function GamesPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="AI Games"
        description="Challenge your friends or test your skills against AI-powered minigames."
      />
      <div className="grid gap-8">
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="flex flex-col group overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                            <Swords className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <span>Rally Game</span>
                                <Badge variant="outline">Beta</Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">A turn-based tennis point simulator. Outsmart your opponent with tactical shot choices.</CardDescription>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="mt-auto bg-muted/50 px-6 py-4">
                     <StartRallyFriendDialog>
                        <Button>
                            Challenge a Friend
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </StartRallyFriendDialog>
                </CardFooter>
            </Card>
             <Card className="flex flex-col group overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                            <Brain className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <span>Guess the Legend</span>
                                <Badge variant="outline">Beta</Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">Test your sports trivia knowledge against friends with AI-generated questions.</CardDescription>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="mt-auto bg-muted/50 px-6 py-4 flex items-center gap-2">
                    <StartLegendSoloDialog>
                        <Button>
                            Play Solo
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </StartLegendSoloDialog>
                    <StartLegendFriendDialog>
                        <Button variant="secondary">
                            Challenge Friend
                            <Users className="ml-2 h-4 w-4" />
                        </Button>
                    </StartLegendFriendDialog>
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
