'use client';
import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/hooks/use-auth';
import { useSport } from '@/components/providers/sport-provider';
import { Button } from '@/components/ui/button';
import { Bot, BarChart, History, Plus } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { EloChart } from '@/components/dashboard/elo-chart';
import { RecentMatches } from '@/components/dashboard/recent-matches';
import { MatchPredictorDialog } from '@/components/ai/match-predictor-dialog';
import { MOCK_USER, MOCK_MATCHES, MOCK_ELO_HISTORY } from '@/lib/mock-data';

export default function DashboardPage() {
  const { user } = useAuth();
  const { sport } = useSport();

  // In a real app, this data would be fetched based on the logged-in user and selected sport
  const currentUser = MOCK_USER;
  const sportStats = currentUser.sports?.[sport];

  if (!user) return null;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title={`Welcome, ${user.name.split(' ')[0]}!`}
        description={`Here's your ${sport} dashboard.`}
        actions={
          <>
            <Button variant="outline">
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
            <MatchPredictorDialog>
              <Button>
                <Bot className="mr-2 h-4 w-4" />
                AI Predictor
              </Button>
            </MatchPredictorDialog>
          </>
        }
      />
      <div className="grid gap-6">
        {sportStats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="RacktRank" value={sportStats.racktRank} icon={BarChart} />
                <StatsCard title="Win Rate" value={`${Math.round((sportStats.wins / (sportStats.wins + sportStats.losses)) * 100)}%`} icon={BarChart} />
                <StatsCard title="Wins" value={sportStats.wins} icon={BarChart} />
                <StatsCard title="Streak" value={sportStats.streak} icon={BarChart} />
            </div>
        )}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EloChart data={MOCK_ELO_HISTORY} />
          </div>
          <div className="lg:col-span-1">
            <RecentMatches matches={MOCK_MATCHES} currentUserId={user.uid} />
          </div>
        </div>
      </div>
    </div>
  );
}
