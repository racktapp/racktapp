'use client';

import { PageHeader } from '@/components/page-header';
import { useConsent } from '@/components/providers/consent-provider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PrivacyConsentPage() {
  const { status, request } = useConsent();

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Privacy & Consent"
        description="Review or change your privacy choices."
      />
      <div className="max-w-2xl mx-auto grid gap-4">
        <div>
          <p>Analytics: {status.analytics}</p>
          <p>Ads: {status.ad_personalization}</p>
        </div>
        <Button onClick={request}>Change consent</Button>
        <Link className="text-sm text-muted-foreground underline" href="https://rackt.app/privacy">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
