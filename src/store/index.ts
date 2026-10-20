import { repo, type Supplier } from '@/data';

import { createListStore, createStore } from './create-store';

export const orders = createListStore(() => repo.listOrders());
export const products = createListStore(() => repo.listProducts());
export const promotions = createListStore(() => repo.listPromotions());

const [sessionStore, useSessionRaw] = createStore<Supplier | null>(null);

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
