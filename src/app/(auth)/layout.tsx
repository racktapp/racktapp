
import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Left side with image - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-muted relative">
          <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-2xl font-bold text-primary z-10">
              <Logo />
              <h1 className="font-headline">Rackt</h1>
          </Link>
          <Image 
            src="https://placehold.co/1000x1200.png" 
            data-ai-hint="tennis court"
            alt="A tennis court from above" 
            width={1000} 
            height={1200} 
            className="object-cover h-full w-full"
            priority
          />
      </div>

      {/* Right side with form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 relative">
          <Link href="/" className="absolute top-4 right-4 z-10">
              <Button variant="ghost" size="icon" aria-label="Close">
                  <X className="h-5 w-5" />
              </Button>
          </Link>
          <Link href="/" className="lg:hidden mb-8 flex items-center gap-2 text-2xl font-bold text-primary">
              <Logo />
              <h1 className="font-headline">Rackt</h1>
          </Link>
          {children}
      </div>
    </div>
  );
}
