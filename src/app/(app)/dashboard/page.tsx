
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSport } from '@/components/providers/sport-provider';
import { Button } from '@/components/ui/button';
import { Bot, BarChart, History, Plus, Users, Swords, Trophy, Activity, Flame, ChevronRight, Gamepad2, BrainCircuit } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { EloChart } from '@/components/dashboard/elo-chart';
import { RecentMatches } from '@/components/dashboard/recent-matches';
import { MatchPredictorDialog } from '@/components/ai/match-predictor-dialog';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getMatchHistoryAction } from '@/lib/actions';
import { Match, Sport } from '@/lib/types';
import { UserAvatar } from '@/components/user-avatar';
import { SPORT_ICONS } from '@/lib/constants';

const ActionButton = ({ href, children, icon: Icon, onClick }: { href?: string, children: React.ReactNode, icon: React.ElementType, onClick?: () => void }) => {
    const content = (
        <div className="flex h-full flex-col items-center justify-center text-center p-4">
            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                <Icon className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold">{children}</h3>
        </div>
    );

    const className = "rounded-xl bg-card hover:bg-muted border transition-all hover:border-primary/50 h-full";

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

const WelcomeBanner = ({ user, sport }: { user: any, sport: Sport}) => (
  <div className="rounded-xl bg-gradient-to-r from-primary/80 to-primary p-6 md:p-8 text-primary-foreground">
    <div className="flex justify-between items-start">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold">Welcome, {user.name.split(' ')[0]}!</h1>
             <p className="mt-1 text-primary-foreground/80">
                Ready to conquer the court? Here's your <span className="font-semibold inline-flex items-center gap-1.5">{sport} <Image src={SPORT_ICONS[sport]} alt={sport} width={20} height={20} unoptimized/></span> dashboard.
            </p>
        </div>
        <UserAvatar user={user} className="h-12 w-12 md:h-16 md:w-16 border-2 border-primary-foreground/50" />
    </div>
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

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="grid gap-6">
        <WelcomeBanner user={user} sport={sport} />
        
         <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ActionButton icon={Plus} href="/report-match">Report Match</ActionButton>
                    <ActionButton icon={Users} href="/friends">Find Players</ActionButton>
                    <ActionButton icon={Swords} href="/challenges">Challenges</ActionButton>
                    <ActionButton icon={Trophy} href="/tournaments">Tournaments</ActionButton>
                    <ActionButton icon={Gamepad2} href="/games">AI Games</ActionButton>
                    <ActionButton icon={Bot} href="/coach">AI Coach</ActionButton>
                    <ActionButton icon={History} href="/match-history">Match History</ActionButton>
                    <MatchPredictorDialog><ActionButton icon={BrainCircuit}>AI Predictor</ActionButton></MatchPredictorDialog>
                </div>
            </CardContent>
        </Card>

        <div>
            {sportStats ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatsCard title="RacktRank" value={sportStats.racktRank} icon={Flame} />
                    <StatsCard title="Win Rate" value={`${winRate}%`} icon={Trophy} progress={winRate} />
                    <StatsCard title="Win Streak" value={sportStats.streak} icon={Activity} />
                    <StatsCard title="Total Wins" value={sportStats.wins} icon={BarChart} />
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
            <EloChart data={[]} />
          </div>
          <div className="lg:col-span-1">
            <RecentMatches matches={recentMatches} currentUserId={user.uid} isLoading={isLoadingMatches} />
          </div>
        </div>
      </div>
    </div>
  );
}
