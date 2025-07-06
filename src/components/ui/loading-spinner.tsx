import Image from 'next/image';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <Image
      src="/logo2.png"
      alt="Loading..."
      width={28}
      height={28}
      className={cn('animate-spin h-7 w-7', className)}
      unoptimized
    />
  );
}
