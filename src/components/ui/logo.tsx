import * as React from 'react';
import {cn} from '@/lib/utils';

export const Logo = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({className, ...props}, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('h-7 w-7 text-primary', className)}
      {...props}
    >
      <title>Rackt Logo</title>
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
      <path d="M4.2 16.9a8 8 0 0 1 11.2-11.2" />
    </svg>
  )
);
Logo.displayName = 'Logo';