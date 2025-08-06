
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import type { User as AppUser } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';

export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  reloadUser: () => Promise<void>; // Kept for API compatibility if used elsewhere
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppUser = useCallback(async (uid: string) => {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    return userDoc.exists() ? userDoc.data() as AppUser : null;
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
