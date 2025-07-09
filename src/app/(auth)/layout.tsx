
import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 relative">
        <Link href="/" className="absolute top-4 left-4 flex items-center gap-2 text-2xl font-bold text-primary z-10">
            <Logo />
            <h1 className="font-headline">Rackt</h1>
        </Link>
        <Link href="/" className="absolute top-4 right-4 z-10">
            <Button variant="ghost" size="icon" aria-label="Close">
                <X className="h-5 w-5" />
            </Button>
        </Link>
        {children}
    </div>
  );
}
