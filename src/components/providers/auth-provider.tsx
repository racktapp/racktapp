'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import type { User } from '@/lib/types';

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
      if (firebaseUser) {
        // In a real app, you'd fetch the user profile from Firestore here
        const userProfile: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || 'no-email@rackt.com',
          name: firebaseUser.displayName || 'New User',
          username: firebaseUser.displayName?.toLowerCase().replace(' ', '') || 'newuser',
          avatar: firebaseUser.photoURL || `https://placehold.co/100x100.png?text=${firebaseUser.displayName?.charAt(0) || 'U'}`,
          friendIds: [],
          preferredSports: ['Tennis'],
          sports: {
            Tennis: {
              racktRank: 1200,
              wins: 0,
              losses: 0,
              streak: 0,
              achievements: [],
              matchHistory: [],
            },
          },
        };
        setUser({ ...firebaseUser, ...userProfile });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
