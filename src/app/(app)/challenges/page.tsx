
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSport } from '@/components/providers/sport-provider';
import { useToast } from '@/hooks/use-toast';
import { getChallengesAction, getFriendsAction } from '@/lib/actions';
import { Challenge, OpenChallenge, User } from '@/lib/types';
import { CreateOpenChallengeDialog } from '@/components/challenges/create-open-challenge-dialog';
import { ChallengeCard } from '@/components/challenges/challenge-card';
import { OpenChallengeCard } from '@/components/challenges/open-challenge-card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Slider } from '@/components/ui/slider';
import { useUserLocation } from '@/hooks/use-user-location';
import { LocationGate } from '@/components/location-gate';

export default function ChallengesPage() {
  const { user, loading: authLoading } = useAuth();
  const { sport } = useSport();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [incoming, setIncoming] = useState<Challenge[]>([]);
  const [sent, setSent] = useState<Challenge[]>([]);
  const [open, setOpen] = useState<OpenChallenge[]>([]);
  const [myOpen, setMyOpen] = useState<OpenChallenge[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [radius, setRadius] = useState(25);
  const { latitude, longitude, enableLocation, manualLocation, setManualLocation } = useUserLocation();
  const [hasFetched, setHasFetched] = useState(false);

  const fetchChallenges = useCallback(async (lat?: number, lng?: number) => {
    if (!user) return;
    setIsLoading(true);
    setHasFetched(true);

    try {
        const [friendsData, challengesResult] = await Promise.all([
            getFriendsAction(user.uid),
            getChallengesAction(user.uid, sport, lat, lng, radius)
        ]);

        setFriends(friendsData);
        setIncoming(challengesResult.incoming || []);
        setSent(challengesResult.sent || []);
        setOpen(challengesResult.open?.filter(c => c.posterId !== user.uid) || []);
        setMyOpen(challengesResult.open?.filter(c => c.posterId === user.uid) || []);
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not load challenges. This may be due to a missing database index.'
        })
    }

    setIsLoading(false);
  }, [user, sport, toast, radius]);


  useEffect(() => {
    if (!authLoading && user && (latitude || manualLocation) && !hasFetched) {
        fetchChallenges(latitude ?? undefined, longitude ?? undefined);
    }
  }, [fetchChallenges, authLoading, user, latitude, longitude, manualLocation, hasFetched]);

  // Refetch when radius changes and we have a location
  useEffect(() => {
    if ((latitude && longitude) || manualLocation) {
      const t = setTimeout(() => fetchChallenges(latitude ?? undefined, longitude ?? undefined), 200);
      return () => clearTimeout(t);
    }
  }, [radius, latitude, longitude, fetchChallenges, manualLocation]);

  if (authLoading) {
    return (
        <div className="flex h-64 items-center justify-center">
            <LoadingSpinner className="h-8 w-8" />
        </div>
    );
  }

  if (!user) return null;

  if (!latitude && !longitude && !manualLocation) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <PageHeader
          title="Challenges"
          description="Accept incoming challenges or create an open one."
        />
        <LocationGate
          title="Enable location to see nearby challenges."
          onEnable={enableLocation}
          onManual={setManualLocation}
          onSkip={setManualLocation}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Challenges"
        description="Accept incoming challenges or create an open one."
        actions={
          <CreateOpenChallengeDialog user={user} friends={friends} onChallengeCreated={() => fetchChallenges(latitude ?? undefined, longitude ?? undefined)}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Post Open Challenge
            </Button>
          </CreateOpenChallengeDialog>
        }
      />
      <div className="mb-6">
        <label className="text-sm font-medium">Show challenges within {radius} km</label>
        <Slider value={[radius]} onValueChange={(v) => setRadius(v[0])} min={1} max={100} step={1} />
      </div>
      <Tabs defaultValue="open">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="incoming">
              Incoming
              {incoming.length > 0 && <Badge className="ml-2">{incoming.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent
              {sent.length > 0 && <Badge className="ml-2">{sent.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="open">
              Open
              {open.length > 0 && <Badge className="ml-2">{open.length}</Badge>}
            </TabsTrigger>
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
                        onAction={() => fetchChallenges(latitude ?? undefined, longitude ?? undefined)}
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
                        onAction={() => fetchChallenges(latitude ?? undefined, longitude ?? undefined)}
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
                        onAction={() => fetchChallenges(latitude ?? undefined, longitude ?? undefined)}
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
                        onAction={() => fetchChallenges(latitude ?? undefined, longitude ?? undefined)}
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

    