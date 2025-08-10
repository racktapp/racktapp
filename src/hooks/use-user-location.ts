
"use client";

import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { auth, db } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

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

  const saveUserLocation = async (lat: number, lng: number) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        latitude: lat,
        longitude: lng,
      });
    } catch (e) {
      console.error('Failed to save user location', e);
    }
  };

  const enableLocation = async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      if (Capacitor.isNativePlatform()) {
        const perm = await Geolocation.checkPermissions();
        if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
          await Geolocation.requestPermissions();
        }
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });
        await saveUserLocation(pos.coords.latitude, pos.coords.longitude);
        setState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          error: null,
          loading: false,
        });
      } else if (navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position: GeolocationPosition) => {
              saveUserLocation(position.coords.latitude, position.coords.longitude);
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
      } else {
        setState({
          latitude: null,
          longitude: null,
          error: 'Geolocation is not supported by your browser.',
          loading: false,
        });
      }
    } catch (e: any) {
      setState({
        latitude: null,
        longitude: null,
        error: e.message ?? String(e),
        loading: false,
      });
    }
  };

  return { ...state, enableLocation };
}
