'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Search, Loader2 } from 'lucide-react';
import { User } from '@/lib/types';
import { searchUsersAction, addFriendAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { UserAvatar } from '@/components/user-avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

const UserResultCard = ({ user, onAddFriend }: { user: User; onAddFriend: (userId: string, userName: string) => void }) => {
    const [isAdded, setIsAdded] = useState(false);

    const handleAddClick = () => {
        onAddFriend(user.uid, user.name);
        setIsAdded(true);
    }

    return (
        <Card>
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <UserAvatar user={user} className="h-12 w-12" />
                    <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                </div>
                <Button onClick={handleAddClick} disabled={isAdded}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {isAdded ? 'Request Sent' : 'Add Friend'}
                </Button>
            </CardContent>
        </Card>
    );
};


export default function FriendsPage() {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim() || !currentUser) return;

        setIsLoading(true);
        setHasSearched(true);
        setSearchResults([]);
        try {
            const results = await searchUsersAction(searchQuery, currentUser.uid);
            setSearchResults(results);
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Search Failed',
                description: 'Could not perform the search. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAddFriend = async (friendId: string, friendName: string) => {
        await addFriendAction(friendId);
        toast({
            title: "Friend Request Sent",
            description: `Your friend request has been sent to ${friendName}.`,
        });
    }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Find Friends"
        description="Search for other players by their username to add them."
      />
      
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <Input 
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button type="submit" disabled={isLoading || !searchQuery.trim()}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Search
        </Button>
      </form>

      <div className="space-y-4">
        {isLoading ? (
             <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
        ) : hasSearched ? (
            searchResults.length > 0 ? (
                searchResults.map(user => (
                    <UserResultCard key={user.uid} user={user} onAddFriend={handleAddFriend} />
                ))
            ) : (
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                    <p className="text-muted-foreground">No users found for "{searchQuery}". Try another search.</p>
                </div>
            )
        ) : (
             <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">Use the search bar above to find and add friends.</p>
             </div>
        )}
      </div>

    </div>
  );
}
