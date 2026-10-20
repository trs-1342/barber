/**
 * Örnek işletmeleri Firestore'a yazar (.env'deki EXPO_PUBLIC_FIREBASE_* ile).
 * Kurallarda shops yazımı kapalı olduğu için: Konsolda geçici olarak
 * `match /shops/{id} { allow write: if true; }` yap → `npm run seed:firestore` → kuralı geri al.
 */
import { initializeApp } from 'firebase/app';
import { doc, getFirestore, setDoc } from 'firebase/firestore';

import { shops } from '../src/data/seed.ts';

process.loadEnvFile?.('.env');
const e = process.env;
const app = initializeApp({
  apiKey: e.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: e.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: e.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: e.EXPO_PUBLIC_FIREBASE_APP_ID,
});
const db = getFirestore(app);

for (const { id, ...data } of shops) {
  await setDoc(doc(db, 'shops', id), data);
  console.log('yazıldı:', id, data.name);
}
process.exit(0);
