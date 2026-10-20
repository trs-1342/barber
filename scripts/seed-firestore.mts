/**
 * Firestore'a örnek veri yükler: npm run seed:firestore -- <email> <şifre>
 * Hesap yoksa oluşturur; ürünleri ve kampanyaları kendi hesabı adına yazar.
 * Siparişleri salon uygulaması oluşturur ve kurallar tedarikçinin sipariş yazmasına izin vermez.
 * Demo siparişleri için Konsol > Firestore > Rules'ta GEÇİCİ olarak orders bloğuna
 *   allow create: if request.auth != null && request.resource.data.supplierId == request.auth.uid;
 * ekle, betiği çalıştır, sonra satırı sil.
 */
import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { addDoc, collection, doc, getFirestore, setDoc } from 'firebase/firestore';

import { orders, products, promotions, supplier } from '../src/data/seed.ts';

process.loadEnvFile?.('.env');
const [email = supplier.email, password = 'demo1234'] = process.argv.slice(2);
const e = process.env;
const app = initializeApp({
  apiKey: e.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: e.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: e.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: e.EXPO_PUBLIC_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);

const cred = await signInWithEmailAndPassword(auth, email, password).catch(() =>
  createUserWithEmailAndPassword(auth, email, password),
);
const uid = cred.user.uid;
const { id: _id, ...profile } = supplier;
await setDoc(doc(db, 'suppliers', uid), { ...profile, email: cred.user.email });
console.log('tedarikçi:', email, uid);

const idMap = new Map<string, string>();
for (const { id, ...p } of products) {
  const ref = await addDoc(collection(db, 'suppliers', uid, 'products'), p);
  idMap.set(id, ref.id);
}
console.log('ürünler:', products.length);

for (const { id: _p, ...p } of promotions) {
  // Kurallar yeni kampanyada sayaçları 0 ve durumu 'active' ister.
  await addDoc(collection(db, 'suppliers', uid, 'promotions'), {
    ...p,
    productId: idMap.get(p.productId),
    status: 'active',
    impressions: 0,
    clicks: 0,
  });
}
console.log('kampanyalar:', promotions.length);

try {
  for (const { id: _o, ...o } of orders) {
    const items = o.items.map((it) => ({ ...it, productId: idMap.get(it.productId) ?? it.productId }));
    await addDoc(collection(db, 'orders'), { ...o, items, supplierId: uid, ...(o.note ? {} : { note: null }) });
  }
  console.log('siparişler:', orders.length);
} catch (err) {
  console.warn('Siparişler yazılamadı (beklenen: kurallar izin vermiyor). Dosya başındaki notu oku.', (err as Error).message);
}
process.exit(0);
