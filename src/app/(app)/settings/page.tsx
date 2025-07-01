
'use client';

import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/hooks/use-auth';
import { SettingsForm } from '@/components/settings/settings-form';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { UserAvatar } from '@/components/user-avatar';
import { EditProfileDialog } from '@/components/profile/edit-profile-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex h-full items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences."
      />
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex flex-col items-center gap-4">
            <UserAvatar user={user} className="h-24 w-24" />
            <EditProfileDialog user={user}>
                <Button variant="outline">Change Picture</Button>
            </EditProfileDialog>
        </div>
        
        <Separator />

        <SettingsForm user={user} />
      </div>
    </div>
  );
}
