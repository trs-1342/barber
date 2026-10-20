import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  runTransaction,
} from 'firebase/firestore';

import { env } from '@/lib/env';

import { filterShops, NotFoundError, SlotTakenError, type Repository } from '../repository';
import type { Appointment, Shop } from '../types';

/**
 * Firestore şeması:
 *   shops/{shopId}                    → Shop (services ve staff gömülü dizi)
 *   appointments/{id}                 → Appointment
 *   slotLocks/{shopId_staffId_ISO}    → çift rezervasyonu engelleyen kilit belgeleri
 */
function db() {
  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: env.firebase.apiKey,
        authDomain: env.firebase.authDomain,
        projectId: env.firebase.projectId,
        storageBucket: env.firebase.storageBucket,
        messagingSenderId: env.firebase.messagingSenderId,
        appId: env.firebase.appId,
      });
  return getFirestore(app);
}

const SLOT_MIN = 15;

/** Randevunun kapladığı her 15 dakikalık dilim için deterministik kilit kimliği. */
function lockIds(a: { shopId: string; staffId: string | null; start: string; durationMin: number }) {
  if (!a.staffId) return [];
  const ids: string[] = [];
  const start = Date.parse(a.start);
  for (let m = 0; m < a.durationMin; m += SLOT_MIN) {
    ids.push(`${a.shopId}_${a.staffId}_${new Date(start + m * 60_000).toISOString()}`);
  }
  return ids;
}

export function createFirebaseRepository(): Repository {
  return {
    async listShops(params) {
      const snap = await getDocs(collection(db(), 'shops'));
      const shops = snap.docs.map((d) => ({ ...(d.data() as Omit<Shop, 'id'>), id: d.id }));
      return filterShops(shops, params);
    },

    async getShop(id) {
      const snap = await getDoc(doc(db(), 'shops', id));
      if (!snap.exists()) throw new NotFoundError('İşletme');
      return { ...(snap.data() as Omit<Shop, 'id'>), id: snap.id };
    },

    async listAppointments() {
      const q = query(collection(db(), 'appointments'), orderBy('start', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ ...(d.data() as Omit<Appointment, 'id'>), id: d.id }));
    },

    async createAppointment(input) {
      const firestore = db();
      const ref = doc(collection(firestore, 'appointments'));
      const locks = lockIds(input).map((id) => doc(firestore, 'slotLocks', id));

      // İşlem (transaction): kilitlerden biri varsa başka biri o saati az önce almıştır.
      await runTransaction(firestore, async (tx) => {
        const existing = await Promise.all(locks.map((l) => tx.get(l)));
        if (existing.some((s) => s.exists())) throw new SlotTakenError();
        tx.set(ref, { ...input, status: 'pending' });
        locks.forEach((l) => tx.set(l, { appointmentId: ref.id }));
      });
      return { ...input, id: ref.id, status: 'pending' };
    },

    async cancelAppointment(id) {
      const firestore = db();
      const ref = doc(firestore, 'appointments', id);
      await runTransaction(firestore, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new NotFoundError('Randevu');
        tx.update(ref, { status: 'cancelled' });
        lockIds(snap.data() as Appointment).forEach((l) => tx.delete(doc(firestore, 'slotLocks', l)));
      });
    },
  };
}

