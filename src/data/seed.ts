import type { Order, OrderItem, OrderStatus, Product, Promotion, Supplier } from './types';

// Gerçek backend bağlanmadan ekranlar bu verilerle çalışır.
export const supplier: Supplier = {
  id: 'sup1',
  companyName: 'Atlas Kuaför Malzemeleri',
  contactName: 'Demo Tedarikçi',
  email: 'demo@atlas.com',
  phone: '0212 000 00 00',
  city: 'İstanbul',
  taxNumber: '1234567890',
};

export const products: Product[] = [
  { id: 'p1', name: 'Mat Şekillendirici Wax 100 ml', brand: 'Atlas Pro', category: 'Şekillendirici', price: 145, stock: 320, unit: 'adet', active: true, featured: true },
  { id: 'p2', name: 'Tıraş Köpüğü 400 ml', brand: 'Atlas Pro', category: 'Tıraş', price: 89, stock: 12, unit: 'adet', active: true, featured: false },
  { id: 'p3', name: 'Kolonya 1 lt (Limon)', brand: 'Eyüp Sabri', category: 'Kolonya', price: 210, stock: 85, unit: 'adet', active: true, featured: false },
  { id: 'p4', name: 'Tek Kullanımlık Jilet (100\'lü)', brand: 'Derby', category: 'Sarf', price: 260, stock: 4, unit: 'kutu', active: true, featured: false },
  { id: 'p5', name: 'Keratin Şampuan 5 lt', brand: 'Atlas Pro', category: 'Şampuan', price: 640, stock: 40, unit: 'bidon', active: true, featured: true },
  { id: 'p6', name: 'Boyun Kağıdı (5 rulo)', brand: 'Atlas', category: 'Sarf', price: 75, stock: 500, unit: 'paket', active: true, featured: false },
  { id: 'p7', name: 'Sakal Yağı 50 ml', brand: 'Beard Co', category: 'Bakım', price: 180, stock: 0, unit: 'adet', active: false, featured: false },
  { id: 'p9', name: 'Ense Fırçası (Ahşap)', brand: 'Atlas', category: 'Sarf', price: 95, stock: 0, unit: 'adet', active: true, featured: false },
  { id: 'p8', name: 'Saç Kurutma Makinesi 2400W', brand: 'Parlux', category: 'Cihaz', price: 3450, stock: 9, unit: 'adet', active: true, featured: false },
];

const salons = [
  { id: 'sl1', name: 'Klasik Makas', district: 'Kadıköy' },
  { id: 'sl2', name: 'Gentleman Club', district: 'Şişli' },
  { id: 'sl3', name: 'Usta İşi Barber', district: 'Beşiktaş' },
  { id: 'sl4', name: 'Köşe Berber', district: 'Üsküdar' },
  { id: 'sl5', name: 'Makas & Jilet', district: 'Bakırköy' },
];

const statuses: OrderStatus[] = ['new', 'new', 'preparing', 'shipped', 'delivered', 'delivered', 'delivered', 'cancelled'];

/** Deterministik sahte siparişler: son 30 güne yayılmış, tekrar üretildiğinde aynı. */
function makeOrders(count: number): Order[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const salon = salons[i % salons.length]!;
    const lineCount = 1 + (i % 3);
    const items: OrderItem[] = Array.from({ length: lineCount }, (_, j) => {
      const p = products[(i * 3 + j * 2) % products.length]!;
      return { productId: p.id, name: p.name, qty: 1 + ((i + j) % 6), unitPrice: p.price };
    });
    const ageHours = i < 4 ? i * 3 : i * 17;
    return {
      id: `o${i + 1}`,
      code: `SP-${(10241 + i).toString()}`,
      salonId: salon.id,
      salonName: salon.name,
      salonDistrict: salon.district,
      items,
      total: items.reduce((s, it) => s + it.qty * it.unitPrice, 0),
      status: i < 2 ? 'new' : statuses[i % statuses.length]!,
      createdAt: new Date(now - ageHours * 3_600_000).toISOString(),
      note: i % 5 === 0 ? 'Cumartesi öğleden önce teslim edilirse sevinirim.' : undefined,
    };
  });
}

export const orders: Order[] = makeOrders(40);

export const promotions: Promotion[] = [
  {
    id: 'pr1',
    productId: 'p1',
    productName: products[0]!.name,
    placement: 'featured',
    dailyBudget: 150,
    startsAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    endsAt: new Date(Date.now() + 9 * 86_400_000).toISOString(),
    status: 'active',
    impressions: 12840,
    clicks: 392,
  },
  {
    id: 'pr2',
    productId: 'p5',
    productName: products[4]!.name,
    placement: 'banner',
    dailyBudget: 300,
    startsAt: new Date(Date.now() - 20 * 86_400_000).toISOString(),
    endsAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    status: 'ended',
    impressions: 40210,
    clicks: 1104,
  },
  {
    // Demo: süresi bitmeden toplam bütçesi tükenen kampanya.
    id: 'pr3',
    productId: 'p3',
    productName: products[2]!.name,
    placement: 'search',
    dailyBudget: 50,
    startsAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
    endsAt: new Date(Date.now() + 4 * 86_400_000).toISOString(),
    status: 'active',
    impressions: 58200,
    clicks: 1630,
  },
];
