import { PageHeader } from '@/components/page-header';

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences."
      />
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground">Account settings will be available here.</p>
      </div>
    </div>
  );
}
