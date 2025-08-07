
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

function getServiceAccount() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    throw new Error('The FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL environment variables must be set.');
  }

  // The private key from the environment variable might have its newlines escaped.
  // We need to replace the literal `\\n` with actual newline characters `\n`.
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  return {
    projectId,
    privateKey: formattedPrivateKey,
    clientEmail,
  };
}

let adminApp: App;

if (!getApps().length) {
  const serviceAccount = getServiceAccount();

  adminApp = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
} else {
  adminApp = getApps()[0];
}

export const db = getFirestore(adminApp);
export const auth = getAuth(adminApp);
export const storage = getStorage(adminApp);
