import { Logo } from './logo';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <Logo
      className={cn("animate-spin", className)}
    />
  );
}
