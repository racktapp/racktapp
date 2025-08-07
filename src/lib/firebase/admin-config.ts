
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // This is the correct way to initialize in a Vercel/Google Cloud environment.
    // It automatically uses the service account credentials from the environment.
    admin.initializeApp();
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();
const adminApp = admin.app();

export { adminDb, adminAuth, adminApp };
