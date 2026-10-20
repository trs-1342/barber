import type { Promotion } from '@/data/types';
import {
  ctr,
  effectiveStatus,
  estimateReach,
  maxBudget,
  remainingDays,
  spent,
  summarizePromotions,
  validateDraft,
} from '@/lib/promotions';

const DAY = 86_400_000;
const now = Date.UTC(2030, 0, 10);
const mk = (o: Partial<Promotion> = {}): Promotion => ({
  id: 'x',
  productId: 'p1',
  productName: 'P',
  placement: 'featured',
  dailyBudget: 100,
  startsAt: new Date(now - 2 * DAY).toISOString(),
  endsAt: new Date(now + 8 * DAY).toISOString(),
  status: 'active',
  impressions: 0,
  clicks: 0,
  ...o,
});

it('bitiş tarihi geçen kampanya durumundan bağımsız olarak biter', () => {
  expect(effectiveStatus(mk({ endsAt: new Date(now - 1).toISOString() }), now)).toBe('ended');
  expect(effectiveStatus(mk({ status: 'paused' }), now)).toBe('paused');
});

it('bütçe ve kalan gün', () => {
  expect(maxBudget(mk())).toBe(1000);
  expect(remainingDays(mk(), now)).toBe(8);
});

it('harcama gösterim maliyetinden hesaplanır, tavanı aşamaz', () => {
  expect(spent(mk({ impressions: 10_000 }), now)).toBe(120); // 10 × 12 ₺ CPM
  expect(spent(mk({ impressions: 10_000_000 }), now)).toBeLessThanOrEqual(1000);
});

it('tıklama oranı bir ondalıkla, sıfıra bölmez', () => {
  expect(ctr({ impressions: 1000, clicks: 37 })).toBe(3.7);
  expect(ctr({ impressions: 0, clicks: 0 })).toBe(0);
});

it('tahmini erişim aralığı', () => {
  expect(estimateReach('featured', 120, 10)).toEqual({ min: 80_000, max: 120_000 });
});

describe('validateDraft', () => {
  it('ürün ve yerleşime göre asgari bütçe ister', () => {
    expect(validateDraft({ placement: 'banner', daily: 100 }, [], now)).toEqual({
      product: 'Bir ürün seçin',
      budget: 'Bu yerleşim için en az 150 ₺/gün',
    });
  });

  it('aynı ürün + yerleşimde süren kampanyayı engeller, bitmiş olanı engellemez', () => {
    const running = [mk()];
    expect(validateDraft({ productId: 'p1', placement: 'featured', daily: 100 }, running, now).overlap).toBeDefined();
    expect(validateDraft({ productId: 'p1', placement: 'search', daily: 100 }, running, now)).toEqual({});
    const ended = [mk({ endsAt: new Date(now - DAY).toISOString() })];
    expect(validateDraft({ productId: 'p1', placement: 'featured', daily: 100 }, ended, now)).toEqual({});
  });
});

it('özet etkin durumları sayar', () => {
  const s = summarizePromotions(
    [mk({ impressions: 1000, clicks: 50 }), mk({ status: 'paused' }), mk({ endsAt: new Date(now - 1).toISOString() })],
    now,
  );
  expect(s.active).toBe(1);
  expect(s.ctr).toBe(5);
});
