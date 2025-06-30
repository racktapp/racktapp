'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSport } from '@/components/providers/sport-provider';
import { useToast } from '@/hooks/use-toast';
import { getChallengesAction } from '@/lib/actions';
import { Challenge, OpenChallenge } from '@/lib/types';
import { CreateOpenChallengeDialog } from '@/components/challenges/create-open-challenge-dialog';
import { ChallengeCard } from '@/components/challenges/challenge-card';
import { OpenChallengeCard } from '@/components/challenges/open-challenge-card';
import { Badge } from '@/components/ui/badge';

export default function ChallengesPage() {
  const { user } = useAuth();
  const { sport } = useSport();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [incoming, setIncoming] = useState<Challenge[]>([]);
  const [sent, setSent] = useState<Challenge[]>([]);
  const [open, setOpen] = useState<OpenChallenge[]>([]);

  const fetchChallenges = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { incoming, sent, open } = await getChallengesAction(user.uid, sport);
      setIncoming(incoming);
      setSent(sent);
      setOpen(open);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load challenges.' });
    } finally {
      setIsLoading(false);
    }
  }, [user, sport, toast]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  if (!user) return null;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Challenges"
        description="Accept incoming challenges or create an open one."
        actions={
          <CreateOpenChallengeDialog user={user}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Post Open Challenge
            </Button>
          </CreateOpenChallengeDialog>
        }
      />
      <Tabs defaultValue="incoming">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="incoming">
            Incoming
            {incoming.length > 0 && <Badge className="ml-2">{incoming.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
        </TabsList>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <TabsContent value="incoming">
              {incoming.length > 0 ? (
                <div className="space-y-4 pt-4">
                  {incoming.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      currentUserId={user.uid}
                      type="incoming"
                      onAction={fetchChallenges}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                  <p className="text-muted-foreground">Incoming challenges will be shown here.</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="sent">
              {sent.length > 0 ? (
                <div className="space-y-4 pt-4">
                  {sent.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      currentUserId={user.uid}
                      type="sent"
                      onAction={fetchChallenges}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                  <p className="text-muted-foreground">Sent challenges will be shown here.</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="open">
              {open.length > 0 ? (
                <div className="space-y-4 pt-4">
                  {open.map((challenge) => (
                    <OpenChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      challenger={user}
                      onAction={fetchChallenges}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                  <p className="text-muted-foreground">No open {sport} challenges. Post one!</p>
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
