import { repo, type Supplier } from '@/data';
import { supplier as demoSupplier } from '@/data/seed';
import { env } from '@/lib/env';

import { createListStore, createStore } from './create-store';

export const orders = createListStore(() => repo.listOrders());
export const products = createListStore(() => repo.listProducts());
export const promotions = createListStore(() => repo.listPromotions());

// Demo (mock) modunda doğrudan Reklam ekranı açılsın diye demo tedarikçiyle başlanır.
const [sessionStore, useSessionRaw] = createStore<Supplier | null>(env.dataSource === 'mock' ? demoSupplier : null);

export const session = {
  get: sessionStore.get,
  set(s: Supplier | null) {
    // Hesap değişince önceki kullanıcının verisi ekranda kalmasın.
    orders.reset();
    products.reset();
    promotions.reset();
    sessionStore.set(s);
  },
  async signOut() {
    await repo.signOut();
    session.set(null);
  },
};
export const useSession = useSessionRaw;
