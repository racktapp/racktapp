
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/hooks/use-auth';
import { getMatchHistoryAction, getFriendsAction } from '@/lib/actions';
import { Match, User } from '@/lib/types';
import { Loader2, History } from 'lucide-react';
import { MatchHistoryCard } from '@/components/match-history/match-history-card';
import { MatchHistoryFilters } from '@/components/match-history/match-history-filters';

export default function MatchHistoryPage() {
  const { user } = useAuth();

  const [matches, setMatches] = useState<Match[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [opponentFilter, setOpponentFilter] = useState<string>('all');

  const fetchMatchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    const [friendsData, matchResult] = await Promise.all([
      getFriendsAction(user.uid),
      getMatchHistoryAction(),
    ]);

    setFriends(friendsData);

    if (matchResult.matches) {
      // Sort the matches on the client-side
      const sortedMatches = matchResult.matches.sort((a, b) => b.createdAt - a.createdAt);
      setMatches(sortedMatches);
    }
    
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMatchData();
  }, [fetchMatchData]);

  const filteredMatches = useMemo(() => {
    return matches
      .filter(match => {
        if (opponentFilter === 'all') return true;
        return match.participants.includes(opponentFilter);
      });
  }, [matches, opponentFilter]);
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
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
