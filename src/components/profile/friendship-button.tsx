'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { UserCheck, UserPlus, UserX, MoreHorizontal, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  addFriendAction, 
  removeFriendAction, 
  acceptFriendRequestAction, 
  declineOrCancelFriendRequestAction, 
  getFriendshipStatusAction 
} from '@/lib/actions';
import { type User as AppUser } from '@/lib/types';

interface FriendshipButtonProps {
  profileUser: AppUser;
  currentUser: AppUser;
}

type FriendshipStatus = 'loading' | 'friends' | 'request_sent' | 'request_received' | 'not_friends';

export function FriendshipButton({ profileUser, currentUser }: FriendshipButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<FriendshipStatus>('loading');
  const [requestId, setRequestId] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      if (!profileUser?.uid || !currentUser?.uid) {
        setStatus('not_friends');
        return;
      }
      
      try {
        const result = await getFriendshipStatusAction(profileUser.uid, currentUser.uid);
        if (result && result.status) {
          setStatus(result.status as FriendshipStatus);
          setRequestId(result.requestId);
        } else {
          console.error("Invalid response from getFriendshipStatusAction", result);
          setStatus('not_friends');
        }
      } catch (error) {
        console.error("Failed to get friendship status:", error);
        setStatus('not_friends');
      }
    }
    checkStatus();
  }, [profileUser.uid, currentUser.uid]);
  
  const handleAction = async (action: () => Promise<any>) => {
    setIsProcessing(true);
    try {
        await action();
        const result = await getFriendshipStatusAction(profileUser.uid, currentUser.uid);
        if (result && result.status) {
          setStatus(result.status as FriendshipStatus);
          setRequestId(result.requestId);
        } else {
            setStatus('not_friends');
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
        setStatus('not_friends');
    } finally {
        setIsProcessing(false);
    }
  };

  if (status === 'loading') {
    return <Button variant="outline" size="sm" disabled><LoadingSpinner /></Button>;
  }

  if (status === 'friends') {
    return (
       <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Friends
                    <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => handleAction(() => removeFriendAction(currentUser.uid, profileUser.uid))}>
                    {isProcessing ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <UserX className="mr-2 h-4 w-4" />}
                    Remove Friend
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
  }

  if (status === 'request_sent') {
    return (
      <Button variant="secondary" disabled>Request Sent</Button>
    );
  }

  if (status === 'request_received') {
    return (
      <div className="flex gap-2">
        <Button onClick={() => handleAction(() => acceptFriendRequestAction(requestId!, profileUser.uid, currentUser.uid))}>
          {isProcessing ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
          Accept
        </Button>
        <Button variant="destructive" onClick={() => handleAction(() => declineOrCancelFriendRequestAction(requestId!))}>
            <UserX className="mr-2 h-4 w-4" /> Decline
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => handleAction(() => addFriendAction(currentUser, profileUser))} disabled={isProcessing}>
      {isProcessing ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
      Add Friend
    </Button>
  );
}
