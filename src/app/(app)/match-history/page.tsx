
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/hooks/use-auth';
import { getMatchHistoryAction, getFriendsAction } from '@/lib/actions';
import { Match, User } from '@/lib/types';
import { History, ShieldCheck } from 'lucide-react';
import { MatchHistoryCard } from '@/components/match-history/match-history-card';
import { PendingMatchCard } from '@/components/match-history/pending-match-card';
import { MatchHistoryFilters } from '@/components/match-history/match-history-filters';
import { useToast } from '@/hooks/use-toast';
import { FirestoreIndexAlert } from '@/components/firestore-index-alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function MatchHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [confirmedMatches, setConfirmedMatches] = useState<Match[]>([]);
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [opponentFilter, setOpponentFilter] = useState<string>('all');

  const fetchMatchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    const [friendsData, matchesResult] = await Promise.all([
        getFriendsAction(user.uid),
        getMatchHistoryAction(user.uid)
    ]);
    
    setFriends(friendsData || []);
    
    if (matchesResult.success) {
      setConfirmedMatches(matchesResult.data.confirmed);
      setPendingMatches(matchesResult.data.pending);
    } else {
      setError(matchesResult.error);
      setConfirmedMatches([]);
      setPendingMatches([]);
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
        fetchMatchData();
    }
  }, [fetchMatchData, authLoading, user]);

  const filteredMatches = useMemo(() => {
    if (!Array.isArray(confirmedMatches)) return [];

    return confirmedMatches
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
  }, [confirmedMatches, opponentFilter, user]);
  
  const renderConfirmedMatches = () => {
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
          <p className="mt-4 text-muted-foreground">No confirmed matches found.</p>
           <p className="text-sm text-muted-foreground">Report a match to get started.</p>
      </div>
    );
  };

  const renderContent = () => {
     if (isLoading || authLoading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      );
    }

    if (error) {
      return <FirestoreIndexAlert message={error} />;
    }

    return (
      <div className="space-y-8">
        {pendingMatches.length > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="text-primary" />
                Pending Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingMatches.map(match => (
                <PendingMatchCard 
                  key={match.id} 
                  match={match} 
                  currentUserId={user!.uid}
                  onAction={fetchMatchData}
                />
              ))}
            </CardContent>
          </Card>
        )}
        <div>
          <MatchHistoryFilters
            friends={friends}
            opponentFilter={opponentFilter}
            setOpponentFilter={setOpponentFilter}
            className="mb-6"
          />
          {renderConfirmedMatches()}
        </div>
      </div>
    )
  }

  if (!user && !authLoading) {
    // This case can happen briefly during redirect, or if something is wrong.
    // It's better to show nothing than an error.
    return null;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Match History"
        description="Review your past games and confirm pending results."
      />
      {renderContent()}
    </div>
  );
}
