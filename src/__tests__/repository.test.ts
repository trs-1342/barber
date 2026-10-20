import { AuthError, InvalidTransitionError, ValidationError } from '@/data/repository';
import { createMockRepository } from '@/data/sources/mock';

const fresh = () => createMockRepository(false);

describe('mock repository', () => {
  it('geçersiz giriş bilgisini reddeder', async () => {
    await expect(fresh().signIn({ email: 'yanlis', password: '123456' })).rejects.toBeInstanceOf(AuthError);
    await expect(fresh().signIn({ email: 'a@b.com', password: '123' })).rejects.toBeInstanceOf(AuthError);
  });

  it('demo modunda hesap bilgisi güncellenebilir', async () => {
    await expect(fresh().updateSupplier({ city: 'Ankara' })).resolves.toMatchObject({ city: 'Ankara' });
  });

  it('siparişi kurala uygun ilerletir, geçersiz geçişi reddeder', async () => {
    const repo = fresh();
    const order = (await repo.listOrders()).find((o) => o.status === 'new')!;
    await expect(repo.updateOrderStatus(order.id, 'delivered')).rejects.toBeInstanceOf(InvalidTransitionError);
    expect((await repo.updateOrderStatus(order.id, 'preparing')).status).toBe('preparing');
    expect((await repo.updateOrderStatus(order.id, 'shipped')).status).toBe('shipped');
    await expect(repo.updateOrderStatus(order.id, 'cancelled')).rejects.toBeInstanceOf(InvalidTransitionError);
  });

  it('siparişleri yeniden eskiye sıralar', async () => {
    const list = await fresh().listOrders();
    expect(list.every((o, i) => i === 0 || list[i - 1]!.createdAt >= o.createdAt)).toBe(true);
  });

  it('yeni ürün ekler ve mevcut ürünü günceller', async () => {
    const repo = fresh();
    const input = { name: 'Test', brand: 'B', category: 'C', price: 10, stock: 1, unit: 'adet', active: true, featured: false };
    const created = await repo.saveProduct(input);
    expect((await repo.listProducts())[0]!.id).toBe(created.id);
    await repo.saveProduct({ ...input, stock: 99 }, created.id);
    expect((await repo.listProducts()).find((p) => p.id === created.id)!.stock).toBe(99);
  });

  it('oturum değişikliklerini bildirir', async () => {
    const repo = fresh();
    const seen: (string | null)[] = [];
    const off = repo.onAuthChange((s) => seen.push(s?.email ?? null));
    await repo.signIn({ email: 'A@b.com', password: '123456' });
    await repo.signOut();
    off();
    await repo.signIn({ email: 'c@d.com', password: '123456' });
    expect(seen).toEqual([null, 'a@b.com', null]);
  });

  it('demo modunda oturum açık başlar', async () => {
    const repo = createMockRepository(false, true);
    expect((await repo.updateSupplier({ city: 'Ankara' })).city).toBe('Ankara');
  });

  it('pasif ya da stoksuz ürün için kampanya oluşturmaz', async () => {
    const repo = createMockRepository(false, true);
    const bad = (await repo.listProducts()).find((p) => !p.active || p.stock <= 0)!;
    const now = Date.now();
    await expect(
      repo.createPromotion({
        productId: bad.id,
        productName: bad.name,
        placement: 'featured',
        dailyBudget: 500,
        startsAt: new Date(now).toISOString(),
        endsAt: new Date(now + 7 * 864e5).toISOString(),
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
