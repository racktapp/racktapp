import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export const Logo = React.forwardRef<
  HTMLImageElement,
  Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>
>(({ className, ...props }, ref) => (
  <Image
    ref={ref}
    src="/tennis_icon.png"
    alt="Rackt Logo"
    width={28}
    height={28}
    className={cn('h-7 w-7', className)}
    unoptimized
    {...props}
  />
));
Logo.displayName = 'Logo';
