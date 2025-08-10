
'use client';

import { useState } from 'react';

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
    loading: false,
  });

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setState({
        latitude: null,
        longitude: null,
        error: 'Geolocation is not supported by your browser.',
        loading: false,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            error: null,
            loading: false,
          });
          resolve();
        },
        (error: GeolocationPositionError) => {
          setState({
            latitude: null,
            longitude: null,
            error: error.message,
            loading: false,
          });
          resolve();
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  return { ...state, requestLocation };
}
