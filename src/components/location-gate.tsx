
'use client';

import { Button } from '@/components/ui/button';
import React from 'react';

interface LocationGateProps {
  title: string;
  onEnable: () => Promise<void>;
  onManual: () => void;
  onSkip?: () => void;
}

export function LocationGate({ title, onEnable, onManual, onSkip }: LocationGateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">
        Used only to show nearby content. You can change this in Settings.
      </p>
      <div className="w-full max-w-xs space-y-2">
        <Button onClick={onEnable} className="w-full" aria-label="Enable location">
          Enable location
        </Button>
        <Button
          variant="outline"
          onClick={onManual}
          className="w-full"
          aria-label="Enter city manually"
        >
          Enter city manually
        </Button>
        {onSkip && (
          <Button
            variant="ghost"
            onClick={onSkip}
            className="w-full"
            aria-label="Continue without location"
          >
            Continue without location
          </Button>
        )}
      </div>
    </div>
  );
}

export default LocationGate;
