'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { User } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { EditProfileDialog } from '@/components/profile/edit-profile-dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ProfilePage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : undefined;

  const { user: authUser, loading: authLoading } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    if (!id || authLoading) {
      // If there's no ID or auth is still loading, do nothing.
      // The parent layout will handle redirects if auth fails.
      return;
    }

    setLoading(true);
    const userRef = doc(db, 'users', id);

    // Set up a real-time listener to get profile data and listen for updates.
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

    // Cleanup subscription on component unmount
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
        <PageHeader title="Profile Not Found" description="This user does not exist or you may not have permission to view it." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-4">
        <UserAvatar user={profileUser} className="h-20 w-20" />
        <div>
          <h1 className="text-2xl font-bold">{profileUser.name}</h1>
          <p className="text-muted-foreground">@{profileUser.username}</p>
        </div>
      </div>
      <PageHeader
        title={`${profileUser.name.split(' ')[0]}'s Stats`}
        description={`Viewing stats for Tennis`}
        actions={
          isOwnProfile && authUser ? (
            <EditProfileDialog user={authUser}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </EditProfileDialog>
          ) : (
            <Button>Add Friend</Button>
          )
        }
      />
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground">Detailed stats and achievements will be shown here.</p>
      </div>
    </div>
  );
}
