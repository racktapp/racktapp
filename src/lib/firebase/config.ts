
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

// Initialize Firebase on the client side
let app: FirebaseApp;
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;
let storage: ReturnType<typeof getStorage>;

export function initializeFirebase() {
    if (typeof window !== 'undefined') {
        if (getApps().length === 0) {
            app = initializeApp(firebaseConfig);
            auth = getAuth(app);
            db = getFirestore(app);
            storage = getStorage(app);
        } else {
            app = getApp();
            auth = getAuth(app);
            db = getFirestore(app);
            storage = getStorage(app);
        }
    }
}

// This needs to be available for server-side actions, but it might not be initialized there.
// A better approach is to initialize it once in a server-side context.
if (getApps().length === 0) {
    initializeApp(firebaseConfig);
}

// Export a function to get the initialized db, to avoid race conditions.
const getDb = () => {
    if (!db) {
        initializeFirebase();
    }
    return db;
}


export { app, auth, db, storage, getDb };
