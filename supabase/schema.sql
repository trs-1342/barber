-- Barber Tedarikçi — Supabase şeması. SQL Editor'de bir kez çalıştırılır (tekrar çalıştırılabilir).
-- Kimlik: Supabase Auth (e-posta/şifre). suppliers.id = auth.users.id

create table if not exists public.suppliers (
  id           uuid primary key references auth.users(id) on delete cascade,
  company_name text not null check (length(company_name) >= 2),
  contact_name text not null,
  email        text not null,
  phone        text not null,
  city         text not null default 'İstanbul',
  tax_number   text not null check (tax_number ~ '^\d{10,11}$'),
  created_at   timestamptz not null default now()
);

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  supplier_id uuid not null default auth.uid() references public.suppliers(id) on delete cascade,
  name        text not null check (length(name) >= 2),
  brand       text not null,
  category    text not null default 'Genel',
  price       numeric(12,2) not null check (price > 0),
  stock       int not null default 0 check (stock >= 0),
  unit        text not null default 'adet',
  active      boolean not null default true,
  featured    boolean not null default false
);
create index if not exists products_supplier_idx on public.products (supplier_id);

-- Siparişleri salon uygulaması oluşturur; tedarikçi yalnızca durumu ilerletir.
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  supplier_id    uuid not null references public.suppliers(id) on delete cascade,
  salon_id       text not null,
  salon_name     text not null,
  salon_district text not null,
  items          jsonb not null check (jsonb_typeof(items) = 'array'),
  total          numeric(12,2) not null check (total >= 0),
  status         text not null default 'new'
                 check (status in ('new','preparing','shipped','delivered','cancelled')),
  note           text,
  created_at     timestamptz not null default now()
);
create index if not exists orders_supplier_created_idx on public.orders (supplier_id, created_at desc);

create table if not exists public.promotions (
  id           uuid primary key default gen_random_uuid(),
  supplier_id  uuid not null default auth.uid() references public.suppliers(id) on delete cascade,
  product_id   uuid not null references public.products(id) on delete cascade,
  product_name text not null,
  placement    text not null check (placement in ('featured','banner','search')),
  daily_budget numeric(10,2) not null check (daily_budget >= 50),
  starts_at    timestamptz not null,
  ends_at      timestamptz not null check (ends_at > starts_at),
  status       text not null default 'active' check (status in ('active','paused','ended')),
  impressions  int not null default 0,
  clicks       int not null default 0
);

-- Sipariş durum makinesi: istemci ne gönderirse göndersin geçersiz geçiş reddedilir (P0001).
create or replace function public.check_order_transition() returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status and not (
       (old.status = 'new'       and new.status in ('preparing','cancelled'))
    or (old.status = 'preparing' and new.status in ('shipped','cancelled'))
    or (old.status = 'shipped'   and new.status = 'delivered')
  ) then
    raise exception 'Geçersiz durum geçişi: % -> %', old.status, new.status using errcode = 'P0001';
  end if;
  -- Tedarikçi sipariş içeriğini değiştiremez.
  if (new.items, new.total, new.supplier_id, new.salon_id) is distinct from (old.items, old.total, old.supplier_id, old.salon_id) then
    raise exception 'Sipariş içeriği değiştirilemez' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists orders_transition on public.orders;
create trigger orders_transition before update on public.orders
  for each row execute function public.check_order_transition();

-- Kampanya sayaçlarını istemci değiştiremez.
create or replace function public.protect_promotion_counters() returns trigger language plpgsql as $$
begin
  if old.status = 'ended' or old.ends_at <= now() then
    raise exception 'Biten kampanya değiştirilemez' using errcode = 'P0002';
  end if;
  new.impressions := old.impressions;
  new.clicks := old.clicks;
  return new;
end $$;

drop trigger if exists promotions_counters on public.promotions;
create trigger promotions_counters before update on public.promotions
  for each row execute function public.protect_promotion_counters();

-- RLS: her tedarikçi yalnızca kendi satırlarını görür ve değiştirir.
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.promotions enable row level security;

drop policy if exists sup_self on public.suppliers;
create policy sup_self on public.suppliers for all
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists prod_own on public.products;
create policy prod_own on public.products for all
  using (supplier_id = auth.uid()) with check (supplier_id = auth.uid());

drop policy if exists ord_read on public.orders;
create policy ord_read on public.orders for select using (supplier_id = auth.uid());
drop policy if exists ord_update on public.orders;
create policy ord_update on public.orders for update
  using (supplier_id = auth.uid()) with check (supplier_id = auth.uid());

drop policy if exists promo_own on public.promotions;
create policy promo_own on public.promotions for all
  using (supplier_id = auth.uid()) with check (supplier_id = auth.uid());
