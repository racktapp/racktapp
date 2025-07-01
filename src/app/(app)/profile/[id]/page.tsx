
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { Settings, BarChart, Trophy, Activity, Flame } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { User } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Link from 'next/link';
import { useSport } from '@/components/providers/sport-provider';
import { StatsCard } from '@/components/dashboard/stats-card';
import { FriendshipButton } from '@/components/profile/friendship-button';

export default function ProfilePage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : undefined;

  const { user: authUser, loading: authLoading } = useAuth();
  const { sport } = useSport();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    if (!id || authLoading) {
      return;
    }

    setLoading(true);
    const userRef = doc(db, 'users', id);

    const unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          setProfileUser(doc.data() as User);
        } else {
          console.error('User not found');
          setProfileUser(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching user profile:', error);
        setProfileUser(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id, authLoading]);

  useEffect(() => {
    if (authUser && profileUser) {
      setIsOwnProfile(authUser.uid === profileUser.uid);
    }
  }, [authUser, profileUser]);

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
  
  const sportStats = profileUser.sports?.[sport];
  const winRate = sportStats && (sportStats.wins + sportStats.losses) > 0
    ? Math.round((sportStats.wins / (sportStats.wins + sportStats.losses)) * 100)
    : 0;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <UserAvatar user={profileUser} className="h-20 w-20" />
          <div>
            <h1 className="text-2xl font-bold">{profileUser.name}</h1>
            <p className="text-muted-foreground">@{profileUser.username}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
           {isOwnProfile ? (
            <Button asChild variant="outline">
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          ) : authUser ? (
            <FriendshipButton profileUser={profileUser} currentUser={authUser} />
          ) : null}
        </div>
      </div>
      
      <PageHeader
        title={`${profileUser.name.split(' ')[0]}'s Stats`}
        description={`Viewing stats for ${sport}`}
      />
      
      {sportStats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="RacktRank" value={sportStats.racktRank} icon={Flame} />
            <StatsCard title="Win Rate" value={`${winRate}%`} icon={Trophy} progress={winRate} />
            <StatsCard title="Win Streak" value={sportStats.streak} icon={Activity} />
            <StatsCard title="Total Wins" value={sportStats.wins} icon={BarChart} />
        </div>
      ) : (
         <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">{profileUser.name} hasn't played any {sport} matches yet.</p>
        </div>
      )}

    </div>
  );
}
