
import { collection, writeBatch, GeoPoint } from 'firebase/firestore';
import { db } from './config';
import courtsData from './courts.json';
import { Court, Sport } from '../types';
import * as geofire from 'geofire-common';


export async function seedCourts() {
  const courtsCollection = collection(db, 'courts');
  const batch = writeBatch(db);

  for (const court of courtsData) {
    const { lat, lng, name, sports, address } = court;
    const location = new GeoPoint(lat, lng);
    const geohash = geofire.geohashForLocation([lat, lng]);

    const courtDoc: Court = {
      id: '', // Firestore will generate
      name,
      location,
      geohash,
      supportedSports: sports as Sport[],
      address,
    };
    
    const docRef = collection(courtsCollection).doc();
    courtDoc.id = docRef.id;
    batch.set(docRef, courtDoc);
  }

  try {
    await batch.commit();
    console.log(`Seeded ${courtsData.length} courts successfully.`);
  } catch (error) {
    console.error('Error seeding courts:', error);
  }
}

// To run this: ts-node -O '{"module":"commonjs"}' src/lib/firebase/seed.ts
// Or use the npm script: npm run seed
const main = async () => {
    await seedCourts();
};

if (require.main === module) {
    main();
}
