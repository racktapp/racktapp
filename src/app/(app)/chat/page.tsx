
'use client';
import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/hooks/use-auth';
import { ChatList } from '@/components/chat/chat-list';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import ClientView from './ClientView';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ChatPageContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const chatId = searchParams.get('id');
    
    if (chatId) {
        return <ClientView id={chatId} />;
    }
    
    if (!user) {
        return (
            <div className="container mx-auto p-4 md:p-6 lg:p-8 flex h-full items-center justify-center">
                <LoadingSpinner className="h-8 w-8" />
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <PageHeader
                title="Conversations"
                description="Your recent chats with other players."
            />
            <ChatList currentUserId={user.uid} />
        </div>
    );
}

export default function ChatsPage() {
    return (
        <Suspense fallback={<div className="flex h-full items-center justify-center"><LoadingSpinner className="h-8 w-8"/></div>}>
            <ChatPageContent />
        </Suspense>
    )
}
