'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { Challenge, User } from '@/lib/types';
import { format } from 'date-fns';
import { Calendar, MapPin, Swords, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { acceptChallengeAction, declineChallengeAction, cancelChallengeAction } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ChallengeCardProps {
  challenge: Challenge;
  currentUserId: string;
  type: 'incoming' | 'sent';
  onAction: () => void;
}

const ActionButton = ({ onClick, isProcessing, variant, idleIcon, text }: any) => (
  <Button onClick={onClick} disabled={isProcessing} variant={variant} size="sm">
    {isProcessing ? <LoadingSpinner className="mr-2 h-4 w-4" /> : idleIcon}
    {text}
  </Button>
);

export function ChallengeCard({ challenge, currentUserId, type, onAction }: ChallengeCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const opponent = type === 'incoming' 
    ? { uid: challenge.fromId, name: challenge.fromName, avatar: challenge.fromAvatar }
    : { uid: challenge.toId, name: challenge.toName, avatar: challenge.toAvatar };

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
      if (action === 'accept' && result.chatId) {
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
    <Card>
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <UserAvatar user={opponent as User} className="h-12 w-12" />
          <div className="space-y-1">
            <p className="font-semibold text-lg">{type === 'incoming' ? 'From:' : 'To:'} {opponent.name}</p>
            <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5"><Swords className="h-4 w-4" /> {challenge.sport}</span>
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
