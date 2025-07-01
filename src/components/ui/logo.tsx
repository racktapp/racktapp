import * as React from "react"
import { cn } from "@/lib/utils"

export const Logo = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="img"
    aria-label="Rackt Logo"
    className={cn("h-7 w-7 bg-primary", className)}
    style={{
      maskImage: "url('/my-logo.svg')",
      maskSize: 'contain',
      maskRepeat: 'no-repeat',
      maskPosition: 'center',
      WebkitMaskImage: "url('/my-logo.svg')",
      WebkitMaskSize: 'contain',
      WebkitMaskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
    }}
    {...props}
  />
));
Logo.displayName = "Logo";
