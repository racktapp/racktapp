import { redirect } from 'next/navigation';

// This page is now a simple, static server component that always redirects.
// This is the most stable approach for the Next.js App Router, preventing
// client-side hooks from causing issues during the build process.
// The logic to handle authenticated vs. unauthenticated users is now
// consolidated in the /intro page.
export default function Home() {
  redirect('/intro');
}
