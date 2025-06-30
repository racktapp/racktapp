
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Match } from '@/lib/types';
import { UserAvatar } from '../user-avatar';
import { Badge } from '../ui/badge';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface RecentMatchesProps {
  matches: Match[];
  currentUserId: string;
  isLoading: boolean;
}

const MatchItem = ({ match, currentUserId }: { match: Match, currentUserId: string }) => {
    const isWinner = match.winner.includes(currentUserId);
    
    // Handle both Singles and Doubles display
    const opponentTeamIds = match.teams.team1.playerIds.includes(currentUserId) 
        ? match.teams.team2.playerIds 
        : match.teams.team1.playerIds;
    
    const opponentData = opponentTeamIds.map(id => match.participantsData[id]).filter(Boolean);

    const opponentDisplay = opponentData.length > 0 ? opponentData.map(p => p.name).join(' & ') : 'Unknown Opponent';
    const firstOpponent = opponentData.length > 0 ? opponentData[0] : null;

    return (
        <div className="flex items-center gap-4">
            <UserAvatar user={firstOpponent} className="h-10 w-10" />
            <div className="flex-1">
                <p className="font-medium">vs {opponentDisplay}</p>
                <div className='flex items-center gap-2'>
                    <Badge variant={isWinner ? 'default' : 'destructive'} className={isWinner ? 'bg-green-600/20 text-green-700 border-green-600/30' : 'bg-red-600/20 text-red-700 border-red-600/30'}>
                        {isWinner ? 'Win' : 'Loss'}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{match.score}</p>
                </div>
            </div>
        </div>
    )
}

export function RecentMatches({ matches, currentUserId, isLoading }: RecentMatchesProps) {

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="h-[280px] flex items-center justify-center">
            <LoadingSpinner className="h-6 w-6" />
        </div>
      );
    }
  
    if (matches.length === 0) {
      return (
        <div className="h-[280px] flex items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">No recent matches to display.<br/>Report a match to get started!</p>
        </div>
      );
    }
  
    return (
      <ScrollArea className="h-[280px] pr-4">
        <div className="space-y-4">
          {matches.map((match) => (
              <div key={match.id}>
                  <MatchItem match={match} currentUserId={currentUserId} />
              </div>
          ))}
        </div>
      </ScrollArea>
    );
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Recent Matches</CardTitle>
            <CardDescription>Your last few games.</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
            <Link href="/match-history">View All <ArrowRight className='ml-2' /></Link>
        </Button>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
