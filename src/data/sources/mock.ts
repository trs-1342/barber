import { canTransition } from '@/lib/orders';
import { effectiveStatus, validateDraft } from '@/lib/promotions';

import { AuthError, InvalidTransitionError, NotFoundError, ValidationError, type Repository } from '../repository';
import * as seed from '../seed';
import type { Order, Product, Promotion, Supplier } from '../types';

/** Ağ olmadan çalışan kaynak: demo, test ve bağlantı yokken yedek. */
const LATENCY_MS = 250;

function delay<T>(value: T, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => resolve(value), LATENCY_MS);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

/** `signedIn`: demo modunda giriş ekranı atlansın diye demo tedarikçiyle başlar. */
export function createMockRepository(latency = true, signedIn = false): Repository {
  let supplier: Supplier | null = signedIn ? { ...seed.supplier } : null;
  const listeners = new Set<(s: Supplier | null) => void>();
  const emit = () => listeners.forEach((l) => l(supplier));
  let orders: Order[] = seed.orders.map((o) => ({ ...o }));
  let products: Product[] = seed.products.map((p) => ({ ...p }));
  let promotions: Promotion[] = seed.promotions.map((p) => ({ ...p }));
  const wait = <T,>(v: T, signal?: AbortSignal) => (latency ? delay(v, signal) : Promise.resolve(v));
  const me = () => {
    if (!supplier) throw new AuthError('Oturum açılmamış');
    return supplier;
  };

  return {
    async signIn({ email, password }) {
      if (!email.includes('@') || password.length < 6) throw new AuthError();
      supplier = { ...seed.supplier, email: email.trim().toLowerCase() };
      emit();
      return wait(supplier);
    },
    async register({ password, ...rest }) {
      if (password.length < 6) throw new AuthError('Şifre en az 6 karakter olmalı');
      supplier = { ...rest, id: `sup${Date.now()}`, email: rest.email.trim().toLowerCase() } as Supplier;
      emit();
      return wait(supplier);
    },
    async signOut() {
      supplier = null;
      emit();
    },
    onAuthChange(cb) {
      listeners.add(cb);
      cb(supplier);
      return () => {
        listeners.delete(cb);
      };
    },
    async updateSupplier(patch) {
      supplier = { ...me(), ...patch };
      return wait(supplier);
    },

    listOrders: (signal) => wait([...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), signal),
    async updateOrderStatus(id, status) {
      const cur = orders.find((o) => o.id === id);
      if (!cur) throw new NotFoundError('Sipariş');
      if (!canTransition(cur.status, status)) throw new InvalidTransitionError();
      const next = { ...cur, status };
      orders = orders.map((o) => (o.id === id ? next : o));
      return wait(next);
    },

    listProducts: (signal) => wait(products, signal),
    async saveProduct(input, id) {
      if (id && !products.some((p) => p.id === id)) throw new NotFoundError('Ürün');
      const saved: Product = { ...input, id: id ?? `p${Date.now()}` };
      products = id ? products.map((p) => (p.id === id ? saved : p)) : [saved, ...products];
      return wait(saved);
    },

    listPromotions: (signal) => wait(promotions, signal),
    async createPromotion(input) {
      // Sunucu tarafı doğrulama: istemci atlansa bile aynı kurallar uygulanır.
      const product = products.find((p) => p.id === input.productId);
      const errors = validateDraft({ ...input, daily: input.dailyBudget, product }, promotions);
      const first = Object.values(errors)[0];
      if (first) throw new ValidationError(first);
      const created: Promotion = { ...input, id: `pr${Date.now()}`, status: 'active', impressions: 0, clicks: 0 };
      promotions = [created, ...promotions];
      return wait(created);
    },
    async setPromotionStatus(id, status) {
      const cur = promotions.find((p) => p.id === id);
      if (!cur) throw new NotFoundError('Kampanya');
      if (effectiveStatus(cur) === 'ended') throw new ValidationError('Biten kampanya değiştirilemez');
      promotions = promotions.map((p) =>
        p.id === id ? { ...p, status, ...(status === 'ended' ? { endsAt: new Date().toISOString() } : {}) } : p,
      );
      await wait(undefined);
    },
  };
}
