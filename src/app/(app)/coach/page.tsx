import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

export default function CoachPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="AI Coach"
        description="Upload a video of your swing for AI-powered analysis."
      />
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
        <div className="text-center space-y-2">
            <p className="text-muted-foreground">AI swing analysis coming soon.</p>
            <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Video
            </Button>
        </div>
      </div>
    </div>
  );
}
