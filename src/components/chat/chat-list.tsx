

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { type Chat } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { UserAvatar } from '@/components/user-avatar';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';


interface ChatListItemProps {
    chat: Chat;
    currentUserId: string;
}

function ChatListItem({ chat, currentUserId }: ChatListItemProps) {
    const otherParticipantId = chat.participantIds.find(id => id !== currentUserId);
    if (!otherParticipantId) return null;

    const otherParticipant = chat.participantsData[otherParticipantId];
    const hasUnread = (chat.lastRead?.[currentUserId] ?? 0) < chat.updatedAt;

    return (
        <Link href={`/chat?id=${chat.id}`} className="block">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="relative">
                        <UserAvatar user={{ ...otherParticipant, uid: otherParticipantId }} className="h-12 w-12" />
                        {hasUnread && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-primary ring-2 ring-card" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-start">
                            <p className="font-semibold truncate">@{otherParticipant.username}</p>
                            <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                            {chat.lastMessage?.text || 'No messages yet'}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}


export function ChatList({ currentUserId }: { currentUserId: string }) {
    const [chats, setChats] = useState<Chat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    
    useEffect(() => {
        const chatsRef = collection(db, 'chats');
        const q = query(
            chatsRef, 
            where('participantIds', 'array-contains', currentUserId),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatsData = snapshot.docs.map(doc => doc.data() as Chat);
            setChats(chatsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching chats:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not load chats. This may be due to a missing database index.'
            });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [currentUserId, toast]);

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <LoadingSpinner className="h-8 w-8" />
            </div>
        )
    }

    if (chats.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">You have no active conversations.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {chats.map(chat => (
                <ChatListItem key={chat.id} chat={chat} currentUserId={currentUserId} />
            ))}
        </div>
    );
}
