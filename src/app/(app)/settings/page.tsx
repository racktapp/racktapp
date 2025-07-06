
'use client';

import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/hooks/use-auth';
import { SettingsForm } from '@/components/settings/settings-form';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { LogOut } from 'lucide-react';
import { ThemeSwitcher } from '@/components/settings/theme-switcher';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading || !user) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex h-full items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences."
      />
      <div className="max-w-2xl mx-auto space-y-8">
        <SettingsForm />
        <ThemeSwitcher />
        
        <Separator />

        <div className="pt-4">
            <Button variant="outline" onClick={handleLogout} className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
            </Button>
        </div>
      </div>
    </div>
  );
}
