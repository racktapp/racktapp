'use client';

import * as React from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export const Logo = React.forwardRef<
  HTMLImageElement,
  Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>
>(({ className, ...props }, ref) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder or null to avoid hydration mismatch
    // before the client-side theme is known.
    return <div className={cn('h-7 w-7', className)} />;
  }

  const logoSrc = resolvedTheme === 'dark' ? '/logodark.png' : '/logo2.png';

  return (
    <Image
      ref={ref}
      src={logoSrc}
      alt="Rackt Logo"
      width={28}
      height={28}
      className={cn('h-7 w-7', className)}
      unoptimized
      key={resolvedTheme} // Add key to force re-render on theme change
      {...props}
    />
  );
});
Logo.displayName = 'Logo';
