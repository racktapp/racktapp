
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

function getServiceAccount() {
  const encodedServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!encodedServiceAccount) {
    throw new Error('The FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable must be set. Please encode your service account JSON file to Base64 and add it to your .env.local file.');
  }

  try {
    const decodedJson = Buffer.from(encodedServiceAccount, 'base64').toString('utf-8');
    return JSON.parse(decodedJson);
  } catch (e) {
    throw new Error('Failed to parse the decoded service account JSON. Please ensure the Base64 string is correct.');
  }
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
