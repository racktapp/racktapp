import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

async function isFriend(a: string, b: string): Promise<boolean> {
  const doc = await db.doc(`users/${a}/friends/${b}`).get();
  return doc.exists && doc.data()?.status === 'accepted';
}

export const validateMatch = functions.firestore
  .document('matches/{matchId}')
  .onCreate(async (snap, context) => {
    const data = snap.data() as any;
    const playerA = data.playerA;
    const playerB = data.playerB;

    if (!(await isFriend(playerA, playerB))) {
      await snap.ref.delete();
      console.log('Match rejected: players are not friends');
      return;
    }

    // TODO: run ELO update in a transaction
    return null;
  });
