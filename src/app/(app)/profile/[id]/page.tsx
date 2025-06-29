import { PageHeader } from '@/components/page-header';
import { UserAvatar } from '@/components/user-avatar';
import { MOCK_USER } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

export default function ProfilePage({ params }: { params: { id: string } }) {
  // In a real app, you'd fetch the user by params.id
  const user = MOCK_USER;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <UserAvatar user={user} className="h-20 w-20" />
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">@{user.username}</p>
        </div>
      </div>
      <PageHeader
        title={`${user.name.split(' ')[0]}'s Stats`}
        description={`Viewing stats for Tennis`}
        actions={
            params.id === MOCK_USER.uid ? (
                <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                </Button>
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
