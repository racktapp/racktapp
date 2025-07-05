
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase/config';
import type { User as AppUser } from '@/lib/types';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { createUserDocument } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  reloadUser: () => Promise<void>;
  updateUserName: (userId: string, newName: string) => Promise<void>;
  updateUserProfileImage: (userId: string, file: File) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
            userProfile = await createUserDocument({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || 'New User',
              emailVerified: firebaseUser.emailVerified,
            });
          }
          
          const appUser: AppUser = {
            ...userProfile,
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            name: firebaseUser.displayName || userProfile.name,
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

  const updateUserName = async (userId: string, newName: string) => {
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
        toast({ title: "Error", description: "Unauthorized or user not found.", variant: "destructive"});
        throw new Error("Unauthorized action or user not found.");
    }
    
    const userDocRef = doc(db, "users", userId);
    try {
        await updateFirebaseProfile(auth.currentUser, { displayName: newName });
        await updateDoc(userDocRef, { name: newName });
        
        // Update local state
        setUser(prevUser => prevUser ? ({ ...prevUser, name: newName }) : null);
    } catch (error: any) {
        console.error("Error updating user name:", error);
        toast({ title: "Error Saving Name", description: "Could not update your name.", variant: "destructive"});
        throw error;
    }
  };

  const updateUserProfileImage = async (userId: string, file: File) => {
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
        toast({ title: "Error", description: "Unauthorized action.", variant: "destructive"});
        throw new Error("Unauthorized action");
    }
    
    const userDocRef = doc(db, "users", userId);
    const fileRef = storageRef(storage, `avatars/${userId}/${Date.now()}_${file.name}`);

    try {
        // 1. Upload file to Firebase Storage
        const snapshot = await uploadBytes(fileRef, file);
        // 2. Get the public URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        // 3. Update Firebase Auth and Firestore with the new URL
        await updateFirebaseProfile(auth.currentUser, { photoURL: downloadURL });
        await updateDoc(userDocRef, { avatarUrl: downloadURL });

        // Update local state
        setUser(prevUser => prevUser ? ({ ...prevUser, avatarUrl: downloadURL }) : null);
    } catch (error: any) {
        console.error("Error updating profile image:", error);
        toast({ title: "Error", description: "Could not update profile image.", variant: "destructive"});
        throw error;
    }
  };

  const value = { user, loading, reloadUser, updateUserName, updateUserProfileImage };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
