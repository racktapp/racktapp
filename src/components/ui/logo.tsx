import * as React from "react"
import { cn } from "@/lib/utils"

export const Logo = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <img
    ref={ref}
    src="/my-logo.svg"
    alt="Rackt Logo"
    className={cn("h-7 w-7", className)}
    {...props}
  />
));
Logo.displayName = "Logo";
