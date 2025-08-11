
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export function useUserLocation() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true, // Start as true to indicate initial check
  });

  const enableLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setState({
        latitude: null,
        longitude: null,
        error: 'Geolocation is not supported by your browser.',
        loading: false,
      });
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        loading: false,
      });
    } catch (error: any) {
      setState({
        latitude: null,
        longitude: null,
        error: error.message || 'Failed to get location.',
        loading: false,
      });
    }
  }, []);

  // On initial mount, we don't automatically ask for location to respect user privacy.
  // We just set loading to false. The user must click a button to trigger `enableLocation`.
  useEffect(() => {
    setState(prev => ({ ...prev, loading: false }));
  }, []);

  return { ...state, enableLocation };
}
