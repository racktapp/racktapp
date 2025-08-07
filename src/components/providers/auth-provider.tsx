'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { auth, db, initializeFirebase } from '@/lib/firebase/config';
import type { User as AppUser } from '@/lib/types';
import { doc, getDoc, Timestamp } from 'firebase/firestore';

// Helper to convert Firestore Timestamps to numbers recursively
function convertTimestampsToNumbers(obj: any): any {
    if (obj instanceof Timestamp) {
        return obj.toMillis();
    }
    if (Array.isArray(obj)) {
        return obj.map(convertTimestampsToNumbers);
    }
    if (obj !== null && typeof obj === 'object') {
        const newObj: { [key: string]: any } = {};
        for (const key in obj) {
            newObj[key] = convertTimestampsToNumbers(obj[key]);
        }
        return newObj;
    }
    return obj;
}


export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  reloadUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Firebase client-side
  useEffect(() => {
    initializeFirebase();
  }, []);

  const fetchAppUser = useCallback(async (uid: string): Promise<AppUser | null> => {
    if (!db) { // Guard against db not being initialized
        console.error("Firestore not initialized for fetchAppUser");
        return null;
    }
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return null;
    // Convert timestamps before returning
    return convertTimestampsToNumbers(userDoc.data()) as AppUser;
  }, []);
  
  const reloadUser = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
        setLoading(true);
        await firebaseUser.reload();
        const appUser = await fetchAppUser(firebaseUser.uid);
        if (appUser) {
             setUser({
                ...appUser,
                emailVerified: firebaseUser.emailVerified,
                username: firebaseUser.displayName || appUser.username,
             });
        }
        setLoading(false);
    }
  }, [fetchAppUser]);


  useEffect(() => {
    if (!auth) {
        // Firebase might not be initialized yet.
        // The effect in initializeFirebase will trigger a re-render.
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const appUser = await fetchAppUser(firebaseUser.uid);
        if (appUser) {
            setUser({
                ...appUser,
                emailVerified: firebaseUser.emailVerified,
                username: firebaseUser.displayName || appUser.username,
            });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchAppUser]);

  const value = { user, loading, reloadUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
