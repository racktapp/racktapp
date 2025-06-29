import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

export default function FriendsPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Friends"
        description="Manage your friends, challenges, and more."
        actions={
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Friend
          </Button>
        }
      />
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground">Friends list and requests will be shown here.</p>
      </div>
    </div>
  );
}
