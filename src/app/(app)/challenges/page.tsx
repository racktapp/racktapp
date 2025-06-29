import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';

export default function ChallengesPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Challenges"
        description="Accept incoming challenges or create a new one."
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Challenge
          </Button>
        }
      />
      <Tabs defaultValue="incoming">
        <TabsList>
          <TabsTrigger value="incoming">Incoming</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
        </TabsList>
        <TabsContent value="incoming">
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">Incoming challenges will be shown here.</p>
          </div>
        </TabsContent>
        <TabsContent value="sent">
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">Sent challenges will be shown here.</p>
          </div>
        </TabsContent>
        <TabsContent value="open">
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">Open challenges will be shown here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
