import Image from 'next/image';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <Image
      src="/tennis.svg"
      alt="Loading..."
      width={24}
      height={24}
      className={cn("animate-spin", className)}
      priority
    />
  );
}
