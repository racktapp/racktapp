import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function TournamentsPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Tournaments"
        description="Create and compete in single-elimination brackets."
        actions={
            <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Tournament
            </Button>
        }
      />
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground">Tournament brackets will be shown here.</p>
      </div>
    </div>
  );
}
