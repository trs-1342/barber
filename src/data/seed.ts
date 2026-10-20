import type { Appointment, Service, Shop, Staff } from './types';

// Görev gerçek bir API vermezse ekranlar bu verilerle çalışır.
const services: Service[] = [
  { id: 'sv1', name: 'Saç Kesimi', durationMin: 30, price: 350, category: 'Saç' },
  { id: 'sv2', name: 'Sakal Tıraşı', durationMin: 20, price: 200, category: 'Sakal' },
  { id: 'sv3', name: 'Saç + Sakal', durationMin: 45, price: 500, category: 'Saç' },
  { id: 'sv4', name: 'Çocuk Tıraşı', durationMin: 20, price: 250, category: 'Saç' },
  { id: 'sv5', name: 'Cilt Bakımı', durationMin: 40, price: 600, category: 'Bakım' },
  { id: 'sv6', name: 'Saç Boyama', durationMin: 60, price: 900, category: 'Boya' },
];

const staff: Staff[] = [
  { id: 'st1', name: 'Ahmet Yılmaz', title: 'Kıdemli Berber', rating: 4.9 },
  { id: 'st2', name: 'Mehmet Kaya', title: 'Berber', rating: 4.7 },
  { id: 'st3', name: 'Emre Demir', title: 'Stilist', rating: 4.8 },
];

const pick = <T,>(arr: T[], idx: number[]) => idx.map((i) => arr[i]!);

export const shops: Shop[] = [
  {
    id: 's1',
    name: 'Klasik Makas',
    district: 'Kadıköy',
    address: 'Moda Cd. No:12, Kadıköy / İstanbul',
    rating: 4.8,
    reviewCount: 312,
    tags: ['Saç', 'Sakal', 'Bakım'],
    opensAt: 9,
    closesAt: 21,
    services: pick(services, [0, 1, 2, 4]),
    staff: pick(staff, [0, 1]),
  },
  {
    id: 's2',
    name: 'Usta İşi Barber',
    district: 'Beşiktaş',
    address: 'Çarşı Sk. No:4, Beşiktaş / İstanbul',
    rating: 4.6,
    reviewCount: 189,
    tags: ['Saç', 'Boya'],
    opensAt: 10,
    closesAt: 22,
    services: pick(services, [0, 2, 3, 5]),
    staff: pick(staff, [1, 2]),
  },
  {
    id: 's3',
    name: 'Gentleman Club',
    district: 'Şişli',
    address: 'Halaskargazi Cd. No:88, Şişli / İstanbul',
    rating: 4.9,
    reviewCount: 540,
    tags: ['Saç', 'Sakal', 'Bakım', 'Boya'],
    opensAt: 9,
    closesAt: 20,
    services,
    staff,
  },
  {
    id: 's4',
    name: 'Köşe Berber',
    district: 'Üsküdar',
    address: 'Hakimiyeti Milliye Cd. No:21, Üsküdar / İstanbul',
    rating: 4.4,
    reviewCount: 76,
    tags: ['Saç', 'Sakal'],
    opensAt: 8,
    closesAt: 20,
    services: pick(services, [0, 1, 3]),
    staff: pick(staff, [0]),
  },
];

function daysFromNow(days: number, hour: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const seedAppointments: Appointment[] = [
  {
    id: 'a1',
    shopId: 's1',
    shopName: 'Klasik Makas',
    staffId: 'st1',
    staffName: 'Ahmet Yılmaz',
    services: [services[2]!],
    start: daysFromNow(2, 14),
    durationMin: 45,
    total: 500,
    status: 'confirmed',
  },
  {
    id: 'a2',
    shopId: 's3',
    shopName: 'Gentleman Club',
    staffId: 'st3',
    staffName: 'Emre Demir',
    services: [services[0]!],
    start: daysFromNow(-10, 11),
    durationMin: 30,
    total: 350,
    status: 'completed',
  },
];
