import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBw4qLEmhCdloIGMP-R5a-hsZuKC10DFD4",
  authDomain: "rackt-1b802.firebaseapp.com",
  projectId: "rackt-1b802",
  storageBucket: "rackt-1b802.appspot.com",
  messagingSenderId: "902514094077",
  appId: "1:902514094077:web:ac5ec52b37b66943ba7394",
};

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
