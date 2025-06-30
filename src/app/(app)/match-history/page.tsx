'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/hooks/use-auth';
import { useSport } from '@/components/providers/sport-provider';
import { getMatchHistoryAction, getFriendsAction } from '@/lib/actions';
import { Match, User } from '@/lib/types';
import { Loader2, History } from 'lucide-react';
import { MatchHistoryCard } from '@/components/match-history/match-history-card';
import { MatchHistoryFilters } from '@/components/match-history/match-history-filters';
import { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import { FirestoreIndexAlert } from '@/components/firestore-index-alert';

export default function MatchHistoryPage() {
  const { user } = useAuth();
  const { sport } = useSport();
  const { toast } = useToast();

  const [matches, setMatches] = useState<Match[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [indexError, setIndexError] = useState<string | null>(null);

  // Filter states
  const [opponentFilter, setOpponentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>();

  const fetchMatchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setIndexError(null);
    try {
      const [matchData, friendsData] = await Promise.all([
        getMatchHistoryAction(),
        getFriendsAction(user.uid),
      ]);
      setMatches(matchData);
      setFriends(friendsData);
    } catch (error: any) {
      if (error.message && error.message.includes('query requires an index')) {
          setIndexError(error.message);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch match history.' });
        console.error('Failed to fetch match history:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchMatchData();
  }, [fetchMatchData]);

  const filteredMatches = useMemo(() => {
    return matches
      .filter(match => match.sport === sport)
      .filter(match => {
        if (opponentFilter === 'all') return true;
        return match.participants.includes(opponentFilter);
      })
      .filter(match => {
        if (!dateFilter?.from) return true;
        const to = dateFilter.to ?? dateFilter.from;
        return match.date >= dateFilter.from.getTime() && match.date <= new Date(to).setHours(23, 59, 59, 999);
      });
  }, [matches, sport, opponentFilter, dateFilter]);
  
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
          <p className="mt-4 text-muted-foreground">No matches found for the selected filters.</p>
      </div>
    );
  };


  if (!user) return null;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Match History"
        description={`Review your past ${sport} games and generate AI recaps.`}
      />
      
      <MatchHistoryFilters
        friends={friends}
        opponentFilter={opponentFilter}
        setOpponentFilter={setOpponentFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        className="mb-6"
      />
      
      {renderContent()}
    </div>
  );
}
