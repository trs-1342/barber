import type { Product, Promotion } from '@/data/types';
import type { ColorName } from '@/theme';

export type Placement = Promotion['placement'];

export const PLACEMENTS: Record<
  Placement,
  { label: string; description: string; icon: 'star-outline' | 'image-outline' | 'search-outline'; minDaily: number; cpm: number }
> = {
  // cpm: 1000 gösterim başına tahmini maliyet (₺). Erişim tahmini bunun üzerinden yapılır.
  featured: { label: 'Vitrin', description: 'Salon uygulamasında "Öne çıkanlar" rafında', icon: 'star-outline', minDaily: 50, cpm: 12 },
  banner: { label: 'Ana sayfa banner', description: 'Uygulama açılışında üst bantta, en yüksek görünürlük', icon: 'image-outline', minDaily: 150, cpm: 20 },
  search: { label: 'Aramada üst sıra', description: 'İlgili kategori aramalarında en üstte', icon: 'search-outline', minDaily: 50, cpm: 9 },
};

export const DURATIONS = [3, 7, 14, 30] as const;
export const MAX_DAILY = 10_000;

export const PROMO_STATUS: Record<Promotion['status'], { label: string; tone: ColorName }> = {
  active: { label: 'Yayında', tone: 'success' },
  paused: { label: 'Duraklatıldı', tone: 'warning' },
  ended: { label: 'Bitti', tone: 'textMuted' },
};

const DAY = 86_400_000;

/** Gösterimlerden hesaplanan ham harcama (tavansız). */
const rawSpend = (p: Promotion) => (p.impressions / 1000) * PLACEMENTS[p.placement].cpm;

export const isBudgetExhausted = (p: Promotion) => rawSpend(p) >= maxBudget(p);

/** Süre dolduysa ya da toplam bütçe tükendiyse kayıttaki durum ne olursa olsun kampanya bitmiştir. */
export function effectiveStatus(p: Promotion, now = Date.now()): Promotion['status'] {
  return Date.parse(p.endsAt) <= now || isBudgetExhausted(p) ? 'ended' : p.status;
}

export function endReason(p: Promotion, now = Date.now()): string | null {
  if (effectiveStatus(p, now) !== 'ended') return null;
  if (isBudgetExhausted(p)) return 'Bütçe tükendi';
  return p.status === 'ended' && Date.parse(p.endsAt) > now - 60_000 ? 'Erken bitirildi' : 'Süre doldu';
}

/** Ürün reklam edilebilir mi? Değilse nedeni döner. */
export function productIneligibility(p: Pick<Product, 'active' | 'stock'> | undefined): string | null {
  if (!p) return 'Ürün bulunamadı';
  if (!p.active) return 'Ürün satışta değil (pasif)';
  if (p.stock <= 0) return 'Ürünün stoğu yok';
  return null;
}

export function totalDays(p: Pick<Promotion, 'startsAt' | 'endsAt'>) {
  return Math.max(1, Math.round((Date.parse(p.endsAt) - Date.parse(p.startsAt)) / DAY));
}

export function remainingDays(p: Promotion, now = Date.now()) {
  return Math.max(0, Math.ceil((Date.parse(p.endsAt) - now) / DAY));
}

/** İlerleme 0..1 (zaman bazlı). */
export function progress(p: Promotion, now = Date.now()) {
  const start = Date.parse(p.startsAt);
  const end = Date.parse(p.endsAt);
  return Math.min(1, Math.max(0, (now - start) / (end - start)));
}

/** Tahmini harcama: gösterim × CPM, bütçe tavanını aşamaz. */
export function spent(p: Promotion, now = Date.now()) {
  return Math.round(Math.min(rawSpend(p), maxBudget(p), p.dailyBudget * Math.max(1, Math.ceil(progress(p, now) * totalDays(p)))));
}

export const maxBudget = (p: Pick<Promotion, 'dailyBudget' | 'startsAt' | 'endsAt'>) => p.dailyBudget * totalDays(p);

export const remainingBudget = (p: Promotion, now = Date.now()) => Math.max(0, maxBudget(p) - spent(p, now));

/** Tıklama oranı (%), bir ondalık. Gösterim yoksa hesaplanamaz (null). */
export const ctr = (p: Pick<Promotion, 'impressions' | 'clicks'>) =>
  p.impressions ? Math.round((p.clicks / p.impressions) * 1000) / 10 : null;

/** Tıklama başı maliyet. Tıklama yoksa hesaplanamaz (null). */
export const cpc = (spend: number, clicks: number) => (clicks ? Math.round((spend / clicks) * 100) / 100 : null);

/** Gerçekleşen CPM. Gösterim yoksa hesaplanamaz (null). */
export const realizedCpm = (spend: number, impressions: number) =>
  impressions ? Math.round((spend / impressions) * 1000 * 100) / 100 : null;

/** Tahmini gösterim aralığı (±%20). Erişim (tekil kişi) değil, gösterim sayısıdır. */
export function estimateImpressions(placement: Placement, daily: number, days: number) {
  const mid = ((daily * days) / PLACEMENTS[placement].cpm) * 1000;
  return { min: Math.round(mid * 0.8), max: Math.round(mid * 1.2) };
}

export type DraftErrors = Partial<Record<'product' | 'budget' | 'overlap', string>>;
export type Draft = { productId?: string; placement: Placement; daily: number; product?: Pick<Product, 'active' | 'stock'> };

/** Yeni kampanya taslağını doğrular. Aynı ürün + yerleşimde süren kampanya varsa çakışma sayılır. */
export function validateDraft(
  d: Draft,
  existing: Promotion[],
  now = Date.now(),
): DraftErrors {
  const e: DraftErrors = {};
  if (!d.productId) e.product = 'Bir ürün seçin';
  else e.product = productIneligibility(d.product) ?? undefined;
  if (!e.product) delete e.product;
  const min = PLACEMENTS[d.placement].minDaily;
  if (!Number.isFinite(d.daily) || d.daily < min) e.budget = `Bu yerleşim için en az ${min} ₺/gün`;
  else if (d.daily > MAX_DAILY) e.budget = `En fazla ${MAX_DAILY.toLocaleString('tr-TR')} ₺/gün`;
  if (
    d.productId &&
    existing.some(
      (p) => p.productId === d.productId && p.placement === d.placement && effectiveStatus(p, now) !== 'ended',
    )
  ) {
    e.overlap = 'Bu ürün bu yerleşimde zaten yayında ya da duraklatılmış';
  }
  return e;
}

export function summarizePromotions(list: Promotion[], now = Date.now()) {
  let impressions = 0;
  let clicks = 0;
  let spend = 0;
  let active = 0;
  for (const p of list) {
    impressions += p.impressions;
    clicks += p.clicks;
    spend += spent(p, now);
    if (effectiveStatus(p, now) === 'active') active += 1;
  }
  return { impressions, clicks, spend, active, ctr: ctr({ impressions, clicks }), cpc: cpc(spend, clicks) };
}
