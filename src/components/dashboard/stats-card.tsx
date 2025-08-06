'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
  style?: React.CSSProperties;
}

export function StatsCard({ title, value, icon: Icon, className, style }: StatsCardProps) {
  return (
    <Card className={cn(className)} style={style}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
