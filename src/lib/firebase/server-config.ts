
import * as admin from 'firebase-admin';

// This prevents initialization on the client side and during hot-reloads in dev
if (!admin.apps.length) {
  admin.initializeApp();
}

export const adminApp = admin.apps[0]!;
export const adminAuth = admin.auth(adminApp);
export const adminDb = admin.firestore(adminApp);
