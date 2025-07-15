

'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/hooks/use-auth';
import { useSport } from '@/components/providers/sport-provider';
import { getLeaderboardAction } from '@/lib/actions';
import { User, SportStats, Sport } from '@/lib/types';
import { Trophy, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/components/user-avatar';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Image from 'next/image';
import { SPORT_ICONS } from '@/lib/constants';


const getRankDisplay = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-5 w-5 text-orange-600" />;
    return <span className="font-semibold text-muted-foreground">{rank}</span>;
  };
  
const getStreakDisplay = (streak: number) => {
    if (streak > 0) return <span className="flex items-center gap-1 text-green-600"><ArrowUp className="h-4 w-4" /> {streak}</span>;
    if (streak < 0) return <span className="flex items-center gap-1 text-red-600"><ArrowDown className="h-4 w-4" /> {Math.abs(streak)}</span>;
    return <span className="flex items-center gap-1 text-muted-foreground"><Minus className="h-4 w-4" /> 0</span>;
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { sport } = useSport();
  const { toast } = useToast();

  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
        const users = await getLeaderboardAction(sport);
        setLeaderboard(users || []);
    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not load leaderboard. This may be due to a missing database index.'
        })
    }
    
    setIsLoading(false);
  }, [user, sport, toast]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const rankedUsers = useMemo(() => {
    return leaderboard
      .filter(player => player.sports?.[sport]) // Ensure player has stats for the sport
      .map((player, index) => {
        const sportStats = player.sports?.[sport] as SportStats;
        const totalGames = sportStats.wins + sportStats.losses;
        const winRate = totalGames > 0 ? (sportStats.wins / totalGames) * 100 : 0;
        return {
          ...player,
          rank: index + 1,
          sportStats,
          winRate,
        };
      });
  }, [leaderboard, sport]);

  if (!user) return null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      );
    }

    if (rankedUsers.length > 0) {
      return (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">RacktRank</TableHead>
                <TableHead className="text-center">Streak</TableHead>
                <TableHead className="text-center">Record</TableHead>
                <TableHead className="text-right">Win Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankedUsers.map((player) => (
                <TableRow key={player.uid} className={cn(player.uid === user.uid && 'bg-primary/10')}>
                  <TableCell className="text-center">{getRankDisplay(player.rank)}</TableCell>
                  <TableCell>
                    <Link href={`/profile/${player.uid}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <UserAvatar user={player} className="h-10 w-10" />
                      <div>
                        <p className="font-semibold">@{player.username}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-bold">{player.sportStats.racktRank}</TableCell>
                  <TableCell className="text-center">{getStreakDisplay(player.sportStats.streak)}</TableCell>
                  <TableCell className="text-center">{player.sportStats.wins} - {player.sportStats.losses}</TableCell>
                  <TableCell className="text-right">{player.winRate.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      );
    }

    return (
      <Card>
          <CardContent className="pt-6">
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
                  <Trophy className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">No players on the leaderboard for {sport} yet.</p>
                  <p className="text-sm text-muted-foreground">Report a match to get started!</p>
              </div>
          </CardContent>
      </Card>
    );
  };


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title={
            <div className="flex items-center gap-3">
                <span>{sport} Leaderboard</span>
                <Image src={SPORT_ICONS[sport as Sport]} alt={sport} width={32} height={32} unoptimized />
            </div>
        }
        description={`See how you stack up against the competition.`}
      />
      {renderContent()}
    </div>
  );
}
