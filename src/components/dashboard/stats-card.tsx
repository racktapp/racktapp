
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
    <Card className={cn("p-1", className)} style={style}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
            <div className="bg-primary/10 p-2.5 rounded-full">
                <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
        </div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  );
}
