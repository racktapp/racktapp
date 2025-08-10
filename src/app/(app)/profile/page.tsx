'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

export default function ProfileRedirectPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  if (!loading && !user) {
    router.replace('/login');
    return null;
  }

  if (loading || !user) return <div className="p-4">Loading…</div>;

  router.replace(`/profile/${user.uid}`);
  return null;
}
