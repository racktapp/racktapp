import { ReactNode } from 'react';

export default function IntroLayout({ children }: { children: ReactNode }) {
  return (
    <main className="bg-background text-foreground">
      {children}
    </main>
  );
}
