import type { Order } from '@/data/types';
import { canTransition, revenueByDay, summarize, topProducts } from '@/lib/orders';

const now = new Date(2030, 5, 15, 12);
const mk = (o: Partial<Order>): Order => ({
  id: Math.random().toString(),
  code: 'X',
  salonId: 's1',
  salonName: 'S',
  salonDistrict: 'D',
  items: [{ productId: 'p1', name: 'P1', qty: 2, unitPrice: 100 }],
  total: 200,
  status: 'delivered',
  createdAt: now.toISOString(),
  ...o,
});

it('durum geçiş kuralları', () => {
  expect(canTransition('new', 'preparing')).toBe(true);
  expect(canTransition('new', 'delivered')).toBe(false);
  expect(canTransition('shipped', 'cancelled')).toBe(false);
  expect(canTransition('delivered', 'new')).toBe(false);
});

it('özet iptalleri ciroya katmaz', () => {
  const s = summarize([mk({}), mk({ status: 'cancelled', total: 999 }), mk({ status: 'new', salonId: 's2' })]);
  expect(s.revenue).toBe(400);
  expect(s.orderCount).toBe(2);
  expect(s.avgBasket).toBe(200);
  expect(s.pending).toBe(1);
  expect(s.salonCount).toBe(2);
});

it('günlük kova dağılımı, aralık dışını atlar', () => {
  const yesterday = new Date(now.getTime() - 86_400_000).toISOString();
  const old = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const b = revenueByDay([mk({}), mk({ createdAt: yesterday, total: 50 }), mk({ createdAt: old })], 7, now);
  expect(b).toHaveLength(7);
  expect(b.at(-1)!.total).toBe(200);
  expect(b.at(-2)!.total).toBe(50);
  expect(b.reduce((s, x) => s + x.total, 0)).toBe(250);
});

it('en çok satanlar ciroya göre sıralanır', () => {
  const top = topProducts([
    mk({ items: [{ productId: 'a', name: 'A', qty: 1, unitPrice: 10 }] }),
    mk({ items: [{ productId: 'b', name: 'B', qty: 3, unitPrice: 50 }] }),
    mk({ items: [{ productId: 'a', name: 'A', qty: 5, unitPrice: 10 }] }),
  ]);
  expect(top.map((t) => [t.productId, t.revenue])).toEqual([['b', 150], ['a', 60]]);
});
