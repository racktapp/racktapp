
'use client';

import { PracticeSession, Sport } from '@/lib/types';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { SPORT_ICONS } from '@/lib/constants';
import { Clock, Flame, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PracticeSessionCardProps {
  session: PracticeSession;
  className?: string;
  style?: React.CSSProperties;
}

const intensityMap: Record<PracticeSession['intensity'], { label: string; color: string; icon: React.ReactNode }> = {
    low: { label: 'Low', color: 'bg-blue-500/20 text-blue-700', icon: <Dumbbell className="h-3 w-3" /> },
    medium: { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-700', icon: <Dumbbell className="h-3 w-3" /> },
    high: { label: 'High', color: 'bg-red-500/20 text-red-700', icon: <Flame className="h-3 w-3" /> },
};


export function PracticeSessionCard({ session, className, style }: PracticeSessionCardProps) {
  const intensity = intensityMap[session.intensity];
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
        <p className="italic text-muted-foreground">"{session.notes}"</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{session.duration} mins</span>
            <Badge variant="outline" className={cn("border-transparent font-semibold", intensity.color)}>
                {intensity.icon}
                Intensity: {intensity.label}
            </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
