
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/hooks/use-auth';
import { getMatchHistoryAction, getFriendsAction } from '@/lib/actions';
import { Match, User } from '@/lib/types';
import { Loader2, History } from 'lucide-react';
import { MatchHistoryCard } from '@/components/match-history/match-history-card';
import { MatchHistoryFilters } from '@/components/match-history/match-history-filters';
import { useToast } from '@/hooks/use-toast';
import { FirestoreIndexAlert } from '@/components/firestore-index-alert';

export default function MatchHistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [matches, setMatches] = useState<Match[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [indexError, setIndexError] = useState<string | null>(null);

  // Filter states
  const [opponentFilter, setOpponentFilter] = useState<string>('all');

  const fetchMatchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setIndexError(null);

    try {
      const friendsData = await getFriendsAction(user.uid);
      setFriends(friendsData);

      const matchResult = await getMatchHistoryAction();

      if (matchResult.error) {
        setIndexError(matchResult.error);
        setMatches([]);
      } else {
        setMatches(matchResult.matches || []);
      }
    } catch (error) {
      console.error("Failed to fetch match data:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load match history. Please try again later.'
      });
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchMatchData();
  }, [fetchMatchData]);

  const filteredMatches = useMemo(() => {
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
    
    if (indexError) {
      return <FirestoreIndexAlert message={indexError} />;
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
           <p className="text-sm text-muted-foreground">Report a match to see your history.</p>
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
