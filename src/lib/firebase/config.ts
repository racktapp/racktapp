import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBiqxBLHpN9aH8myDv-ckD8hV3f2SgjIvg",
  authDomain: "rackt-the-social-sports-hub.firebaseapp.com",
  projectId: "rackt-the-social-sports-hub",
  storageBucket: "rackt-the-social-sports-hub.appspot.com",
  messagingSenderId: "1080946592753",
  appId: "1:1080946592753:web:b02a7c131d35f9dbdad250"
};

// Initialize Firebase
function getFirebaseApp(): FirebaseApp {
    if (typeof window === 'undefined') {
        // Return a mock app for the server-side rendering
        return {
            name: 'mock-app',
            options: {},
            automaticDataCollectionEnabled: false,
        };
    }
    
    if (!getApps().length) {
        return initializeApp(firebaseConfig);
    }
    return getApp();
}

export const app = getFirebaseApp();

// Only initialize services on the client
export const auth = typeof window !== 'undefined' ? getAuth(app) : ({} as any);
export const db = typeof window !== 'undefined' ? getFirestore(app) : ({} as any);
export const storage = typeof window !== 'undefined' ? getStorage(app) : ({} as any);