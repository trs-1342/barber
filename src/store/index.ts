import AsyncStorage from '@react-native-async-storage/async-storage';

import { getDataSource, repo, setRepoSource, type Supplier } from '@/data';
import { env, type DataSource } from '@/lib/env';

import { createListStore, createStore } from './create-store';

export const orders = createListStore(() => repo.listOrders());
export const products = createListStore(() => repo.listProducts());
export const promotions = createListStore(() => repo.listPromotions());

const [sessionStore, useSessionRaw] = createStore<Supplier | null>(null);

export const session = {
  get: sessionStore.get,
  set(s: Supplier | null) {
    // Hesap değişince önceki kullanıcının verisi ekranda kalmasın (aynı hesapta liste korunur).
    if (s?.id !== sessionStore.get()?.id) {
      orders.reset();
      products.reset();
      promotions.reset();
    }
    sessionStore.set(s);
  },
  async signOut() {
    await repo.signOut();
    session.set(null);
  },
};
export const useSession = useSessionRaw;

// --- Veri kaynağı (Demo veri / Gerçek veri) ---

const SOURCE_KEY = 'barber.dataSource';
const SOURCES: readonly DataSource[] = ['mock', 'firebase', 'supabase'];

const [sourceStore, useSourceRaw] = createStore<DataSource>(getDataSource());
export const useDataSource = useSourceRaw;

/** Açılış tamamlandı mı: kayıtlı kaynak okundu ve ilk oturum durumu geldi. */
const [readyStore, useReadyRaw] = createStore(false);
export const useAppReady = useReadyRaw;

let unsubscribeAuth: (() => void) | undefined;

function bindAuth() {
  unsubscribeAuth?.();
  unsubscribeAuth = repo.onAuthChange((s) => {
    session.set(s);
    readyStore.set(true);
  });
}

/** Kaynağı değiştirir: oturum ve listeler sıfırlanır, yeni kaynağın oturumu dinlenir. */
export function setDataSource(source: DataSource) {
  AsyncStorage.setItem(SOURCE_KEY, source).catch(() => {});
  if (source === getDataSource() && unsubscribeAuth) return;
  setRepoSource(source);
  sourceStore.set(source);
  session.set(null);
  orders.reset();
  products.reset();
  promotions.reset();
  bindAuth();
}

/** Uygulama açılışında bir kez: kayıtlı seçimi (yoksa .env varsayılanını) uygular. */
export async function initDataSource() {
  let saved: string | null = null;
  try {
    saved = await AsyncStorage.getItem(SOURCE_KEY);
  } catch {
    // Depolama okunamazsa .env varsayılanıyla devam edilir.
  }
  const source = SOURCES.includes(saved as DataSource) ? (saved as DataSource) : env.dataSource;
  setRepoSource(source);
  sourceStore.set(source);
  bindAuth();
  // Ağ yavaşsa açılış ekranında takılı kalınmasın.
  setTimeout(() => readyStore.set(true), 4000);
}
