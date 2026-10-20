/**
 * Supabase için örnek veri SQL'i üretir: npm run seed:sql → supabase/seed.sql
 * Önce uygulamadan DEMO_EMAIL ile kayıt ol, sonra SQL Editor'de seed.sql'i çalıştır.
 * Node 22.18+ TypeScript'i doğrudan çalıştırır.
 */
import { orders, products, promotions } from '../src/data/seed.ts';

const email = process.argv[2] ?? 'demo@atlas.com';
const q = (s: string) => `'${s.replaceAll("'", "''")}'`;
const sup = `(select id from public.suppliers where email = ${q(email)})`;
const out: string[] = [
  `-- scripts/seed.mts tarafından üretildi; elle düzenleme. Tedarikçi: ${email}`,
  'begin;',
  `delete from public.promotions where supplier_id = ${sup};`,
  `delete from public.orders where supplier_id = ${sup};`,
  `delete from public.products where supplier_id = ${sup};`,
  'create temp table _pid (seed_id text, id uuid) on commit drop;',
];

for (const p of products) {
  out.push(
    `with ins as (insert into public.products (supplier_id,name,brand,category,price,stock,unit,active,featured) values ` +
      `(${sup},${q(p.name)},${q(p.brand)},${q(p.category)},${p.price},${p.stock},${q(p.unit)},${p.active},${p.featured}) returning id) ` +
      `insert into _pid select ${q(p.id)}, id from ins;`,
  );
}

// Sipariş satırlarındaki ürün kimliklerini yeni uuid'lerle değiştir.
for (const o of orders) {
  const items = `(select jsonb_agg(jsonb_set(it, '{productId}', to_jsonb((select id::text from _pid where seed_id = it->>'productId')))) from jsonb_array_elements(${q(JSON.stringify(o.items))}::jsonb) it)`;
  out.push(
    `insert into public.orders (code,supplier_id,salon_id,salon_name,salon_district,items,total,status,note,created_at) values ` +
      `(${q(o.code)}||'-'||left(${sup}::text,4),${sup},${q(o.salonId)},${q(o.salonName)},${q(o.salonDistrict)},${items},${o.total},${q(o.status)},${o.note ? q(o.note) : 'null'},now() - interval '${Math.round((Date.now() - Date.parse(o.createdAt)) / 60000)} minutes');`,
  );
}

for (const p of promotions) {
  const startOff = Math.round((Date.now() - Date.parse(p.startsAt)) / 60000);
  const endOff = Math.round((Date.parse(p.endsAt) - Date.now()) / 60000);
  out.push(
    `insert into public.promotions (supplier_id,product_id,product_name,placement,daily_budget,starts_at,ends_at,status,impressions,clicks) values ` +
      `(${sup},(select id from _pid where seed_id = ${q(p.productId)}),${q(p.productName)},${q(p.placement)},${p.dailyBudget},` +
      `now() - interval '${startOff} minutes', now() + interval '${endOff} minutes',${q(p.status)},${p.impressions},${p.clicks});`,
  );
}
out.push('commit;');
console.log(out.join('\n'));
