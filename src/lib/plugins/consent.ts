import { registerPlugin } from '@capacitor/core';

export type ConsentStatus = {
  analytics: 'granted' | 'denied';
  ad_storage: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
};

export interface ConsentPlugin {
  request(): Promise<ConsentStatus>;
  getStatus(): Promise<ConsentStatus>;
}

export const Consent = registerPlugin<ConsentPlugin>('Consent');
