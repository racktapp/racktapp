
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBiqxBLHpN9aH8myDv-ckD8hV3f2SgjIvg",
  authDomain: "rackt-the-social-sports-hub.firebaseapp.com",
  projectId: "rackt-the-social-sports-hub",
  storageBucket: "rackt-the-social-sports-hub.appspot.com",
  messagingSenderId: "1080946592753",
  appId: "1:1080946592753:web:b02a7c131d35f9dbdad250"
};

// Initialize Firebase
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// This is a client-side only initialization function for components that need it.
// The top-level export handles initialization for both client and server.
export function initializeFirebase() {
    if (getApps().length === 0) {
        initializeApp(firebaseConfig);
    }
}

export { app, auth, db, storage };
