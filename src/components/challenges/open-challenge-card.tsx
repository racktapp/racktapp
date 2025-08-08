
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { OpenChallenge, User } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Swords, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { challengeFromOpenAction, deleteOpenChallengeAction } from '@/lib/actions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Image from 'next/image';
import { SPORT_ICONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


interface OpenChallengeCardProps {
  challenge: OpenChallenge;
  challenger: User;
  onAction: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function OpenChallengeCard({ challenge, challenger, onAction, className, style }: OpenChallengeCardProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const isOwner = challenge.posterId === challenger.uid;

  const handleChallenge = async () => {
    setIsProcessing(true);
    const result = await challengeFromOpenAction(challenge, challenger);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      onAction();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsProcessing(false);
  };
  
  const handleDelete = async () => {
    setIsProcessing(true);
    const result = await deleteOpenChallengeAction(challenge.id, challenger.uid);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      onAction();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsProcessing(false);
  };

  return (
    <Card className={cn(className)} style={style}>
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <UserAvatar user={{ uid: challenge.posterId, username: challenge.posterUsername, avatarUrl: challenge.posterAvatarUrl } as User} className="h-12 w-12" />
          <div className="space-y-1">
            <p className="font-semibold text-lg">@{challenge.posterUsername}</p>
            <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5">
                 <Image src={SPORT_ICONS[challenge.sport]} alt={challenge.sport} width={16} height={16} unoptimized/>
                 {challenge.sport}
              </span>
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {challenge.location}</span>
            </div>
            {challenge.note && <p className="text-sm italic text-muted-foreground">"{challenge.note}"</p>}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 self-end sm:self-center">
            {isOwner ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isProcessing}>
                    {isProcessing ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your open challenge. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button onClick={handleChallenge} disabled={isProcessing} size="sm">
                {isProcessing ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <Swords className="mr-2 h-4 w-4" />}
                Challenge
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
                Posted {formatDistanceToNow(new Date(challenge.createdAt), { addSuffix: true })}
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
