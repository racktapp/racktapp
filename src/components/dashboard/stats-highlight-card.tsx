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
  textColorClass?: string;
}

const FooterTrendIcon = ({ value }: { value?: number }) => {
  if (value === undefined) return null;
  if (value === 0) return <Minus className="h-4 w-4 text-gray-500" />;
  if (value > 0) return <ArrowUp className="h-4 w-4 text-[#29C771]" />;
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
  textColorClass = 'text-white',
}: StatsHighlightCardProps) {
  return (
    <Card className="overflow-hidden shadow-sm transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
      <div className={cn('p-4 sm:p-6', colorClass, textColorClass)}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">{title}</p>
            <p className="text-3xl sm:text-4xl font-semibold tracking-tight">{value}</p>
            <p className="text-sm opacity-90 mt-1">{description}</p>
          </div>
          <Icon className="h-8 w-8 opacity-80" />
        </div>
      </div>
      <CardFooter className="bg-muted p-3">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <FooterTrendIcon value={footerValue} />
          <span>{footerText}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
