import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { Platform } from 'react-native';

import { env } from '@/lib/env';
import { canTransition } from '@/lib/orders';
import { effectiveStatus, validateDraft } from '@/lib/promotions';

import { AuthError, InvalidTransitionError, NotFoundError, ValidationError, type Repository } from '../repository';
import type { Order, Product, Promotion, Supplier } from '../types';

/**
 * Firestore şeması (kurallar: firebase/firestore.rules):
 *   suppliers/{uid}                       → Supplier
 *   suppliers/{uid}/products/{id}         → Product
 *   suppliers/{uid}/promotions/{id}       → Promotion
 *   orders/{id}                           → Order + supplierId (salon uygulaması yazar)
 */
function app() {
  return getApps().length
    ? getApp()
    : initializeApp({
        apiKey: env.firebase.apiKey,
        authDomain: env.firebase.authDomain,
        projectId: env.firebase.projectId,
        storageBucket: env.firebase.storageBucket,
        messagingSenderId: env.firebase.messagingSenderId,
        appId: env.firebase.appId,
      });
}
const db = () => getFirestore(app());

let authInstance: Auth | undefined;
/**
 * React Native'de getAuth() oturumu yalnızca bellekte tutar; uygulama kapanınca oturum düşer.
 * initializeAuth + AsyncStorage kalıcılığı oturumu yeniden açılışta geri yükler.
 * Hızlı yenilemede (fast refresh) ikinci initializeAuth hata verir; o durumda mevcut örnek alınır.
 */
function auth() {
  if (authInstance) return authInstance;
  if (Platform.OS === 'web') return (authInstance = getAuth(app()));
  try {
    authInstance = initializeAuth(app(), { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    authInstance = getAuth(app());
  }
  return authInstance;
}

function uid() {
  const u = auth().currentUser;
  if (!u) throw new AuthError('Oturum açılmamış');
  return u.uid;
}

const withId = <T,>(d: { id: string; data(): unknown }) => ({ ...(d.data() as Omit<T, 'id'>), id: d.id }) as T;

function authMessage(e: unknown) {
  const code = (e as { code?: string }).code ?? '';
  if (code.includes('email-already-in-use')) return 'Bu e-posta zaten kayıtlı';
  if (code.includes('weak-password')) return 'Şifre en az 6 karakter olmalı';
  if (code.includes('invalid-email')) return 'Geçerli bir e-posta girin';
  if (code.includes('invalid') || code.includes('user-not-found') || code.includes('wrong-password'))
    return 'E-posta veya şifre hatalı';
  if (code.includes('too-many-requests')) return 'Çok fazla deneme yapıldı; biraz sonra tekrar deneyin';
  if (code.includes('network-request-failed')) return 'İnternet bağlantısı yok';
  if (code.includes('operation-not-allowed')) return 'E-posta/şifre girişi Firebase konsolunda kapalı';
  if (code.includes('permission-denied')) return 'Bu işlem için yetkiniz yok';
  return (e as Error).message;
}

async function readSupplier(user: User): Promise<Supplier | null> {
  const snap = await getDoc(doc(db(), 'suppliers', user.uid));
  return snap.exists() ? withId<Supplier>(snap) : null;
}

async function listPromotions() {
  const snap = await getDocs(collection(db(), 'suppliers', uid(), 'promotions'));
  return snap.docs.map((d) => withId<Promotion>(d));
}

export function createFirebaseRepository(): Repository {
  return {
    async signIn({ email, password }) {
      try {
        const cred = await signInWithEmailAndPassword(auth(), email.trim(), password);
        const supplier = await readSupplier(cred.user);
        if (!supplier) {
          // Auth hesabı var ama tedarikçi profili yok: yarım oturum bırakma.
          await signOut(auth());
          throw new NotFoundError('Tedarikçi hesabı');
        }
        return supplier;
      } catch (e) {
        if (e instanceof NotFoundError) throw e;
        throw new AuthError(authMessage(e));
      }
    },

    async register({ password, ...profile }) {
      try {
        const email = profile.email.trim().toLowerCase();
        const cred = await createUserWithEmailAndPassword(auth(), email, password);
        const supplier: Supplier = { ...profile, email, id: cred.user.uid };
        const { id, ...data } = supplier;
        await setDoc(doc(db(), 'suppliers', id), data);
        return supplier;
      } catch (e) {
        throw new AuthError(authMessage(e));
      }
    },

    signOut: () => signOut(auth()),

    onAuthChange(cb) {
      // Açılışta AsyncStorage'daki oturum geri yüklenince bir kez tetiklenir.
      return onAuthStateChanged(auth(), async (user) => {
        if (!user) return cb(null);
        try {
          const supplier = await readSupplier(user);
          // Profil yoksa kayıt sürüyordur (register belgeyi yazıp oturumu kendisi açar).
          if (supplier) cb(supplier);
        } catch {
          // Çevrimdışı vb.: oturumu düşürme, auth bilgisinden asgari profil kur.
          const email = user.email ?? '';
          cb({ id: user.uid, email, companyName: email, contactName: '', phone: '', city: '', taxNumber: '' });
        }
      });
    },

    async updateSupplier(patch) {
      const ref = doc(db(), 'suppliers', uid());
      await updateDoc(ref, patch);
      return withId<Supplier>(await getDoc(ref));
    },

    async listOrders() {
      // where + orderBy farklı alanlarda bileşik dizin ister; sıralama istemcide yapılır.
      const q = query(collection(db(), 'orders'), where('supplierId', '==', uid()));
      const list = (await getDocs(q)).docs.map((d) => withId<Order>(d));
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async updateOrderStatus(id, status) {
      const ref = doc(db(), 'orders', id);
      // İşlem (transaction): okuma ile yazma arasında başkası durumu değiştirirse tekrar denenir.
      return runTransaction(db(), async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new NotFoundError('Sipariş');
        const cur = withId<Order>(snap);
        if (!canTransition(cur.status, status)) throw new InvalidTransitionError();
        tx.update(ref, { status });
        return { ...cur, status };
      });
    },

    async listProducts() {
      const snap = await getDocs(query(collection(db(), 'suppliers', uid(), 'products'), orderBy('name')));
      return snap.docs.map((d) => withId<Product>(d));
    },

    async saveProduct(input, id) {
      const col = collection(db(), 'suppliers', uid(), 'products');
      if (id) {
        await setDoc(doc(col, id), input);
        return { ...input, id };
      }
      const ref = await addDoc(col, input);
      return { ...input, id: ref.id };
    },

    listPromotions,

    async createPromotion(input) {
      const me = uid();
      // İstemci tarafı doğrulama (mock ile aynı kurallar); Firestore kuralları sunucuda tekrar denetler.
      const [prodSnap, existing] = await Promise.all([
        getDoc(doc(db(), 'suppliers', me, 'products', input.productId)),
        listPromotions(),
      ]);
      const product = prodSnap.exists() ? withId<Product>(prodSnap) : undefined;
      const errors = validateDraft({ ...input, daily: input.dailyBudget, product }, existing);
      const first = Object.values(errors)[0];
      if (first) throw new ValidationError(first);
      const data = { ...input, status: 'active' as const, impressions: 0, clicks: 0 };
      const ref = await addDoc(collection(db(), 'suppliers', me, 'promotions'), data);
      return { ...data, id: ref.id };
    },

    async setPromotionStatus(id, status) {
      const ref = doc(db(), 'suppliers', uid(), 'promotions', id);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new NotFoundError('Kampanya');
      if (effectiveStatus(withId<Promotion>(snap)) === 'ended') throw new ValidationError('Biten kampanya değiştirilemez');
      const patch = status === 'ended' ? { status, endsAt: new Date().toISOString() } : { status };
      await updateDoc(ref, patch);
    },
  };
}
