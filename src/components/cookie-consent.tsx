'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const COOKIE_CONSENT_KEY = 'cookie_consent';

export function CookieConsent() {
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(COOKIE_CONSENT_KEY) : null;
    if (stored === 'true') {
      setConsent(true);
    } else {
      setConsent(false);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    setConsent(true);
  };

  if (consent) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-start gap-3 border-t bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        We use cookies to remember your preferences.{' '}
        <Link href="/legal/privacy" className="underline" target="_blank">
          Learn more
        </Link>
      </p>
      <Button size="sm" onClick={accept} className="shrink-0">
        Accept
      </Button>
    </div>
  );
}

export default CookieConsent;
