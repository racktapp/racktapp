

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "rackt-the-social-sports-hub.firebaseapp.com",
  projectId: "rackt-the-social-sports-hub",
  storageBucket: "rackt-the-social-sports-hub.appspot.com",
  messagingSenderId: "1080946592753",
  appId: "1:1080946592753:web:b02a7c131d35f9dbdad250"
};

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
// Connect to the default database.
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
