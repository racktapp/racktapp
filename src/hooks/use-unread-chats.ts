
'use client';
import { useState, useEffect } from 'react';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './use-auth';
import type { Chat } from '@/lib/types';

export function useUnreadChats() {
    const { user } = useAuth();
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        if (!user) {
            setHasUnread(false);
            return;
        };

        const chatsRef = collection(db, 'chats');
        const q = query(chatsRef, where('participantIds', 'array-contains', user.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const anyUnread = snapshot.docs.some(doc => {
                const chat = doc.data() as Chat;
                const lastReadTime = chat.lastRead?.[user.uid] ?? 0;
                // Check if lastMessage exists and is newer than lastReadTime
                return chat.lastMessage && chat.updatedAt > lastReadTime && chat.lastMessage.senderId !== user.uid;
            });
            setHasUnread(anyUnread);
        });

        return () => unsubscribe();
    }, [user]);

    return hasUnread;
}
