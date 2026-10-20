import type { Order, OrderStatus, Product, Promotion, Supplier } from './types';

export type ProductInput = Omit<Product, 'id'>;
export type PromotionInput = Omit<Promotion, 'id' | 'impressions' | 'clicks' | 'status'>;
export type Credentials = { email: string; password: string };
export type Registration = Credentials & Omit<Supplier, 'id' | 'email'>;

/**
 * Ekranların bildiği tek veri sözleşmesi. Firebase, Supabase ve sahte veri
 * kaynakları bu arayüzü uygular; ekranlar hangisinin kullanıldığını bilmez.
 */
export interface Repository {
  signIn(c: Credentials): Promise<Supplier>;
  register(r: Registration): Promise<Supplier>;
  signOut(): Promise<void>;
  updateSupplier(patch: Partial<Omit<Supplier, 'id'>>): Promise<Supplier>;

  listOrders(signal?: AbortSignal): Promise<Order[]>;
  /** Geçersiz durum geçişinde `InvalidTransitionError` fırlatır. */
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order>;

  listProducts(signal?: AbortSignal): Promise<Product[]>;
  saveProduct(input: ProductInput, id?: string): Promise<Product>;

  listPromotions(signal?: AbortSignal): Promise<Promotion[]>;
  createPromotion(input: PromotionInput): Promise<Promotion>;
  setPromotionStatus(id: string, status: 'active' | 'paused'): Promise<void>;
}

export class NotFoundError extends Error {
  constructor(what = 'Kayıt') {
    super(`${what} bulunamadı`);
    this.name = 'NotFoundError';
  }
}

export class InvalidTransitionError extends Error {
  constructor() {
    super('Sipariş bu duruma geçirilemez. Liste güncel olmayabilir; yenileyip tekrar deneyin.');
    this.name = 'InvalidTransitionError';
  }
}

export class AuthError extends Error {
  constructor(message = 'E-posta veya şifre hatalı') {
    super(message);
    this.name = 'AuthError';
  }
}
