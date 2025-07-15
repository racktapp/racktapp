

'use client';
import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createLegendGameAction, getFriendsAction } from '@/lib/actions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { User, Sport } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Users } from 'lucide-react';
import { SPORTS } from '@/lib/constants';

interface StartLegendFriendDialogProps {
  children: ReactNode;
  opponent?: User;
}

export function StartLegendFriendDialog({ children, opponent }: StartLegendFriendDialogProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [friends, setFriends] = useState<User[]>([]);
  const [isFetchingFriends, setIsFetchingFriends] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string>('');
  const [selectedSport, setSelectedSport] = useState<Sport>('Tennis');

  useEffect(() => {
    async function fetchFriends() {
      if (user) {
        setIsFetchingFriends(true);
        const friendsData = await getFriendsAction(user.uid);
        setFriends(friendsData);
        setIsFetchingFriends(false);
      }
    }
    if (open) {
        fetchFriends();
        if (opponent) {
            setSelectedFriendId(opponent.uid);
        }
    }
  }, [open, user, opponent]);

  const handleOpenChange = (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen) {
          setSelectedFriendId('');
          setSelectedSport('Tennis');
      }
  }

  async function handleChallenge() {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to challenge a friend.' });
        return;
    }
    if (!selectedFriendId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a friend to challenge.' });
        return;
    }
    setIsLoading(true);
    const result = await createLegendGameAction(selectedFriendId, selectedSport, user.uid);
    if (result.success && result.redirect) {
      toast({ title: 'Game Started!', description: `Challenge sent to your friend.` });
      router.push(result.redirect);
      setOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{opponent ? `Rematch @${opponent.username}` : 'Challenge a Friend'}</DialogTitle>
          <DialogDescription>{opponent ? 'Choose a sport for the rematch.' : 'Start a "Guess the Legend" game with a friend.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
            <div className='space-y-2'>
                <label className="text-sm font-medium">Friend</label>
                <Select onValueChange={setSelectedFriendId} value={selectedFriendId}>
                    <SelectTrigger disabled={isFetchingFriends || !!opponent}>
                        <SelectValue placeholder="Select a friend..." />
                    </SelectTrigger>
                    <SelectContent>
                        {isFetchingFriends ? (
                            <div className="flex items-center justify-center p-4">
                                <LoadingSpinner />
                            </div>
                        ) : friends.length > 0 ? (
                            friends.map((friend) => (
                                <SelectItem key={friend.uid} value={friend.uid}>
                                    @{friend.username}
                                </SelectItem>
                            ))
                        ) : (
                            <div className="p-4 text-sm text-muted-foreground">No friends found.</div>
                        )}
                    </SelectContent>
                </Select>
            </div>
            <div className='space-y-2'>
                 <label className="text-sm font-medium">Sport</label>
                 <Select onValueChange={(v) => setSelectedSport(v as Sport)} value={selectedSport}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a sport..." />
                    </SelectTrigger>
                    <SelectContent>
                        {SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button onClick={handleChallenge} disabled={isLoading || isFetchingFriends || !selectedFriendId} className="w-full">
                    {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <Users className="mr-2 h-4 w-4" />}
                    {opponent ? 'Send Rematch' : 'Challenge'}
                </Button>
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
