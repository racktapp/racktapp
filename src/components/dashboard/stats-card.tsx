
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  progress?: number;
}

export function StatsCard({ title, value, icon: Icon, progress }: StatsCardProps) {
  return (
    <Card className="p-1">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
            <div className="bg-primary/10 p-2.5 rounded-full">
                <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
        </div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {progress !== undefined && <Progress value={progress} className="mt-2 h-1.5" />}
      </CardContent>
    </Card>
  );
}
