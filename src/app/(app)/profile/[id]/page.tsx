
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { Settings, BarChart, Trophy, Activity, Flame, MessageSquare, Swords } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { User, Match, Sport } from '@/lib/types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Link from 'next/link';
import { useSport } from '@/components/providers/sport-provider';
import { StatsCard } from '@/components/dashboard/stats-card';
import { FriendshipButton } from '@/components/profile/friendship-button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { getProfilePageDataAction, getOrCreateChatAction } from '@/lib/actions';
import { ChallengeFriendDialog } from '@/components/challenges/challenge-friend-dialog';
import { EloChart } from '@/components/dashboard/elo-chart';
import { MatchHistoryCard } from '@/components/match-history/match-history-card';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type ProfileData = Awaited<ReturnType<typeof getProfilePageDataAction>>;

export default function ProfilePage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : undefined;

  const { user: authUser, loading: authLoading } = useAuth();
  const { sport } = useSport();
  const router = useRouter();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingChat, setIsProcessingChat] = useState(false);

  useEffect(() => {
    if (!id || authLoading) return;

    async function fetchData() {
      setLoading(true);
      try {
        const data = await getProfilePageDataAction(id!, authUser?.uid, sport);
        setProfileData(data);
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
        setProfileData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, authUser, sport, authLoading]);

  const {
    profileUser,
    recentMatches,
    friendship,
    headToHead,
    sportStats,
    winRate,
    eloHistoryData,
  } = useMemo(() => {
    if (!profileData?.profileUser) {
      return {
        profileUser: null,
        recentMatches: [],
        friendship: null,
        headToHead: null,
        sportStats: null,
        winRate: 0,
        eloHistoryData: [],
      };
    }

    const sportStats = profileData.profileUser.sports?.[sport];
    const winRate =
      sportStats && sportStats.wins + sportStats.losses > 0
        ? Math.round(
            (sportStats.wins / (sportStats.wins + sportStats.losses)) * 100
          )
        : 0;

    const eloHistoryData = (sportStats?.eloHistory ?? [])
      .slice()
      .sort((a, b) => a.date - b.date)
      .map((item) => ({
        date: format(new Date(item.date), 'MMM d'),
        elo: item.elo,
      }));

    return {
      profileUser: profileData.profileUser,
      recentMatches: profileData.recentMatches,
      friendship: profileData.friendship,
      headToHead: profileData.headToHead,
      sportStats,
      winRate,
      eloHistoryData,
    };
  }, [profileData, sport]);


  const handleStartChat = async (friendId: string) => {
    if (!authUser) return;
    setIsProcessingChat(true);
    const result = await getOrCreateChatAction(friendId, authUser.uid);
    if (result.success && result.redirect) {
      router.push(result.redirect);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
      setIsProcessingChat(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="container mx-auto flex h-full w-full items-center justify-center p-4 md:p-6 lg:p-8">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <PageHeader title="Profile Not Found" description="This user does not exist." />
      </div>
    );
  }
  
  const isOwnProfile = authUser?.uid === profileUser.uid;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
              <UserAvatar user={profileUser} className="h-28 w-28" />
              <div>
                <h1 className="text-2xl font-bold">{profileUser.name}</h1>
                <p className="text-muted-foreground">@{profileUser.username}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {isOwnProfile ? (
                  <Button asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" /> Edit Profile
                    </Link>
                  </Button>
                ) : authUser ? (
                  <>
                    <FriendshipButton profileUser={profileUser} currentUser={authUser} />
                    {friendship?.status === 'friends' && (
                       <ChallengeFriendDialog fromUser={authUser} toUser={profileUser}>
                         <Button variant="secondary"><Swords className="mr-2 h-4 w-4" /> Challenge</Button>
                       </ChallengeFriendDialog>
                    )}
                     {friendship?.status === 'friends' && (
                        <Button variant="secondary" onClick={() => handleStartChat(profileUser.uid)} disabled={isProcessingChat}>
                            {isProcessingChat ? <LoadingSpinner className="mr-2" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                            Message
                        </Button>
                     )}
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
          
          {headToHead && (
            <Card>
                <CardHeader>
                    <CardTitle>Head-to-Head</CardTitle>
                    <CardDescription>Your record vs. {profileUser.name.split(' ')[0]} in {sport}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-around items-center">
                    <div className="text-center">
                        <p className="text-3xl font-bold">{headToHead.currentUserWins}</p>
                        <p className="text-sm text-muted-foreground">Your Wins</p>
                    </div>
                    <div className="text-2xl font-bold text-muted-foreground">-</div>
                    <div className="text-center">
                        <p className="text-3xl font-bold">{headToHead.profileUserWins}</p>
                        <p className="text-sm text-muted-foreground">Their Wins</p>
                    </div>
                </CardContent>
            </Card>
          )}

        </div>

        <div className="lg:col-span-2 space-y-6">
          <PageHeader
            title={`${profileUser.name.split(' ')[0]}'s ${sport} Stats`}
            description="An overview of their performance."
          />
          {sportStats ? (
            <div className="grid grid-cols-2 gap-4">
                <StatsCard title="RacktRank" value={sportStats.racktRank} icon={Flame} />
                <StatsCard title="Win Rate" value={`${winRate}%`} icon={Trophy} />
                <StatsCard title="Win Streak" value={sportStats.streak} icon={Activity} />
                <StatsCard title="Total Wins" value={sportStats.wins} icon={BarChart} />
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">{profileUser.name} hasn't played any {sport} matches yet.</p>
            </div>
          )}
           <EloChart data={eloHistoryData} />
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Recent Match History</h2>
        {recentMatches && recentMatches.length > 0 && authUser ? (
            <div className="space-y-4">
                {recentMatches.map(match => (
                    <MatchHistoryCard key={match.id} match={match} currentUserId={profileUser.uid} />
                ))}
            </div>
        ) : (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">No recent matches to display.</p>
                </CardContent>
            </Card>
        )}
      </div>

    </div>
  );
}


