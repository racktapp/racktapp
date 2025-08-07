

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
    } catch (e) {
        console.error('Firebase Admin initialization error', e);
    }
}


export const adminApp = admin.apps[0]!;
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
