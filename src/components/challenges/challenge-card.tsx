
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { Challenge, User } from '@/lib/types';
import { format } from 'date-fns';
import { Calendar, MapPin, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { acceptChallengeAction, declineChallengeAction, cancelChallengeAction } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Image from 'next/image';
import { SPORT_ICONS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ChallengeCardProps {
  challenge: Challenge;
  currentUserId: string;
  type: 'incoming' | 'sent';
  onAction: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const ActionButton = ({ onClick, isProcessing, variant, idleIcon, text }: any) => (
  <Button onClick={onClick} disabled={isProcessing} variant={variant} size="sm">
    {isProcessing ? <LoadingSpinner className="mr-2 h-4 w-4" /> : idleIcon}
    {text}
  </Button>
);

export function ChallengeCard({ challenge, currentUserId, type, onAction, className, style }: ChallengeCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const opponentData = type === 'incoming' ? challenge.participantsData[challenge.fromId] : challenge.participantsData[challenge.toId];

  const opponent = opponentData 
    ? { uid: opponentData.uid, username: opponentData.username, avatarUrl: opponentData.avatarUrl }
    : { uid: type === 'incoming' ? challenge.fromId : challenge.toId, username: 'loading...', avatarUrl: null };


  const handleAction = async (action: 'accept' | 'decline' | 'cancel') => {
    setProcessingAction(action);
    let result;
    if (action === 'accept') {
      result = await acceptChallengeAction(challenge);
    } else if (action === 'decline') {
      result = await declineChallengeAction(challenge.id);
    } else { // cancel
      result = await cancelChallengeAction(challenge.id);
    }

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      if (action === 'accept' && 'chatId' in result && result.chatId) {
        router.push(`/chat/${result.chatId}`);
      } else {
        onAction();
      }
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setProcessingAction(null);
  };

  return (
    <Card className={cn(className)} style={style}>
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <UserAvatar user={opponent as User} className="h-12 w-12" />
          <div className="space-y-1">
            <p className="font-semibold text-lg">{type === 'incoming' ? 'From:' : 'To:'} @{opponent.username}</p>
            <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5">
                <Image src={SPORT_ICONS[challenge.sport]} alt={challenge.sport} width={16} height={16} unoptimized/>
                {challenge.sport}
              </span>
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {format(new Date(challenge.matchDateTime), 'PPp')}</span>
              {challenge.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {challenge.location}</span>}
            </div>
            {challenge.wager && <p className="text-sm">Wager: <span className="italic text-muted-foreground">{challenge.wager}</span></p>}
          </div>
        </div>

        <div className="flex gap-2 self-end sm:self-center">
          {type === 'incoming' && (
            <>
              <ActionButton
                onClick={() => handleAction('accept')}
                isProcessing={processingAction === 'accept'}
                variant="default"
                idleIcon={<Check className="mr-2 h-4 w-4" />}
                text="Accept"
              />
              <ActionButton
                onClick={() => handleAction('decline')}
                isProcessing={processingAction === 'decline'}
                variant="destructive"
                idleIcon={<X className="mr-2 h-4 w-4" />}
                text="Decline"
              />
            </>
          )}
          {type === 'sent' && (
            <ActionButton
              onClick={() => handleAction('cancel')}
              isProcessing={processingAction === 'cancel'}
              variant="outline"
              idleIcon={<X className="mr-2 h-4 w-4" />}
              text="Cancel"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
