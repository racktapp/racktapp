
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSport } from '@/components/providers/sport-provider';
import { Bot, BarChart, History, Plus, Users, Swords, Trophy, Activity, Flame, ChevronRight, Gamepad2, BrainCircuit } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { EloChart } from '@/components/dashboard/elo-chart';
import { RecentMatches } from '@/components/dashboard/recent-matches';
import { MatchPredictorDialog } from '@/components/ai/match-predictor-dialog';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getMatchHistoryAction } from '@/lib/actions';
import { Match, Sport } from '@/lib/types';
import { UserAvatar } from '@/components/user-avatar';
import { format } from 'date-fns';


const ActionCard = ({ icon: Icon, title, description, href, ...props }: { icon: React.ElementType, title: string, description: string, href: string, [key:string]: any }) => (
  <Link href={href} className="block group" {...props}>
    <Card className="h-full transition-all duration-200 group-hover:border-primary group-hover:-translate-y-1">
      <CardHeader className="flex-row items-center gap-4 p-4">
        <div className="bg-primary/10 p-3 rounded-lg text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  </Link>
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

  const statCards = [
    { title: "RacktRank", value: sportStats?.racktRank ?? 'N/A', icon: Flame },
    { title: "Win Rate", value: `${winRate}%`, icon: Trophy },
    { title: "Win Streak", value: sportStats?.streak ?? 0, icon: Activity },
    { title: "Total Wins", value: sportStats?.wins ?? 0, icon: BarChart },
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <Card>
            <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Welcome, {user.name.split(' ')[0]}!</h1>
                    <p className="mt-1 text-muted-foreground">
                        Here's your <span className="font-semibold text-primary">{sport}</span> dashboard.
                    </p>
                </div>
                 <Link href="/profile" className="block">
                    <UserAvatar user={user} className="h-16 w-16" />
                </Link>
            </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
                {sportStats ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {statCards.map((card, i) => (
                            <StatsCard
                                key={card.title}
                                title={card.title}
                                value={card.value}
                                icon={card.icon}
                                className="opacity-0 animate-fade-in-slide-up"
                                style={{ animationDelay: `${i * 100}ms` }}
                            />
                        ))}
                    </div>
                ) : (
                <Card>
                    <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">No stats for {sport} yet. Report a match to get started!</p>
                    </CardContent>
                </Card>
                )}
                <EloChart data={eloHistoryData} />
            </div>
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Play</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ActionCard icon={Plus} title="Report Match" description="Log a completed game." href="/report-match" />
                        <ActionCard icon={Swords} title="Challenges" description="Accept or post challenges." href="/challenges" />
                        <ActionCard icon={Gamepad2} title="AI Games" description="Test your skills." href="/games" />
                         <MatchPredictorDialog>
                            <div className="block group cursor-pointer">
                                <Card className="h-full transition-all duration-200 group-hover:border-primary group-hover:-translate-y-1">
                                    <CardHeader className="flex-row items-center gap-4 p-4">
                                        <div className="bg-primary/10 p-3 rounded-lg text-primary">
                                        <BrainCircuit className="h-6 w-6" />
                                        </div>
                                        <div>
                                        <CardTitle className="text-base">AI Predictor</CardTitle>
                                        <CardDescription>Get AI-powered match predictions.</CardDescription>
                                        </div>
                                    </CardHeader>
                                </Card>
                            </div>
                        </MatchPredictorDialog>
                    </CardContent>
                </Card>

                <RecentMatches matches={recentMatches} currentUserId={user.uid} isLoading={isLoadingMatches} />
            </div>
        </div>
    </div>
  );
}
