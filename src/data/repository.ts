import type { Appointment, Shop } from './types';

export type ShopQuery = { query?: string; tag?: string };

export type NewAppointment = Omit<Appointment, 'id' | 'status'>;

/**
 * Ekranların bildiği tek veri sözleşmesi. Firebase, Supabase ve sahte veri
 * kaynakları bu arayüzü uygular; ekranlar hangisinin kullanıldığını bilmez.
 */
export interface Repository {
  listShops(params?: ShopQuery, signal?: AbortSignal): Promise<Shop[]>;
  getShop(id: string, signal?: AbortSignal): Promise<Shop>;
  listAppointments(signal?: AbortSignal): Promise<Appointment[]>;
  /** Aynı personelin aynı aralığına ikinci randevu yazılırsa `SlotTakenError` fırlatır. */
  createAppointment(input: NewAppointment): Promise<Appointment>;
  cancelAppointment(id: string): Promise<void>;
}

export class SlotTakenError extends Error {
  constructor() {
    super('Bu saat az önce doldu. Lütfen başka bir saat seçin.');
    this.name = 'SlotTakenError';
  }
}

export class NotFoundError extends Error {
  constructor(what = 'Kayıt') {
    super(`${what} bulunamadı`);
    this.name = 'NotFoundError';
  }
}

const normalize = (s: string) => s.toLocaleLowerCase('tr-TR').trim();

/** Kaynaklar arasında ortak arama/filtre mantığı (istemci tarafı). */
export function filterShops(shops: Shop[], { query, tag }: ShopQuery = {}) {
  const q = normalize(query ?? '');
  return shops.filter(
    (s) =>
      (!q || normalize(s.name).includes(q) || normalize(s.district).includes(q)) &&
      (!tag || s.tags.includes(tag)),
  );
}

export function overlaps(a: { start: string; durationMin: number }, b: { start: string; durationMin: number }) {
  const aStart = Date.parse(a.start);
  const bStart = Date.parse(b.start);
  return aStart < bStart + b.durationMin * 60_000 && bStart < aStart + a.durationMin * 60_000;
}
