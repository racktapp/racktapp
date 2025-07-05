import { ReactNode } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground min-h-screen">
       <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center">
            <Link href="/" className="flex items-center gap-2 font-bold text-primary">
                <Logo className="h-8 w-8" />
                <span className="text-2xl font-headline">Rackt</span>
            </Link>
        </div>
       </header>
       <main className="container mx-auto p-4 md:p-6 lg:p-8">
            {children}
       </main>
    </div>
  );
}
