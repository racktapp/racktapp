
'use client';
import { Card, CardFooter } from '@/components/ui/card';
import { LucideIcon, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsHighlightCardProps {
  title: string;
  value: string | number;
  description: string;
  footerText: string;
  footerValue?: number;
  icon: LucideIcon;
  colorClass: string;
}

const TrendIcon = ({ value }: { value?: number }) => {
  if (value === undefined) {
    return null;
  }
  if (value === 0) {
    return <Minus className="h-4 w-4 text-gray-500" />;
  }
  if (value > 0) {
    return <ArrowUp className="h-4 w-4 text-green-600" />;
  }
  return <ArrowDown className="h-4 w-4 text-red-600" />;
};

export function StatsHighlightCard({
  title,
  value,
  description,
  footerText,
  footerValue,
  icon: Icon,
  colorClass,
}: StatsHighlightCardProps) {
  return (
    <Card className="overflow-hidden shadow-sm transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
      <div className={cn('p-6 text-white', colorClass)}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/90">{title}</p>
            <p className="text-4xl font-bold">{value}</p>
            <p className="text-sm text-white/90">{description}</p>
          </div>
          <Icon className="h-8 w-8 text-white/80" />
        </div>
      </div>
      <CardFooter className="bg-card p-3">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <TrendIcon value={footerValue} />
          <span>{footerText}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
