import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
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

import { env } from '@/lib/env';
import { canTransition } from '@/lib/orders';

import { AuthError, InvalidTransitionError, NotFoundError, type Repository } from '../repository';
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
const auth = () => getAuth(app());

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
  if (code.includes('invalid')) return 'E-posta veya şifre hatalı';
  return (e as Error).message;
}

export function createFirebaseRepository(): Repository {
  return {
    async signIn({ email, password }) {
      try {
        const cred = await signInWithEmailAndPassword(auth(), email.trim(), password);
        const snap = await getDoc(doc(db(), 'suppliers', cred.user.uid));
        if (!snap.exists()) throw new NotFoundError('Tedarikçi hesabı');
        return withId<Supplier>(snap);
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

    async updateSupplier(patch) {
      const ref = doc(db(), 'suppliers', uid());
      await updateDoc(ref, patch);
      return withId<Supplier>(await getDoc(ref));
    },

    async listOrders() {
      const q = query(collection(db(), 'orders'), where('supplierId', '==', uid()), orderBy('createdAt', 'desc'));
      return (await getDocs(q)).docs.map((d) => withId<Order>(d));
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
      const snap = await getDocs(collection(db(), 'suppliers', uid(), 'products'));
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

    async listPromotions() {
      const snap = await getDocs(collection(db(), 'suppliers', uid(), 'promotions'));
      return snap.docs.map((d) => withId<Promotion>(d));
    },

    async createPromotion(input) {
      const data = { ...input, status: 'active' as const, impressions: 0, clicks: 0 };
      const ref = await addDoc(collection(db(), 'suppliers', uid(), 'promotions'), data);
      return { ...data, id: ref.id };
    },

    async setPromotionStatus(id, status) {
      const patch = status === 'ended' ? { status, endsAt: new Date().toISOString() } : { status };
      await updateDoc(doc(db(), 'suppliers', uid(), 'promotions', id), patch);
    },
  };
}
