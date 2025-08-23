'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Consent, ConsentStatus } from '@/lib/plugins/consent';
import { analytics } from '@/lib/firebase/config';
import { setAnalyticsCollectionEnabled } from 'firebase/analytics';

const defaultStatus: ConsentStatus = {
  analytics: 'denied',
  ad_storage: 'denied',
  ad_personalization: 'denied',
};

interface ConsentContextValue {
  status: ConsentStatus;
  request: () => Promise<ConsentStatus>;
}

const ConsentContext = createContext<ConsentContextValue>({
  status: defaultStatus,
  request: async () => defaultStatus,
});

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConsentStatus>(defaultStatus);

  useEffect(() => {
    Consent.getStatus().then((res) => {
      setStatus(res);
      if (analytics) {
        setAnalyticsCollectionEnabled(analytics, res.analytics === 'granted');
      }
    });
  }, []);

  const request = async () => {
    const res = await Consent.request();
    setStatus(res);
    if (analytics) {
      setAnalyticsCollectionEnabled(analytics, res.analytics === 'granted');
    }
    return res;
  };

  return (
    <ConsentContext.Provider value={{ status, request }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  return useContext(ConsentContext);
}
