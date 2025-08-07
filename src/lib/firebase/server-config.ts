import * as admin from 'firebase-admin';

// This function ensures the Firebase app is initialized and returns the Firestore instance.
// This prevents race conditions and initialization errors in a serverless environment.
export function getAdminDb() {
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
  return admin.firestore();
}

export function getAdminAuth() {
    if (!admin.apps.length) {
        getAdminDb(); // Ensure app is initialized
    }
    return admin.auth();
}
