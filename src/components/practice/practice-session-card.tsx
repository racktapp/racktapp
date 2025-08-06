

'use client';

import { useState } from 'react';
import { PracticeSession, Sport } from '@/lib/types';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { SPORT_ICONS } from '@/lib/constants';
import { Clock, Flame, Dumbbell, Trash2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { deletePracticeSessionAction } from '@/lib/actions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';


interface PracticeSessionCardProps {
  session: PracticeSession;
  className?: string;
  style?: React.CSSProperties;
  onSessionDeleted: () => void;
}

const intensityMap: Record<PracticeSession['intensity'], { label: string; color: string; icon: React.ReactNode }> = {
    low: { label: 'Low', color: 'bg-blue-500/20 text-blue-700', icon: <Dumbbell className="h-3 w-3" /> },
    medium: { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-700', icon: <Dumbbell className="h-3 w-3" /> },
    high: { label: 'High', color: 'bg-red-500/20 text-red-700', icon: <Flame className="h-3 w-3" /> },
};


export function PracticeSessionCard({ session, className, style, onSessionDeleted }: PracticeSessionCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const intensity = intensityMap[session.intensity];

  const handleDelete = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
        const result = await deletePracticeSessionAction(session.id, user.uid);
        if (result.success) {
            toast({ title: "Session Deleted", description: "Your practice log has been removed." });
            onSessionDeleted();
        } else {
            throw new Error(result.message);
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Error", description: error.message || "Could not delete the session." });
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)} style={style}>
        <CardHeader>
            <div className="flex justify-between items-start">
                <CardTitle>{format(new Date(session.date), 'MMMM d, yyyy')}</CardTitle>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1.5">
                        <Image src={SPORT_ICONS[session.sport]} alt={session.sport} width={14} height={14} unoptimized/>
                        {session.sport}
                    </Badge>
                </div>
            </div>
            <CardDescription>Logged {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}</CardDescription>
        </CardHeader>
      <CardContent className="space-y-4">
        {session.notes && <p className="italic text-muted-foreground">"{session.notes}"</p>}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{session.duration} mins</span>
            <Badge variant="outline" className={cn("border-transparent font-semibold", intensity.color)}>
                {intensity.icon}
                Intensity: {intensity.label}
            </Badge>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-2 justify-end">
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This will permanently delete this practice log. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        {isDeleting ? <LoadingSpinner /> : <Trash2 />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
