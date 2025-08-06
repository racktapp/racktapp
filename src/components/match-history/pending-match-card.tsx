
'use client';

import { useState } from 'react';
import { Match, User } from '@/lib/types';
import { format } from 'date-fns';
import { confirmMatchResultAction, declineMatchResultAction } from '@/lib/actions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { Check, X, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Image from 'next/image';
import { SPORT_ICONS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';

interface PendingMatchCardProps {
  match: Match;
  currentUserId: string;
  onAction: () => void;
}

export function PendingMatchCard({ match, currentUserId, onAction }: PendingMatchCardProps) {
  const { toast } = useToast();
  const [processingAction, setProcessingAction] = useState<'confirm' | 'decline' | null>(null);

  const reporter = match.participantsData[match.reportedById];
  const myTeamIds = match.teams.team1.playerIds.includes(currentUserId) ? match.teams.team1.playerIds : match.teams.team2.playerIds;
  const opponentTeamIds = match.teams.team1.playerIds.includes(currentUserId) ? match.teams.team2.playerIds : match.teams.team1.playerIds;
  
  const winnerIsOnMyTeam = match.winner.some(winnerId => myTeamIds.includes(winnerId));

  const opponentDisplay = opponentTeamIds.map(id => `@${match.participantsData[id]?.username}` || 'Unknown').join(' & ');

  const handleConfirm = async () => {
    setProcessingAction('confirm');
    const result = await confirmMatchResultAction(match.id, currentUserId);
    if (result.success) {
      toast({ title: 'Result Confirmed', description: result.message });
      onAction();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setProcessingAction(null);
  };

  const handleDecline = async () => {
    setProcessingAction('decline');
    const result = await declineMatchResultAction(match.id, currentUserId);
    if (result.success) {
      toast({ title: 'Result Declined', description: 'The match result has been declined.' });
      onAction();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setProcessingAction(null);
  };
  
  const canTakeAction = match.participantsToConfirm.includes(currentUserId);

  return (
    <Card className="bg-background">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-4 text-left">
                <div className={`font-semibold text-lg ${winnerIsOnMyTeam ? 'text-green-600' : 'text-red-600'}`}>
                    {winnerIsOnMyTeam ? 'Reported Win' : 'Reported Loss'}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <div className="font-semibold">vs {opponentDisplay}</div>
                    <div className="text-muted-foreground">{match.score}</div>
                </div>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                <div className="text-sm text-muted-foreground">
                    {format(new Date(match.date), 'MMM d, yyyy')}
                </div>
                 <Badge variant={match.isRanked ? 'secondary' : 'outline'} className="font-medium">
                    {match.isRanked ? 'Ranked' : 'Unranked'}
                </Badge>
            </div>
        </div>

        <div className="text-sm text-muted-foreground border-t pt-3 flex flex-col sm:flex-row justify-between gap-2">
            <p>Reported by <span className="font-medium text-foreground">@{reporter?.username || 'Unknown'}</span></p>
            {match.participantsToConfirm.length > 0 ? (
                 <p>Waiting for: <span className="font-medium text-foreground">{match.participantsToConfirm.map(id => `@${match.participantsData[id]?.username}`).join(', ')}</span></p>
            ) : (
                <p>All players have confirmed.</p>
            )}
        </div>
      </CardContent>
      {canTakeAction && (
        <CardFooter className="p-4 pt-0 flex justify-end gap-2">
            <Button variant="destructive" onClick={handleDecline} disabled={!!processingAction}>
              {processingAction === 'decline' ? <LoadingSpinner className="mr-2" /> : <X className="mr-2" />}
              Decline
            </Button>
            <Button onClick={handleConfirm} disabled={!!processingAction}>
              {processingAction === 'confirm' ? <LoadingSpinner className="mr-2" /> : <Check className="mr-2" />}
              Confirm Result
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
