
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/hooks/use-auth';
import { getMatchHistoryAction, getFriendsAction, seedMatchHistoryAction } from '@/lib/actions';
import { Match, User } from '@/lib/types';
import { Loader2, History, Sparkles } from 'lucide-react';
import { MatchHistoryCard } from '@/components/match-history/match-history-card';
import { MatchHistoryFilters } from '@/components/match-history/match-history-filters';
import { useToast } from '@/hooks/use-toast';
import { FirestoreIndexAlert } from '@/components/firestore-index-alert';
import { Button } from '@/components/ui/button';

export default function MatchHistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [matches, setMatches] = useState<Match[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Filter states
  const [opponentFilter, setOpponentFilter] = useState<string>('all');

  const fetchMatchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    const [friendsData, matchesResult] = await Promise.all([
        getFriendsAction(user.uid),
        getMatchHistoryAction()
    ]);
    
    setFriends(friendsData || []);
    
    if (matchesResult.success) {
      setMatches(matchesResult.data);
    } else {
      setError(matchesResult.error);
      setMatches([]);
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMatchData();
  }, [fetchMatchData]);

  const handleSeedData = async () => {
    setIsSeeding(true);
    const result = await seedMatchHistoryAction();
    if (result.success) {
        toast({ title: 'Success', description: 'Mock data created. Refreshing...' });
        await fetchMatchData(); // Re-fetch data after seeding
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsSeeding(false);
  }

  const filteredMatches = useMemo(() => {
    if (!Array.isArray(matches)) return [];

    return matches
      .filter(match => {
        if (opponentFilter === 'all') return true;
        const opponentId = match.participants.find(pId => pId !== user!.uid);
        if (opponentFilter === opponentId) return true;
        // Also check for doubles partners
        if (match.type === 'Doubles') {
            const opponentTeam = match.teams.team1.playerIds.includes(user!.uid) ? match.teams.team2.playerIds : match.teams.team1.playerIds;
            if (opponentTeam.includes(opponentFilter)) return true;
        }
        return false;
      });
  }, [matches, opponentFilter, user]);
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return <FirestoreIndexAlert message={error} />;
    }
    
    if (filteredMatches.length > 0) {
      return (
        <div className="space-y-4">
          {filteredMatches.map(match => (
            <MatchHistoryCard key={match.id} match={match} currentUserId={user!.uid} />
          ))}
        </div>
      );
    }
    
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
          <History className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No matches found.</p>
           <p className="text-sm text-muted-foreground">Report a match or seed some mock data to get started.</p>
           <Button onClick={handleSeedData} disabled={isSeeding} variant="outline" className="mt-4">
                {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Seed Mock Matches
           </Button>
      </div>
    );
  };


  if (!user) return null;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Match History"
        description="Review your past games and generate AI recaps."
      />
      
      <MatchHistoryFilters
        friends={friends}
        opponentFilter={opponentFilter}
        setOpponentFilter={setOpponentFilter}
        className="mb-6"
      />
      
      {renderContent()}
    </div>
  );
}
