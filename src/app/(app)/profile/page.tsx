'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { Settings, BarChart, Activity, Flame, MessageSquare, Swords, Trophy, Users, Undo2, type LucideIcon, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { User, Match, Sport, Achievement } from '@/lib/types';
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
import { Separator } from '@/components/ui/separator';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

type ProfileData = Awaited<ReturnType<typeof getProfilePageDataAction>>;

const achievementIconMap: Record<string, LucideIcon> = {
    Swords, Flame, Trophy, Users, Undo2
};

const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
    const Icon = achievementIconMap[achievement.icon] || Trophy;

    return (
        <div className="flex items-center gap-4 rounded-lg border p-4 bg-card">
            <div className="bg-yellow-500/10 text-yellow-500 p-3 rounded-full">
                <Icon className="h-6 w-6" />
            </div>
            <div>
                <p className="font-semibold">{achievement.name}</p>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
                <p className="text-xs text-muted-foreground mt-1">Earned on {format(new Date(achievement.date), 'MMM d, yyyy')}</p>
            </div>
        </div>
    )
}

function ProfileView({ id }: { id: string }) {
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
        const data = await getProfilePageDataAction(id!, authUser?.uid ?? null, sport);
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
    achievements,
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
        achievements: [],
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
        date: item.date,
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
      achievements: profileData.achievements || [],
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
  
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
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
                <h1 className="text-2xl font-bold">@{profileUser.username}</h1>
                {isOwnProfile && <p className="text-muted-foreground">{profileUser.email}</p>}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {isOwnProfile ? (
                  <>
                    <Button asChild>
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" /> Edit Profile
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" /> Log Out
                    </Button>
                  </>
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
          
          {headToHead && !isOwnProfile && (
            <Card>
              <CardHeader>
                  <CardTitle>Head-to-Head Rivalry</CardTitle>
                  <CardDescription>Your record vs. @{profileUser.username} in {sport}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                          <p className="text-3xl font-bold">{headToHead.currentUserWins}</p>
                          <p className="text-sm text-muted-foreground">Your Wins</p>
                      </div>
                      <div>
                          <p className="text-3xl font-bold">{headToHead.profileUserWins}</p>
                          <p className="text-sm text-muted-foreground">Their Wins</p>
                      </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                          <p className="text-3xl font-bold">{headToHead.currentUserLongestStreak}</p>
                          <p className="text-sm text-muted-foreground">Your Longest Streak</p>
                      </div>
                      <div>
                          <p className="text-3xl font-bold">{headToHead.profileUserLongestStreak}</p>
                          <p className="text-sm text-muted-foreground">Their Longest Streak</p>
                      </div>
                  </div>
                  <div className="text-center text-xs text-muted-foreground pt-2">
                      Based on {headToHead.totalMatches} match(es).
                  </div>
              </CardContent>
            </Card>
          )}

        </div>

        <div className="lg:col-span-2 space-y-6">
          <PageHeader
            title={`${isOwnProfile ? 'Your' : `@${profileUser.username}'s`} ${sport} Stats`}
            description="An overview of their performance."
          />
          {sportStats ? (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <StatsCard title="RacktRank" value={sportStats.racktRank} icon={Flame} />
                    <StatsCard title="Win Rate" value={`${winRate}%`} icon={Trophy} />
                    <StatsCard title="Win Streak" value={sportStats.streak} icon={Activity} />
                    <StatsCard title="Total Wins" value={sportStats.wins} icon={BarChart} />
                </div>
                <EloChart data={eloHistoryData} />
            </>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">@{profileUser.username} hasn't played any {sport} matches yet.</p>
            </div>
          )}
        </div>
      </div>
      
      {achievements && achievements.length > 0 && !isOwnProfile && (
        <div className="mt-6">
            <h2 className="text-2xl font-bold tracking-tight mb-4">Rivalry Trophies</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((ach, i) => (
                    <AchievementCard key={ach.id} achievement={ach} />
                ))}
            </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Recent Match History</h2>
        {recentMatches && recentMatches.length > 0 && authUser ? (
            <div className="space-y-4">
                {recentMatches.map((match, i) => (
                    <MatchHistoryCard 
                      key={match.id} 
                      match={match} 
                      currentUserId={profileUser.uid} 
                      className="opacity-0 animate-fade-in-slide-up"
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
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

function ProfilePageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    } else if (!loading && user && !id) {
      router.replace(`/profile?id=${user.uid}`);
    }
  }, [user, loading, id, router]);

  if (loading || (!user && !id) || (!id && user)) {
    return <div className="flex h-full w-full items-center justify-center"><LoadingSpinner className="h-8 w-8" /></div>;
  }
  
  if (!id) {
     return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <PageHeader title="Profile Not Found" description="No profile ID was provided."/>
      </div>
    );
  }

  return <ProfileView id={id} />;
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><LoadingSpinner className="h-8 w-8" /></div>}>
            <ProfilePageContent />
        </Suspense>
    )
}
