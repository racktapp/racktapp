import Image from 'next/image';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <Image
      src="/my-logo1.svg"
      alt="Loading..."
      width={50}
      height={50}
      className={cn("animate-spin", className)}
    />
  );
}
