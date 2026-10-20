/**
 * Örnek veriyi veritabanına yüklemek için çıktı üretir.
 *   node scripts/seed.mts supabase > supabase/seed.sql    (SQL Editor'de çalıştır)
 *   node scripts/seed.mts firestore > firebase/seed.json  (Konsol / içe aktarma aracı için)
 * Node 22.18+ TypeScript'i doğrudan çalıştırır.
 */
import { shops } from '../src/data/seed.ts';

const target = process.argv[2];
const q = (s: string) => `'${s.replaceAll("'", "''")}'`;

if (target === 'supabase') {
  console.log('-- scripts/seed.mts tarafından üretildi; elle düzenleme.');
  for (const s of shops) {
    const tags = `array[${s.tags.map(q).join(',')}]::text[]`;
    console.log(
      `insert into public.shops (id,name,district,address,rating,review_count,cover,tags,opens_at,closes_at,services,staff) values ` +
        `(${q(s.id)},${q(s.name)},${q(s.district)},${q(s.address)},${s.rating},${s.reviewCount},null,${tags},` +
        `${s.opensAt},${s.closesAt},${q(JSON.stringify(s.services))}::jsonb,${q(JSON.stringify(s.staff))}::jsonb) ` +
        `on conflict (id) do update set name=excluded.name, services=excluded.services, staff=excluded.staff;`,
    );
  }
} else if (target === 'firestore') {
  console.log(JSON.stringify(Object.fromEntries(shops.map(({ id, ...rest }) => [id, rest])), null, 2));
} else {
  console.error('Kullanım: node scripts/seed.mts <supabase|firestore>');
  process.exit(1);
}
