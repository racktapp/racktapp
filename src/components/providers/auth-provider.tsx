'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import type { User as AppUser } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { createUserDocument } from '@/lib/firebase/firestore';

export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          
          let userProfile: AppUser;

          if (userDoc.exists()) {
            userProfile = userDoc.data() as AppUser;
          } else {
            // If user exists in Auth but not Firestore (e.g., first login, or data wiped),
            // create their user document to ensure app functionality.
            userProfile = await createUserDocument({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || 'New User',
            });
          }
          
          // Create a new, clean user object for the context.
          // This avoids passing non-serializable properties from firebaseUser.
          const appUser: AppUser = {
            ...userProfile, // Base user data from Firestore
            uid: firebaseUser.uid, // Always use the uid from firebase auth
            email: firebaseUser.email!, // and email
            name: firebaseUser.displayName || userProfile.name, // prefer display name from auth if available
            avatar: firebaseUser.photoURL || userProfile.avatar, // prefer photoURL from auth
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
    });

    return () => unsubscribe();
  }, []);

  const value = { user, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
