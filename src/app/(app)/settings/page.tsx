
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
import { LogOut, Palette, User as UserIcon } from 'lucide-react';
import { ThemeSwitcher } from '@/components/settings/theme-switcher';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarSelector } from '@/components/settings/avatar-selector';

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
        description="Manage your account, profile, and preferences."
      />
      <div className="max-w-2xl mx-auto grid gap-8">
        <SettingsForm user={user} />
        <AvatarSelector user={user} />
        <ThemeSwitcher />
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><LogOut /> Log Out</CardTitle>
                <CardDescription>End your current session.</CardDescription>
            </CardHeader>
            <CardFooter>
                <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
                    Log Out
                </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
