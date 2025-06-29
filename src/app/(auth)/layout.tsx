import { ReactNode } from 'react';
import Link from 'next/link';
import {Flame} from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
        <Link href="/" className="mb-8 flex items-center gap-2 text-2xl font-bold text-primary">
            <Flame className="h-7 w-7" />
            <h1 className="font-headline">Rackt</h1>
        </Link>
        {children}
    </div>
  );
}
