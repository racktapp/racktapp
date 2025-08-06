
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, onSnapshot, limit, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { type Chat, type Message, type User as AppUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, MoreVertical, ShieldAlert } from 'lucide-react';
import { UserAvatar } from '@/components/user-avatar';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { sendMessageAction, markChatAsReadAction, reportUserAction } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '../ui/loading-spinner';


const messageSchema = z.object({
  text: z.string().min(1, 'Message cannot be empty.').max(500, 'Message is too long.'),
});

interface ChatViewProps {
  chat: Chat;
  currentUser: AppUser;
}

export function ChatView({ chat, currentUser }: ChatViewProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const otherParticipantId = chat.participantIds.find(id => id !== currentUser.uid)!;
  const otherParticipant = chat.participantsData[otherParticipantId];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { text: '' },
  });

  useEffect(() => {
    // Mark chat as read when component mounts
    markChatAsReadAction(chat.id, currentUser.uid);

    const messagesRef = collection(db, 'chats', chat.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => doc.data() as Message);
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [chat.id, currentUser.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onSubmit = async (values: z.infer<typeof messageSchema>) => {
    await sendMessageAction(chat.id, currentUser.uid, values.text);
    form.reset();
  };

  const handleReportUser = async () => {
    setIsReporting(true);
    try {
        await reportUserAction({
            reporterId: currentUser.uid,
            reportedId: otherParticipantId,
            chatId: chat.id,
        });
        toast({
            title: 'User Reported',
            description: 'Thank you for your feedback. We will review the report.',
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to submit report. Please try again later.',
        });
    } finally {
        setIsReporting(false);
        setIsReportDialogOpen(false);
    }
  }
  
  if (!otherParticipant) {
    return (
        <div className="flex h-full flex-col items-center justify-center p-4">
            <LoadingSpinner className="h-8 w-8" />
            <p className="mt-2 text-muted-foreground">Loading participant...</p>
        </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-muted/30">
        {/* Header */}
        <header className="flex items-center gap-4 border-b bg-background p-4 flex-shrink-0">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => router.push('/chat')}>
                <ArrowLeft />
            </Button>
            <UserAvatar user={{...otherParticipant, uid: otherParticipantId}} className="h-10 w-10" />
            <div className="flex-1">
                <p className="font-semibold">@{otherParticipant.username}</p>
            </div>
            <AlertDialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical />
                            <span className="sr-only">More options</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         <AlertDialogTrigger asChild>
                             <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                Report User
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
                 <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Report @{otherParticipant.username}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Reporting will flag this conversation for review. Are you sure you want to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReportUser} disabled={isReporting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            {isReporting ? <LoadingSpinner className="mr-2" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                            Yes, Report User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => {
                const isCurrentUser = msg.senderId === currentUser.uid;
                const showAvatar = index === messages.length - 1 || messages[index + 1].senderId !== msg.senderId;
                
                return (
                    <div key={msg.id} className={cn("flex items-end gap-2", isCurrentUser ? "justify-end" : "justify-start")}>
                        {!isCurrentUser && (
                            <div className="w-8 flex-shrink-0">
                                {showAvatar && <UserAvatar user={{...otherParticipant, uid: otherParticipantId}} className="h-8 w-8" />}
                            </div>
                        )}
                        <div className={cn(
                            "max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-3 py-2 text-sm",
                            isCurrentUser ? "bg-primary text-primary-foreground" : "bg-background"
                        )}>
                            <p>{msg.text}</p>
                             <p className={cn("text-xs mt-1", isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                {format(new Date(msg.createdAt), 'p')}
                            </p>
                        </div>
                         {isCurrentUser && (
                            <div className="w-8 flex-shrink-0">
                               {showAvatar && <UserAvatar user={currentUser} className="h-8 w-8" />}
                            </div>
                        )}
                    </div>
                );
            })}
             <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <footer className="border-t bg-background p-4 flex-shrink-0">
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
                <Input 
                    {...form.register('text')} 
                    placeholder="Type a message..." 
                    autoComplete="off"
                />
                <Button type="submit" size="icon" disabled={form.formState.isSubmitting}>
                    <Send />
                </Button>
            </form>
        </footer>
    </div>
  );
}
