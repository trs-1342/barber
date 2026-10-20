import { filterShops, overlaps, SlotTakenError } from '@/data/repository';
import { shops } from '@/data/seed';
import { createMockRepository } from '@/data/sources/mock';

describe('filterShops', () => {
  it('Türkçe büyük/küçük harfe duyarsız arar', () => {
    expect(filterShops(shops, { query: 'ÜSKÜDAR' }).map((s) => s.id)).toEqual(['s4']);
    expect(filterShops(shops, { query: 'klasik' }).map((s) => s.id)).toEqual(['s1']);
  });

  it('etikete göre süzer', () => {
    expect(filterShops(shops, { tag: 'Boya' }).every((s) => s.tags.includes('Boya'))).toBe(true);
  });
});

it('overlaps yarı açık aralık kullanır', () => {
  const a = { start: '2030-01-01T10:00:00.000Z', durationMin: 30 };
  expect(overlaps(a, { start: '2030-01-01T10:29:00.000Z', durationMin: 10 })).toBe(true);
  expect(overlaps(a, { start: '2030-01-01T10:30:00.000Z', durationMin: 10 })).toBe(false);
});

describe('mock repository', () => {
  const input = {
    shopId: 's1',
    shopName: 'Klasik Makas',
    staffId: 'st1',
    staffName: 'Ahmet Yılmaz',
    services: [],
    start: '2031-05-05T09:00:00.000Z',
    durationMin: 30,
    total: 350,
  };

  it('aynı personele çakışan ikinci randevuyu reddeder', async () => {
    const repo = createMockRepository(false);
    await expect(repo.createAppointment(input)).resolves.toMatchObject({ status: 'pending' });
    await expect(repo.createAppointment(input)).rejects.toBeInstanceOf(SlotTakenError);
  });

  it('iptal edilen randevunun saati yeniden alınabilir', async () => {
    const repo = createMockRepository(false);
    const a = await repo.createAppointment(input);
    await repo.cancelAppointment(a.id);
    await expect(repo.createAppointment(input)).resolves.toBeDefined();
  });

  it('olmayan işletme için hata verir', async () => {
    await expect(createMockRepository(false).getShop('yok')).rejects.toThrow('bulunamadı');
  });
});
