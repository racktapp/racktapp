import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // The Vercel environment automatically provides the necessary
      // service account credentials via environment variables.
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();
const adminApp = admin.app();

export { adminDb, adminAuth, adminApp };
