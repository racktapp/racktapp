
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSport } from '@/components/providers/sport-provider';
import { Plus, Swords, Trophy, Gamepad2, BrainCircuit, ChevronRight, BarChart, Target, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { getMatchHistoryAction } from '@/lib/actions';
import { Match, EloDataPoint } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { StatsHighlightCard } from '@/components/dashboard/stats-highlight-card';
import { RecentMatches } from '@/components/dashboard/recent-matches';
import { MatchPredictorDialog } from '@/components/ai/match-predictor-dialog';
import { EloChart } from '@/components/dashboard/elo-chart';
import { format } from 'date-fns';

const ActionCard = ({ icon: Icon, title, description, href }: { icon: React.ElementType, title: string, description: string, href: string }) => (
  <Link href={href} className="block group">
    <Card className="h-full transition-all duration-300 ease-in-out group-hover:border-primary/50 group-hover:bg-card/80 group-hover:shadow-lg group-hover:-translate-y-1">
      <CardContent className="p-4 flex flex-col items-center text-center">
        <div className="bg-primary/10 p-3 rounded-full text-primary mb-3">
          <Icon className="h-8 w-8" />
        </div>
        <p className="text-sm font-bold">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  </Link>
);

const getSkillLevel = (elo: number) => {
  if (elo < 1200) return "Beginner";
  if (elo < 1500) return "Intermediate";
  if (elo < 1800) return "Advanced";
  if (elo < 2100) return "Expert";
  return "Master";
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
        setRecentMatches(result.data.confirmed.slice(0, 5));
      } else {
        setRecentMatches([]);
      }
    } catch (error) {
      setRecentMatches([]);
    } finally {
      setIsLoadingMatches(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecentMatches();
  }, [fetchRecentMatches]);
  
  const sportStats = user?.sports?.[sport];

  const { winRate, totalMatches, skillLevel, currentElo, record, streak, eloHistoryData, monthlyEloChange } = useMemo(() => {
    if (!sportStats || !user) {
        return { winRate: 0, totalMatches: 0, skillLevel: 'N/A', currentElo: 1200, record: '0-0', streak: 0, eloHistoryData: [], monthlyEloChange: 0 };
    }
    const wr = (sportStats.wins + sportStats.losses) > 0
      ? Math.round((sportStats.wins / (sportStats.wins + sportStats.losses)) * 100)
      : 0;
    const tm = sportStats.wins + sportStats.losses;
    const ce = sportStats.racktRank;
    const sl = getSkillLevel(ce);
    const rec = `${sportStats.wins}W - ${sportStats.losses}L`;
    const str = sportStats.streak;
    
    const sortedEloHistory = [...(sportStats.eloHistory || [])]
      .sort((a, b) => a.date - b.date);

    const ehd = sortedEloHistory.map(item => ({ date: format(new Date(item.date), 'MMM d'), elo: item.elo }));

    // Calculate monthly ELO change
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    // Find the last ELO entry from *before* the start of this month.
    const lastMonthEntry = sortedEloHistory
      .filter(entry => entry.date < startOfMonth)
      .pop();
      
    // Default to 1200 if no history exists at all before this month.
    const startOfMonthElo = lastMonthEntry ? lastMonthEntry.elo : 1200;
    const mec = ce - startOfMonthElo;

    return { winRate: wr, totalMatches: tm, skillLevel: sl, currentElo: ce, record: rec, streak: str, eloHistoryData: ehd, monthlyEloChange: mec };
  }, [sportStats, user]);


  if (!user) return null;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.name.split(' ')[0]}!`}
        actions={
            <Button asChild variant="outline">
                <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    My Profile
                </Link>
            </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
          <StatsHighlightCard 
            title={`${sport} RacktRank`}
            value={currentElo}
            description={skillLevel}
            footerValue={monthlyEloChange}
            footerText={`${monthlyEloChange >= 0 ? `+${monthlyEloChange}` : monthlyEloChange} this month`}
            icon={Trophy}
            colorClass="bg-gradient-to-br from-blue-500 to-cyan-500"
          />
          <StatsHighlightCard 
            title="Win Rate"
            value={`${winRate}%`}
            description={record}
            footerValue={streak}
            footerText={`${Math.abs(streak)} ${streak >= 0 ? 'win' : 'loss'} streak`}
            icon={BarChart}
            colorClass="bg-gradient-to-br from-green-500 to-emerald-500"
          />
      </div>

      <Card id="tour-step-report-match">
          <CardHeader>
              <div className="flex items-center gap-3">
                  <Plus className="h-8 w-8 text-primary" />
                  <CardTitle>Report a Match</CardTitle>
              </div>
              <CardDescription>Log your latest result to update your RacktRank and stats.</CardDescription>
          </CardHeader>
          <CardFooter>
              <Button asChild className="w-full">
                <Link href="/report-match">
                  Log Result <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
          </CardFooter>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ActionCard href="/challenges" icon={Swords} title="Challenges" description="Find an opponent" />
                    <ActionCard href="/tournaments" icon={Trophy} title="Tournaments" description="Compete in brackets" />
                    <ActionCard href="/games" icon={Gamepad2} title="AI Games" description="Test your skills" />
                    <div className="group h-full">
                      <MatchPredictorDialog>
                          <Card className="h-full transition-all duration-300 ease-in-out group-hover:border-primary/50 group-hover:bg-card/80 group-hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                              <div className="bg-primary/10 p-3 rounded-full text-primary mb-3">
                                <BrainCircuit className="h-8 w-8" />
                              </div>
                              <p className="text-sm font-bold">Predictor</p>
                              <p className="text-xs text-muted-foreground mt-1">Get AI predictions</p>
                            </CardContent>
                          </Card>
                      </MatchPredictorDialog>
                    </div>
                </CardContent>
              </Card>

              <EloChart data={eloHistoryData} />
          </div>

          <div className="lg:col-span-1 space-y-6">
              <RecentMatches matches={recentMatches} currentUserId={user.uid} isLoading={isLoadingMatches} />
          </div>
      </div>
    </div>
  );
}
