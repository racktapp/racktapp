
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Match, User } from '@/lib/types';
import { UserAvatar } from '../user-avatar';
import { Badge } from '../ui/badge';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentMatchesProps {
  matches: Match[];
  currentUserId: string;
  isLoading: boolean;
}

const MatchItem = ({ match, currentUserId, className, ...props }: { match: Match, currentUserId: string, className?: string, [key:string]: any }) => {
    const isWinner = match.winner.includes(currentUserId);
    
    // Handle both Singles and Doubles display
    const opponentTeamIds = match.teams.team1.playerIds.includes(currentUserId) 
        ? match.teams.team2.playerIds 
        : match.teams.team1.playerIds;
    
    const opponentData = opponentTeamIds.map(id => match.participantsData[id]).filter(Boolean);

    if (!opponentData || opponentData.length === 0) {
        return (
             <div className={cn("flex items-center gap-3 sm:gap-4", className)}>
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                </div>
            </div>
        )
    }
    
    const opponentDisplay = opponentData.map(p => `@${p.username}`).join(' & ');
    const firstOpponent = opponentData[0];


    return (
        <div className={cn("flex items-center gap-3 sm:gap-4", className)} {...props}>
            <UserAvatar user={firstOpponent as User} className="h-10 w-10" />
            <div className="flex-1">
                <p className="font-medium">vs {opponentDisplay}</p>
                <div className='flex items-center gap-2'>
                    <Badge variant={isWinner ? 'default' : 'destructive'} className={cn(
                        'border-transparent', 
                        isWinner ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                    )}>
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
        <div className="space-y-3 sm:space-y-4">
          {matches.map((match, i) => (
              <div key={match.id}>
                  <MatchItem 
                    match={match} 
                    currentUserId={currentUserId} 
                    className="opacity-0 animate-fade-in-slide-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                    />
              </div>
          ))}
        </div>
      </ScrollArea>
    );
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
        <div>
            <CardTitle>Recent Matches</CardTitle>
            <CardDescription>Your last few games.</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
            <Link href="/match-history">View All <ArrowRight className='ml-2 h-4 w-4' /></Link>
        </Button>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
