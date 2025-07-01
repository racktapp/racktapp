import * as React from "react"
import { cn } from "@/lib/utils"

export const Logo = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
  <svg
    ref={ref}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("h-7 w-7", className)}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M4.2 8.8a10.3 10.3 0 0 1 15.6 0" />
    <path d="M4.2 15.2a10.3 10.3 0 0 0 15.6 0" />
  </svg>
));
Logo.displayName = "Logo";
