
'use client';

import React, { useState, useEffect, useCallback, ReactNode, Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Search, UserMinus, UserCheck, UserX, Users, Mail, Send, MoreHorizontal, Swords, MessageSquare, Gamepad2 } from 'lucide-react';
import { User, FriendRequest } from '@/lib/types';
import { 
    searchUsersAction, 
    addFriendAction,
    getFriendsAction,
    getIncomingRequestsAction,
    getSentRequestsAction,
    acceptFriendRequestAction,
    declineOrCancelFriendRequestAction,
    removeFriendAction,
    getOrCreateChatAction,
    createRallyGameAction,
    createLegendGameAction
} from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { UserAvatar } from '@/components/user-avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { ChallengeFriendDialog } from '@/components/challenges/challenge-friend-dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';

// --- Reusable Card Components ---

const UserCard = ({ user, children, className, ...props }: { user: Partial<User>, children: ReactNode, className?: string, [key: string]: any }) => (
    <Card className={cn(className)} {...props}>
        <CardContent className="p-4 flex items-center justify-between gap-4">
            <Link href={`/profile/${user.uid}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                <UserAvatar user={user as User} className="h-12 w-12" />
                <div>
                    <p className="font-semibold">@{user.username}</p>
                </div>
            </Link>
            <div className="flex gap-2">{children}</div>
        </CardContent>
    </Card>
);

const ActionButton = ({ onClick, isProcessing, idleIcon, processingText, buttonText, variant = 'default' }: any) => {
    return (
        <Button onClick={onClick} disabled={isProcessing} variant={variant} size="sm">
            {isProcessing ? <LoadingSpinner className="mr-2 h-4 w-4" /> : idleIcon}
            {isProcessing ? processingText : buttonText}
        </Button>
    )
}

// --- Main Page Component ---
function FriendsPageContent() {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'friends';

    // State for all data
    const [friends, setFriends] = useState<User[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
    const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
    const [searchResults, setSearchResults] = useState<User[]>([]);
    
    // State for UI
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [processingIds, setProcessingIds] = useState<string[]>([]);

    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const [friendsData, incomingData, sentData] = await Promise.all([
                getFriendsAction(currentUser.uid),
                getIncomingRequestsAction(currentUser.uid),
                getSentRequestsAction(currentUser.uid)
            ]);
            setFriends(friendsData);
            setIncomingRequests(incomingData);
            setSentRequests(sentData);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load friends data.' });
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAction = async (action: () => Promise<{success: boolean, message: string, [key: string]: any}>, id: string) => {
        setProcessingIds(prev => [...prev, id]);
        const result = await action();
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            if (result.redirect) {
                router.push(result.redirect);
            } else {
                await fetchData(); // Refresh all data
                if (searchQuery) { // Re-run search to update button states
                    const searchResults = await searchUsersAction(searchQuery, currentUser!.uid);
                    setSearchResults(searchResults);
                }
            }
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        setProcessingIds(prev => prev.filter(pId => pId !== id));
    };

    const handleStartChat = async (friendId: string) => {
        handleAction(() => getOrCreateChatAction(friendId, currentUser!.uid), friendId);
    };
    
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim() || !currentUser) return;
        setIsSearching(true);
        setHasSearched(true);
        const results = await searchUsersAction(searchQuery, currentUser.uid);
        setSearchResults(results);
        setIsSearching(false);
    };

    if (isLoading || !currentUser) {
        return (
            <div className="container mx-auto flex h-full items-center justify-center p-4 md:p-6 lg:p-8">
                <LoadingSpinner className="h-8 w-8" />
            </div>
        );
    }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Friends"
        description="Manage your connections and find new people."
      />
      
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="friends"><Users className="mr-2" /> Friends</TabsTrigger>
            <TabsTrigger value="requests">
                <Mail className="mr-2" /> Requests
                {incomingRequests.length > 0 && <Badge className="ml-2">{incomingRequests.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="sent"><Send className="mr-2" /> Sent</TabsTrigger>
            <TabsTrigger value="find"><Search className="mr-2" /> Find</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-4 space-y-4">
            {friends.length > 0 ? (
                friends.map((friend, i) => (
                    <UserCard 
                      key={friend.uid} 
                      user={friend}
                      className="opacity-0 animate-fade-in-slide-up"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                        <Button variant="outline" size="sm" onClick={() => handleStartChat(friend.uid)} disabled={processingIds.includes(friend.uid)}>
                            {processingIds.includes(friend.uid) ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                            Chat
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <ChallengeFriendDialog fromUser={currentUser} toUser={friend}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Swords className="mr-2 h-4 w-4" />
                                        Challenge
                                    </DropdownMenuItem>
                                </ChallengeFriendDialog>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <Gamepad2 className="mr-2 h-4 w-4" />
                                        <span>Play Game</span>
                                    </DropdownMenuSubTrigger>
                                     <DropdownMenuPortal>
                                        <DropdownMenuSubContent>
                                             <DropdownMenuItem onSelect={() => handleAction(() => createRallyGameAction(friend.uid, currentUser.uid, currentUser.preferredSports[0] || 'Tennis'), friend.uid + 'rally')}>
                                                {processingIds.includes(friend.uid + 'rally') ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <Swords className="mr-2 h-4 w-4" />}
                                                Rally Game
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleAction(() => createLegendGameAction(friend.uid, currentUser.preferredSports[0] || 'Tennis', currentUser.uid), friend.uid + 'legend')}>
                                                {processingIds.includes(friend.uid + 'legend') ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <Users className="mr-2 h-4 w-4" />}
                                                Guess the Legend
                                            </DropdownMenuItem>
                                        </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuSub>
                                <DropdownMenuItem onClick={() => handleAction(() => removeFriendAction(currentUser!.uid, friend.uid), friend.uid)}>
                                     {processingIds.includes(friend.uid + 'remove') ? 
                                        <LoadingSpinner className="mr-2 h-4 w-4" /> : 
                                        <UserMinus className="mr-2 h-4 w-4" />}
                                    Remove Friend
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </UserCard>
                ))
            ) : (
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                    <p className="text-muted-foreground">You haven't added any friends yet.</p>
                </div>
            )}
        </TabsContent>
        
        <TabsContent value="requests" className="mt-4 space-y-4">
             {incomingRequests.length > 0 ? (
                incomingRequests.map((req, i) => (
                    <UserCard 
                      key={req.id} 
                      user={{ uid: req.fromId, username: req.fromUsername, avatarUrl: req.fromAvatarUrl }}
                      className="opacity-0 animate-fade-in-slide-up"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                        <ActionButton
                            onClick={() => handleAction(() => acceptFriendRequestAction(req.id, req.fromId, currentUser!.uid), req.id + 'accept')}
                            isProcessing={processingIds.includes(req.id + 'accept')}
                            idleIcon={<UserCheck className="mr-2 h-4 w-4" />}
                            processingText="Accepting..."
                            buttonText="Accept"
                        />
                         <ActionButton
                            onClick={() => handleAction(() => declineOrCancelFriendRequestAction(req.id), req.id + 'decline')}
                            isProcessing={processingIds.includes(req.id + 'decline')}
                            idleIcon={<UserX className="mr-2 h-4 w-4" />}
                            processingText="Declining..."
                            buttonText="Decline"
                            variant="destructive"
                        />
                    </UserCard>
                ))
            ) : (
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                    <p className="text-muted-foreground">No incoming friend requests.</p>
                </div>
            )}
        </TabsContent>

        <TabsContent value="sent" className="mt-4 space-y-4">
            {sentRequests.length > 0 ? (
                sentRequests.map((req, i) => (
                     <UserCard 
                        key={req.id} 
                        user={{ uid: req.toId, username: req.toUsername, avatarUrl: req.toAvatarUrl }}
                        className="opacity-0 animate-fade-in-slide-up"
                        style={{ animationDelay: `${i * 100}ms` }}
                     >
                        <ActionButton
                            onClick={() => handleAction(() => declineOrCancelFriendRequestAction(req.id), req.id)}
                            isProcessing={processingIds.includes(req.id)}
                            idleIcon={<UserX className="mr-2 h-4 w-4" />}
                            processingText="Canceling..."
                            buttonText="Cancel"
                            variant="outline"
                        />
                    </UserCard>
                ))
            ) : (
                 <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                    <p className="text-muted-foreground">You have no pending sent requests.</p>
                </div>
            )}
        </TabsContent>

        <TabsContent value="find" className="mt-4">
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                <Input placeholder="Search by username..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
                    {isSearching ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />}
                    Search
                </Button>
            </form>
            <div className="space-y-4">
                {isSearching ? (
                    <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                        <LoadingSpinner className="h-8 w-8" />
                    </div>
                ) : hasSearched ? (
                    searchResults.length > 0 ? (
                        searchResults.map((user, i) => (
                            <UserCard 
                                key={user.uid} 
                                user={user}
                                className="opacity-0 animate-fade-in-slide-up"
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <ActionButton
                                    onClick={() => handleAction(() => addFriendAction(currentUser!, user), user.uid)}
                                    isProcessing={processingIds.includes(user.uid)}
                                    idleIcon={<UserPlus className="mr-2 h-4 w-4" />}
                                    processingText="Sending..."
                                    buttonText="Add Friend"
                                />
                            </UserCard>
                        ))
                    ) : (
                        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                             <p className="text-muted-foreground">No users found for "{searchQuery}".</p>
                        </div>
                    )
                ) : (
                    <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                        <p className="text-muted-foreground">Search for users to add them as friends.</p>
                    </div>
                )}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


export default function FriendsPage() {
    return (
        <Suspense fallback={<div className="container mx-auto flex h-full items-center justify-center p-4 md:p-6 lg:p-8"><LoadingSpinner className="h-8 w-8" /></div>}>
            <FriendsPageContent />
        </Suspense>
    );
}
