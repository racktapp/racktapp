'use client';
import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/hooks/use-auth';
import { useSport } from '@/components/providers/sport-provider';
import { Button } from '@/components/ui/button';
import { Bot, BarChart, History, Plus, Users, Swords } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { EloChart } from '@/components/dashboard/elo-chart';
import { RecentMatches } from '@/components/dashboard/recent-matches';
import { MatchPredictorDialog } from '@/components/ai/match-predictor-dialog';
import { MOCK_ELO_HISTORY } from '@/lib/mock-data';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMatchHistoryAction } from '@/lib/actions';
import { Match } from '@/lib/types';

const ActionButton = ({ href, children, icon: Icon, onClick }: { href?: string, children: React.ReactNode, icon: React.ElementType, onClick?: () => void }) => {
    const content = (
        <>
            <div className="bg-primary/10 p-3 rounded-full">
                <Icon className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-medium">{children}</span>
        </>
    );

    const className = "flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-center h-full";

    if (href) {
        return (
            <Link href={href} className={className}>
                {content}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={className}>
            {content}
        </button>
    )
};


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
        setRecentMatches(result.data.slice(0, 5));
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
    ? `${Math.round((sportStats.wins / (sportStats.wins + sportStats.losses)) * 100)}%`
    : 'N/A';

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title={`Welcome, ${user.name.split(' ')[0]}!`}
        description={`Here's your ${sport} dashboard.`}
        actions={
            <Button asChild variant="outline">
              <Link href="/match-history">
                <History className="mr-2 h-4 w-4" />
                View History
              </Link>
            </Button>
        }
      />
      <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ActionButton icon={Plus} href="/report-match">Report Match</ActionButton>
                
                <MatchPredictorDialog>
                    <ActionButton icon={Bot}>AI Predictor</ActionButton>
                </MatchPredictorDialog>
                
                <ActionButton icon={Users} href="/friends">Find Players</ActionButton>
                
                <ActionButton icon={Swords} href="/challenges">Challenges</ActionButton>
            </CardContent>
        </Card>

        <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">{sport} Stats</h2>
            {sportStats ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <StatsCard title="RacktRank" value={sportStats.racktRank} icon={BarChart} />
                    <StatsCard title="Win Rate" value={winRate} icon={BarChart} />
                    <StatsCard title="Wins" value={sportStats.wins} icon={BarChart} />
                    <StatsCard title="Streak" value={sportStats.streak} icon={BarChart} />
                </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No stats for {sport} yet. Report a match to get started!</p>
                </CardContent>
              </Card>
            )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EloChart data={MOCK_ELO_HISTORY} />
          </div>
          <div className="lg:col-span-1">
            <RecentMatches matches={recentMatches} currentUserId={user.uid} isLoading={isLoadingMatches} />
          </div>
        </div>
      </div>
    </div>
  );
}
