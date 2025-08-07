
import * as admin from 'firebase-admin';

// This prevents initialization on the client side and during hot-reloads in dev
if (!admin.apps.length) {
  admin.initializeApp({
    // If you're running this on a server (e.g., Vercel),
    // you would use environment variables for the credentials.
    // credential: admin.credential.cert({ ... }),
  });
}

export const adminApp = admin.apps[0];
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
