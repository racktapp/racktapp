
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSport } from '@/components/providers/sport-provider';
import { Bot, BarChart, History, Plus, Users, Swords, Trophy, Activity, Flame, ChevronRight, Gamepad2, BrainCircuit } from 'lucide-react';
import { EloChart } from '@/components/dashboard/elo-chart';
import { RecentMatches } from '@/components/dashboard/recent-matches';
import { MatchPredictorDialog } from '@/components/ai/match-predictor-dialog';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { getMatchHistoryAction } from '@/lib/actions';
import { Match } from '@/lib/types';
import { UserAvatar } from '@/components/user-avatar';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';


const ActionCard = ({ icon: Icon, title, description, ...props }: { icon: React.ElementType, title: string, description: string, [key:string]: any }) => (
  <Link href={props.href} className="block group" {...props}>
    <Card className="h-full transition-all duration-300 ease-in-out group-hover:border-primary/50 group-hover:bg-muted/50 group-hover:shadow-lg group-hover:-translate-y-1">
      <CardContent className="p-4 flex flex-col items-center text-center">
        <div className="bg-primary/10 p-3 rounded-full text-primary mb-3">
          <Icon className="h-8 w-8" />
        </div>
        <CardTitle className="text-base font-bold">{title}</CardTitle>
        <CardDescription className="text-xs mt-1 px-2">{description}</CardDescription>
      </CardContent>
    </Card>
  </Link>
);


const StatItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex flex-col items-center gap-1 text-center">
        <Icon className="h-6 w-6 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
    </div>
);


export default function DashboardPage() {
  const { user } = useAuth();
  const { sport } = useSport();
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);

  const fetchRecentMatches = useCallback(async () => {
    if (!user) return;
    setIsLoadingMatches(true);
    try {
      const result = await getMatchHistoryAction(user.uid);
      if (result.success) {
        setRecentMatches(result.data.confirmed.slice(0, 5));
      } else {
        console.error("Failed to fetch recent matches:", result.error);
        setRecentMatches([]);
      }
    } catch (error) {
      console.error("Failed to fetch recent matches:", error);
      setRecentMatches([]);
    } finally {
      setIsLoadingMatches(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecentMatches();
  }, [fetchRecentMatches]);

  if (!user) return null;

  const sportStats = user.sports?.[sport];
  const winRate = sportStats && (sportStats.wins + sportStats.losses) > 0
    ? Math.round((sportStats.wins / (sportStats.wins + sportStats.losses)) * 100)
    : 0;

  const eloHistoryData = useMemo(() => {
    if (!sportStats?.eloHistory) return [];
    // Ensure the data is sorted by date before passing to the chart
    return [...sportStats.eloHistory]
      .sort((a, b) => a.date - b.date)
      .map(item => ({
        date: format(new Date(item.date), 'MMM d'),
        elo: item.elo
      }));
  }, [sportStats]);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <Link href="/profile" className="block group">
            <Card className="overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-primary/20 group-hover:shadow-lg group-hover:-translate-y-1 bg-gradient-to-br from-card via-card to-muted/40">
                <div className="p-4 flex flex-col sm:flex-row items-center gap-4 bg-transparent">
                    <UserAvatar user={user} className="h-20 w-20" />
                    <div className="text-center sm:text-left">
                        <h1 className="text-2xl font-bold">Welcome, {user.name.split(' ')[0]}!</h1>
                        <p className="mt-1 text-muted-foreground">
                            Your <span className="font-semibold text-primary">{sport}</span> dashboard.
                        </p>
                    </div>
                </div>
                {sportStats ? (
                    <CardContent className="p-4 pt-0 sm:pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-transparent">
                        <StatItem icon={Flame} label="RacktRank" value={sportStats.racktRank} />
                        <StatItem icon={Trophy} label="Win Rate" value={`${winRate}%`} />
                        <StatItem icon={Activity} label="Streak" value={sportStats.streak} />
                        <StatItem icon={BarChart} label="Record" value={`${sportStats.wins}W - ${sportStats.losses}L`} />
                    </CardContent>
                ) : (
                    <CardContent className="p-4 text-center text-muted-foreground bg-transparent">
                        No stats for {sport} yet. Report a match to get started!
                    </CardContent>
                )}
            </Card>
        </Link>
        

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Get in the Game</CardTitle>
                        <CardDescription>Ready to play? Start here.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <ActionCard href="/report-match" icon={Plus} title="Report Match" description="Log a new match result." />
                        <ActionCard href="/challenges" icon={Swords} title="Challenges" description="View or issue challenges." />
                        <ActionCard href="/tournaments" icon={Trophy} title="Tournaments" description="Compete in brackets." />
                        <ActionCard href="/games" icon={Gamepad2} title="AI Games" description="Test your skills." />
                    </CardContent>
                </Card>

                <EloChart data={eloHistoryData} />
            </div>

            <div className="lg:col-span-1 space-y-6">
                <Card className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <BrainCircuit className="h-8 w-8" />
                            <CardTitle>AI Match Predictor</CardTitle>
                        </div>
                        <CardDescription className="text-primary-foreground/80">Get AI-powered predictions for matches against your friends.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                         <MatchPredictorDialog>
                            <Button variant="secondary" className="w-full">
                                Launch Predictor <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </MatchPredictorDialog>
                    </CardFooter>
                </Card>

                <RecentMatches matches={recentMatches} currentUserId={user.uid} isLoading={isLoadingMatches} />
            </div>
        </div>
    </div>
  );
}
