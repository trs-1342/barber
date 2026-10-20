-- Barber — Supabase şeması. SQL Editor'de bir kez çalıştırılır (tekrar çalıştırılabilir).
create extension if not exists btree_gist;

create table if not exists public.shops (
  id           text primary key,
  name         text not null,
  district     text not null,
  address      text not null,
  rating       numeric(2,1) not null default 0,
  review_count int not null default 0,
  cover        text,
  tags         text[] not null default '{}',
  opens_at     smallint not null check (opens_at between 0 and 23),
  closes_at    smallint not null check (closes_at between 1 and 24 and closes_at > opens_at),
  services     jsonb not null default '[]',
  staff        jsonb not null default '[]'
);

create table if not exists public.appointments (
  id           uuid primary key default gen_random_uuid(),
  shop_id      text not null references public.shops(id) on delete cascade,
  shop_name    text not null,
  staff_id     text,
  staff_name   text not null,
  services     jsonb not null default '[]',
  start_at     timestamptz not null,
  duration_min int not null check (duration_min > 0 and duration_min <= 480),
  end_at       timestamptz not null,
  total        int not null check (total >= 0),
  status       text not null default 'pending'
               check (status in ('pending','confirmed','completed','cancelled','noshow')),
  created_at   timestamptz not null default now()
);

-- end_at istemciden gelmez; her yazımda start_at + süre olarak hesaplanır.
create or replace function public.set_end_at() returns trigger language plpgsql as $$
begin
  new.end_at := new.start_at + make_interval(mins => new.duration_min);
  return new;
end $$;

drop trigger if exists appointments_end_at on public.appointments;
create trigger appointments_end_at before insert or update of start_at, duration_min
  on public.appointments for each row execute function public.set_end_at();

-- Çift rezervasyon kilidi: aynı personelin iptal edilmemiş randevuları çakışamaz.
-- İhlal 23P01 (exclusion_violation) döner; istemci bunu SlotTakenError'a çevirir.
alter table public.appointments drop constraint if exists appointments_no_overlap;
alter table public.appointments add constraint appointments_no_overlap
  exclude using gist (
    shop_id with =,
    staff_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  ) where (status <> 'cancelled' and staff_id is not null);

create index if not exists appointments_start_idx on public.appointments (start_at desc);

-- RLS (satır düzeyi güvenlik). DEMO: giriş sistemi yokken anon herkes randevuları görebilir.
-- Giriş eklenince appointments'a user_id ekleyip politikaları auth.uid() ile daralt.
alter table public.shops enable row level security;
alter table public.appointments enable row level security;

drop policy if exists shops_read on public.shops;
create policy shops_read on public.shops for select using (true);

drop policy if exists appt_read on public.appointments;
create policy appt_read on public.appointments for select using (true);

drop policy if exists appt_insert on public.appointments;
create policy appt_insert on public.appointments for insert
  with check (status = 'pending' and start_at > now());

drop policy if exists appt_cancel on public.appointments;
create policy appt_cancel on public.appointments for update
  using (status in ('pending','confirmed'))
  with check (status = 'cancelled');
