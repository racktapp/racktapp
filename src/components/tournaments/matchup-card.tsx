
'use client';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/components/user-avatar';
import { TournamentMatch, User } from '@/lib/types';
import { Button } from '../ui/button';
import { Swords, CheckCircle } from 'lucide-react';
import { ReportWinnerDialog } from './report-winner-dialog';

interface MatchupCardProps {
  match: TournamentMatch;
  tournamentId: string;
  participants: { uid: string, username: string, avatarUrl?: string | null }[];
  isOrganizer: boolean;
  onUpdate: () => void;
}

const PlayerDisplay = ({ playerId, participants, isWinner }: { playerId: string | null | undefined, participants: { uid: string, username: string, avatarUrl?: string | null }[], isWinner: boolean }) => {
  if (!playerId) {
    return <div className="text-sm text-muted-foreground italic">TBD</div>;
  }
  const player = participants.find(p => p.uid === playerId);
  if (!player) {
    return <div className="text-sm text-muted-foreground italic">Unknown Player</div>;
  }
  return (
    <div className={`flex items-center gap-2 rounded p-2 transition-colors ${isWinner ? 'font-bold text-primary' : ''}`}>
      <UserAvatar user={player as User} className="h-8 w-8" />
      <span>@{player.username}</span>
    </div>
  );
};


export function MatchupCard({ match, tournamentId, participants, isOrganizer, onUpdate }: MatchupCardProps) {
  const isMatchReady = match.player1Id && match.player2Id;
  const isReportable = isOrganizer && isMatchReady && !match.winnerId;

  if (match.isBye) {
    return (
        <Card className="border-dashed">
            <CardContent className="p-2">
                <div className="flex justify-between items-center">
                    <PlayerDisplay playerId={match.player1Id} participants={participants} isWinner={true} />
                    <div className="text-sm font-semibold text-green-600">BYE</div>
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className={!isMatchReady || match.winnerId ? 'bg-muted/50' : ''}>
      <CardContent className="p-0">
        <div className="flex flex-col">
            <div className={`p-2 ${match.winnerId === match.player1Id ? 'bg-green-500/10' : ''}`}>
                <PlayerDisplay playerId={match.player1Id} participants={participants} isWinner={match.winnerId === match.player1Id} />
            </div>
          
            <div className="relative border-t">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2">
                    <Swords className="h-4 w-4 text-muted-foreground" />
                </div>
            </div>

            <div className={`p-2 ${match.winnerId === match.player2Id ? 'bg-green-500/10' : ''}`}>
                 <PlayerDisplay playerId={match.player2Id} participants={participants} isWinner={match.winnerId === match.player2Id} />
            </div>

            {isReportable && (
                <div className="border-t p-2">
                    <ReportWinnerDialog 
                        tournamentId={tournamentId} 
                        match={match} 
                        player1={participants.find(p => p.uid === match.player1Id)! as User} 
                        player2={participants.find(p => p.uid === match.player2Id)! as User}
                        onReported={onUpdate}
                    >
                        <Button size="sm" className="w-full">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Report Winner
                        </Button>
                    </ReportWinnerDialog>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
