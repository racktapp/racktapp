import { PageHeader } from '@/components/page-header';
import { handleRecapAction } from '@/lib/actions';

export default function MatchHistoryPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Match History"
        description="Review your past games and generate AI recaps."
      />
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
        <div className='text-center'>
            <p className="text-muted-foreground">Your match history will be displayed here.</p>
            {/* Example of how the recap could be triggered */}
            <form action={handleRecapAction}>
                <button type="submit" className="text-sm text-primary mt-2">Generate recap for a sample match</button>
            </form>
        </div>
      </div>
    </div>
  );
}
