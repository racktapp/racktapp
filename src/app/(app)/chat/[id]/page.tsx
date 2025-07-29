
'use client';
import { useParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { type Chat } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { ChatView } from '@/components/chat/chat-view';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Required for static export
export async function generateStaticParams() {
  return [];
}

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const chatId = params.id as string;

  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId || !user) return;

    const chatRef = doc(db, 'chats', chatId);
    const unsubscribe = onSnapshot(chatRef, (doc) => {
      if (doc.exists()) {
        const chatData = doc.data() as Chat;
        if (chatData.participantIds.includes(user.uid)) {
            setChat(chatData);
        } else {
            setChat(null); // User not part of this chat
        }
      } else {
        setChat(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId, user]);

  if (loading || authLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!chat) {
    return (
        <div className="flex h-full flex-col items-center justify-center p-4">
            <p className="text-muted-foreground">Chat not found or you don't have access.</p>
        </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ChatView chat={chat} currentUser={user!} />
    </div>
  );
}
