'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import type { User } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { createUserDocument } from '@/lib/firebase/firestore';

export interface AuthContextType {
  user: (FirebaseUser & User) | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<(FirebaseUser & User) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          
          let userProfile: User;

          if (userDoc.exists()) {
            userProfile = userDoc.data() as User;
          } else {
            // If user exists in Auth but not Firestore (e.g., first login, or data wiped),
            // create their user document to ensure app functionality.
            userProfile = await createUserDocument({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || 'New User',
            });
          }
          setUser({ ...firebaseUser, ...userProfile });
        } else {
          setUser(null);
        }
      } catch (error) {
          console.error("Auth State Change Error:", error);
          setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = { user, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
