

'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import type { User as AppUser } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { createUserDocument } from '@/lib/firebase/firestore';

export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  reloadUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAndSetUser = useCallback(async (firebaseUser: FirebaseUser | null) => {
    try {
        if (firebaseUser) {
          await firebaseUser.reload(); // Get the latest user state from Firebase Auth
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          
          let userProfile: AppUser;

          if (userDoc.exists()) {
            userProfile = userDoc.data() as AppUser;
          } else {
            // This case handles user creation via providers like Google
            userProfile = await createUserDocument({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || 'New User',
              emailVerified: firebaseUser.emailVerified,
              photoURL: firebaseUser.photoURL,
            });
          }
          
          // Ensure the local state is always consistent with Firebase Auth
          const appUser: AppUser = {
            ...userProfile,
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            username: firebaseUser.displayName || userProfile.username,
            avatarUrl: firebaseUser.photoURL || userProfile.avatarUrl,
            emailVerified: firebaseUser.emailVerified,
          };

          setUser(appUser);
        } else {
          setUser(null);
        }
      } catch (error) {
          console.error("Auth State Change Error:", error);
          setUser(null);
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        fetchAndSetUser(firebaseUser);
    });
    return () => unsubscribe();
  }, [fetchAndSetUser]);
  
  const reloadUser = useCallback(async () => {
    if (auth.currentUser) {
        setLoading(true);
        await fetchAndSetUser(auth.currentUser);
        setLoading(false);
    }
  }, [fetchAndSetUser]);

  const value = { user, loading, reloadUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
