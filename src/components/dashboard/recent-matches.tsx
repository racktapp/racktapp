import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Match, User } from '@/lib/types';
import { UserAvatar } from '../user-avatar';
import { Badge } from '../ui/badge';
import Link from 'next/link';

interface RecentMatchesProps {
  matches: Match[];
  currentUserId: string;
}

const MatchItem = ({ match, currentUserId }: { match: Match, currentUserId: string }) => {
    const isWinner = match.winner.includes(currentUserId);
    const opponent = match.participants
        .map(id => match.teams.team1.players.find(p => p.uid === id) || match.teams.team2.players.find(p => p.uid === id))
        .find(p => p && p.uid !== currentUserId);

    return (
        <div className="flex items-center gap-4">
            <UserAvatar user={opponent} className="h-10 w-10" />
            <div className="flex-1">
                <p className="font-medium">vs {opponent?.name}</p>
                <p className="text-sm text-muted-foreground">{match.score}</p>
            </div>
            <Badge variant={isWinner ? 'default' : 'destructive'} className={isWinner ? 'bg-green-500/20 text-green-700 border-transparent' : 'bg-red-500/20 text-red-700 border-transparent'}>
                {isWinner ? 'Win' : 'Loss'}
            </Badge>
        </div>
    )
}

export function RecentMatches({ matches, currentUserId }: RecentMatchesProps) {
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
