import { TennisBall } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <TennisBall
      className={cn("animate-spin", className)}
    />
  );
}
