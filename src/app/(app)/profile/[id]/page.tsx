'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { Edit, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { User } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { EditProfileDialog } from '@/components/profile/edit-profile-dialog';

export default function ProfilePage({ params }: { params: { id: string } }) {
  const { user: authUser, loading: authLoading } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      if (!params.id) return;
      setLoading(true);
      try {
        const userRef = doc(db, 'users', params.id);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          setProfileUser(userDoc.data() as User);
        } else {
          console.error("User not found");
          setProfileUser(null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setProfileUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [params.id]);

  useEffect(() => {
    if (authUser && profileUser) {
      setIsOwnProfile(authUser.uid === profileUser.uid);
    }
  }, [authUser, profileUser]);

  if (loading || authLoading) {
    return (
      <div className="container mx-auto flex h-full w-full items-center justify-center p-4 md:p-6 lg:p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
