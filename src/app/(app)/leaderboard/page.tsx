
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/hooks/use-auth';
import { useSport } from '@/components/providers/sport-provider';
import { getLeaderboardAction, getFriendGroupsAction, getFriendsAction } from '@/lib/actions';
import { User, SportStats, Sport, FriendGroup } from '@/lib/types';
import { Trophy, ArrowUp, ArrowDown, Minus, UserPlus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/components/user-avatar';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Image from 'next/image';
import { SPORT_ICONS } from '@/lib/constants';
import { FirestoreIndexAlert } from '@/components/firestore-index-alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CreateFriendGroupDialog } from '@/components/leaderboard/create-friend-group-dialog';


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

const LeaderboardCard = ({ player, currentUserId }: { player: any; currentUserId: string }) => (
    <Link href={`/profile?id=${player.uid}`} className="block">
        <Card className={cn('transition-all hover:border-primary/50', player.uid === currentUserId && 'bg-primary/10 border-primary/20')}>
            <CardContent className="p-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="text-lg font-bold w-6 text-center">{getRankDisplay(player.rank)}</div>
                    <UserAvatar user={player} className="h-10 w-10" />
                    <div>
                        <p className="font-semibold">@{player.username}</p>
                        <p className="text-sm text-muted-foreground">{player.sportStats.wins}W - {player.sportStats.losses}L</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold">{player.sportStats.racktRank}</p>
                    <p className="text-xs text-muted-foreground">RacktRank</p>
                </div>
            </CardContent>
        </Card>
    </Link>
);


export default function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { sport } = useSport();
  const { toast } = useToast();

  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendGroups, setFriendGroups] = useState<FriendGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('global');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriendGroups = useCallback(async () => {
    if (!user) return;
    const groups = await getFriendGroupsAction(user.uid);
    setFriendGroups(groups);
  }, [user]);

  const fetchLeaderboardData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
        const groupMemberIds = selectedGroup === 'global' ? null : friendGroups.find(g => g.id === selectedGroup)?.memberIds;
        const users = await getLeaderboardAction(sport, 10, groupMemberIds);
        setLeaderboard(users || []);
    } catch (error: any) {
        setError(error.message || 'An unexpected error occurred.');
    }
    setIsLoading(false);
  }, [user, sport, selectedGroup, friendGroups]);
  
  useEffect(() => {
    if (user) {
        getFriendsAction(user.uid).then(setFriends);
        fetchFriendGroups();
    }
  }, [user, fetchFriendGroups]);

  useEffect(() => {
    if (!authLoading && user) {
        fetchLeaderboardData();
    }
  }, [fetchLeaderboardData, authLoading, user]);

  const pageDescription = useMemo(() => {
    if (selectedGroup === 'global') {
      return `The top 10 ranked ${sport} players in the world.`;
    }
    const group = friendGroups.find(g => g.id === selectedGroup);
    return group ? `Leaderboard for your group: ${group.name}` : 'See how you stack up against the competition.';
  }, [selectedGroup, friendGroups, sport]);


  const rankedUsers = useMemo(() => {
    return leaderboard
      .filter(player => player.sports?.[sport]) 
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

  if (authLoading) {
    return (
        <div className="flex h-64 items-center justify-center">
            <LoadingSpinner className="h-8 w-8" />
        </div>
    );
  }

  if (!user) return null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      );
    }

    if (error) {
        return <FirestoreIndexAlert message={error} />;
    }

    if (rankedUsers.length > 0) {
      return (
        <>
            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-3">
                {rankedUsers.map((player) => (
                    <LeaderboardCard key={player.uid} player={player} currentUserId={user.uid} />
                ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block">
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
                                <Link href={`/profile?id=${player.uid}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
            </div>
        </>
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
        title="Leaderboards"
        description={pageDescription}
        actions={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <CreateFriendGroupDialog
                    user={user}
                    friends={friends}
                    onGroupCreated={fetchFriendGroups}
                >
                    <Button variant="outline" className="w-full sm:w-auto">
                        <UserPlus className="mr-2" />
                        Create Group
                    </Button>
                </CreateFriendGroupDialog>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger className="w-full sm:w-auto sm:min-w-[180px]">
                        <SelectValue placeholder="Select leaderboard" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="global">Global Top 10</SelectItem>
                        {friendGroups.map(group => (
                            <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        }
      />
      {renderContent()}
    </div>
  );
}

