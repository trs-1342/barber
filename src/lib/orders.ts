import type { ColorName } from '@/theme';
import type { Order, OrderStatus } from '@/data/types';

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: ColorName }> = {
  new: { label: 'Yeni', tone: 'warning' },
  preparing: { label: 'Hazırlanıyor', tone: 'primary' },
  shipped: { label: 'Kargoda', tone: 'primary' },
  delivered: { label: 'Teslim edildi', tone: 'success' },
  cancelled: { label: 'İptal', tone: 'textMuted' },
};

/** İzin verilen durum geçişleri; sunucu da aynı kuralı uygular. */
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  new: ['preparing', 'cancelled'],
  preparing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus) => NEXT[from].includes(to);
export const nextStatuses = (s: OrderStatus) => NEXT[s];

export const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  preparing: 'Siparişi onayla',
  shipped: 'Kargoya verildi',
  delivered: 'Teslim edildi',
  cancelled: 'İptal et',
};

/** Ciroya yalnızca iptal edilmemiş siparişler sayılır. */
export const isRevenue = (o: Order) => o.status !== 'cancelled';

export type DayBucket = { day: Date; total: number; count: number };

/** Son `days` günün günlük ciro dağılımı (bugün dahil, eskiden yeniye). */
export function revenueByDay(orders: Order[], days: number, now = new Date()): DayBucket[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const buckets: DayBucket[] = Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { day: d, total: 0, count: 0 };
  });
  for (const o of orders) {
    if (!isRevenue(o)) continue;
    const t = new Date(o.createdAt);
    t.setHours(0, 0, 0, 0);
    const idx = Math.round((t.getTime() - start.getTime()) / 86_400_000);
    const b = buckets[idx];
    if (b) {
      b.total += o.total;
      b.count += 1;
    }
  }
  return buckets;
}

export type ProductSales = { productId: string; name: string; qty: number; revenue: number };

export function topProducts(orders: Order[], limit = 5): ProductSales[] {
  const map = new Map<string, ProductSales>();
  for (const o of orders) {
    if (!isRevenue(o)) continue;
    for (const it of o.items) {
      const cur = map.get(it.productId) ?? { productId: it.productId, name: it.name, qty: 0, revenue: 0 };
      cur.qty += it.qty;
      cur.revenue += it.qty * it.unitPrice;
      map.set(it.productId, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export function summarize(orders: Order[]) {
  const valid = orders.filter(isRevenue);
  const revenue = valid.reduce((s, o) => s + o.total, 0);
  return {
    revenue,
    orderCount: valid.length,
    avgBasket: valid.length ? Math.round(revenue / valid.length) : 0,
    pending: orders.filter((o) => o.status === 'new').length,
    salonCount: new Set(valid.map((o) => o.salonId)).size,
  };
}
