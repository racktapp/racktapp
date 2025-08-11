
"use client";

import { useState, useEffect, useCallback } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  manualLocation: boolean;
}

export function useUserLocation() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
    manualLocation: false,
  });

  const setManualLocation = useCallback(() => {
    setState((prev) => ({ ...prev, manualLocation: true, loading: false }));
  }, []);

  const enableLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null, manualLocation: false }));

    if (!navigator.geolocation) {
      setState({
        latitude: null,
        longitude: null,
        error: 'Geolocation is not supported by your browser.',
        loading: false,
        manualLocation: false,
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
        manualLocation: false,
      });
    } catch (error: any) {
      setState({
        latitude: null,
        longitude: null,
        error: error.message || 'Failed to get location.',
        loading: false,
        manualLocation: true, // Fallback to manual on error
      });
    }
  }, []);

  // On initial mount, just set loading to false.
  useEffect(() => {
    setState(prev => ({ ...prev, loading: false }));
  }, []);

  return { ...state, enableLocation, setManualLocation };
}
