import { ReactNode } from 'react';

// This is a simple layout for all public-facing pages
// like the intro and legal pages. It does not contain any
// authentication logic, so it's safe for the Next.js build process.
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
