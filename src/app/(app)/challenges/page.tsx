
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSport } from '@/components/providers/sport-provider';
import { useToast } from '@/hooks/use-toast';
import { getChallengesAction } from '@/lib/actions';
import { Challenge, OpenChallenge } from '@/lib/types';
import { CreateOpenChallengeDialog } from '@/components/challenges/create-open-challenge-dialog';
import { ChallengeCard } from '@/components/challenges/challenge-card';
import { OpenChallengeCard } from '@/components/challenges/open-challenge-card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ChallengesPage() {
  const { user, loading: authLoading } = useAuth();
  const { sport } = useSport();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [incoming, setIncoming] = useState<Challenge[]>([]);
  const [sent, setSent] = useState<Challenge[]>([]);
  const [open, setOpen] = useState<OpenChallenge[]>([]);
  const [myOpen, setMyOpen] = useState<OpenChallenge[]>([]);

  const fetchChallenges = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
        const result = await getChallengesAction(user.uid, sport);
        setIncoming(result.incoming || []);
        setSent(result.sent || []);
        setOpen(result.open?.filter(c => c.posterId !== user.uid) || []);
        setMyOpen(result.open?.filter(c => c.posterId === user.uid) || []);
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not load challenges. This may be due to a missing database index.'
        })
    }
    
    setIsLoading(false);
  }, [user, sport, toast]);


  useEffect(() => {
    if (!authLoading && user) {
        fetchChallenges();
    }
  }, [fetchChallenges, authLoading, user]);

  if (authLoading) {
    return (
        <div className="flex h-64 items-center justify-center">
            <LoadingSpinner className="h-8 w-8" />
        </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Challenges"
        description="Accept incoming challenges or create an open one."
        actions={
          <CreateOpenChallengeDialog user={user} onChallengeCreated={fetchChallenges}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Post Open Challenge
            </Button>
          </CreateOpenChallengeDialog>
        }
      />
        <Tabs defaultValue="incoming">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="incoming">
              Incoming
              {incoming.length > 0 && <Badge className="ml-2">{incoming.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
             <TabsTrigger value="my-posts">
              My Posts
              {myOpen.length > 0 && <Badge className="ml-2">{myOpen.length}</Badge>}
            </TabsTrigger>
          </TabsList>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner className="h-8 w-8" />
            </div>
          ) : (
            <>
              <TabsContent value="incoming">
                {incoming.length > 0 ? (
                  <div className="space-y-4 pt-4">
                    {incoming.map((challenge, i) => (
                      <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        currentUserId={user.uid}
                        type="incoming"
                        onAction={fetchChallenges}
                        className="opacity-0 animate-fade-in-slide-up"
                        style={{ animationDelay: `${i * 100}ms` }}
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
                    {sent.map((challenge, i) => (
                      <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        currentUserId={user.uid}
                        type="sent"
                        onAction={fetchChallenges}
                        className="opacity-0 animate-fade-in-slide-up"
                        style={{ animationDelay: `${i * 100}ms` }}
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
                    {open.map((challenge, i) => (
                      <OpenChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        challenger={user}
                        onAction={fetchChallenges}
                        className="opacity-0 animate-fade-in-slide-up"
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                    <p className="text-muted-foreground">No open {sport} challenges. Post one!</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="my-posts">
                {myOpen.length > 0 ? (
                  <div className="space-y-4 pt-4">
                    {myOpen.map((challenge, i) => (
                      <OpenChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        challenger={user}
                        onAction={fetchChallenges}
                        className="opacity-0 animate-fade-in-slide-up"
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                    <p className="text-muted-foreground">You have no posted open challenges for {sport}.</p>
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
    </div>
  );
}
