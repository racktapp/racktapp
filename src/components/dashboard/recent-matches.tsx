import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Match } from '@/lib/types';
import { UserAvatar } from '../user-avatar';
import { Badge } from '../ui/badge';
import Link from 'next/link';

interface RecentMatchesProps {
  matches: Match[];
  currentUserId: string;
}

const MatchItem = ({ match, currentUserId }: { match: Match, currentUserId: string }) => {
    const isWinner = match.winner.includes(currentUserId);
    const opponentId = match.participants.find(pId => pId !== currentUserId);
    const opponent = opponentId ? match.participantsData[opponentId] : null;

    return (
        <div className="flex items-center gap-4">
            <UserAvatar user={opponent} className="h-10 w-10" />
            <div className="flex-1">
                <p className="font-medium">vs {opponent?.name || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground">{match.score}</p>
            </div>
            <Badge variant={isWinner ? 'default' : 'destructive'} className={isWinner ? 'bg-green-500/20 text-green-700 border-transparent' : 'bg-red-500/20 text-red-700 border-transparent'}>
                {isWinner ? 'Win' : 'Loss'}
            </Badge>
        </div>
    )
}

export function RecentMatches({ matches, currentUserId }: RecentMatchesProps) {
  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Matches</CardTitle>
          <CardDescription>Your last few games.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="h-[280px] flex items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">No recent matches to display.<br/>Report a match to get started!</p>
           </div>
           <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/match-history">View All Matches</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Matches</CardTitle>
        <CardDescription>Your last few games.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px]">
          <div className="space-y-4">
            {matches.map((match, index) => (
                <div key={match.id}>
                    <MatchItem match={match} currentUserId={currentUserId} />
                    {index < matches.length - 1 && <Separator className="my-4" />}
                </div>
            ))}
          </div>
        </ScrollArea>
        <Button asChild variant="outline" className="mt-4 w-full">
            <Link href="/match-history">View All Matches</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
