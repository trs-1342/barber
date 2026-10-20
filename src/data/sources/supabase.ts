import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type PostgrestError, type SupabaseClient } from '@supabase/supabase-js';

import { env } from '@/lib/env';

import { AuthError, InvalidTransitionError, NotFoundError, type Repository } from '../repository';
import type { Order, Product, Promotion, Supplier } from '../types';

/**
 * Şema: supabase/schema.sql. Satırlar RLS ile oturumdaki tedarikçiye sınırlıdır;
 * sipariş durum geçişlerini veritabanı tetikleyicisi doğrular (geçersizse 'P0001').
 */
let client: SupabaseClient | undefined;
function sb() {
  client ??= createClient(env.supabase.url, env.supabase.anonKey, {
    auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return client;
}

// Veritabanı snake_case, uygulama camelCase kullanır.
const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const mapKeys = (o: object, f: (k: string) => string) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [f(k), v]));
const fromRow = <T,>(r: object) => mapKeys(r, toCamel) as T;
const toRow = (o: object) => mapKeys(o, toSnake);

type Row = Record<string, unknown>;

function check<T = Row>({ data, error }: { data: unknown; error: PostgrestError | null }): T {
  if (error?.code === 'P0001') throw new InvalidTransitionError();
  if (error) throw error;
  if (data === null) throw new NotFoundError();
  return data as T;
}

async function uid() {
  const { data } = await sb().auth.getUser();
  if (!data.user) throw new AuthError('Oturum açılmamış');
  return data.user.id;
}

export function createSupabaseRepository(): Repository {
  return {
    async signIn({ email, password }) {
      const { data, error } = await sb().auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.user) throw new AuthError();
      const row = check(await sb().from('suppliers').select('*').eq('id', data.user.id).maybeSingle());
      return fromRow<Supplier>(row);
    },

    async register({ password, ...profile }) {
      const { data, error } = await sb().auth.signUp({ email: profile.email.trim(), password });
      if (error || !data.user) throw new AuthError(error?.message ?? 'Kayıt başarısız');
      const row = check(
        await sb()
          .from('suppliers')
          .insert(toRow({ ...profile, id: data.user.id }))
          .select()
          .single(),
      );
      return fromRow<Supplier>(row);
    },

    async signOut() {
      await sb().auth.signOut();
    },

    async updateSupplier(patch) {
      const row = check(await sb().from('suppliers').update(toRow(patch)).eq('id', await uid()).select().single());
      return fromRow<Supplier>(row);
    },

    async listOrders(signal) {
      let q = sb().from('orders').select('*').order('created_at', { ascending: false });
      if (signal) q = q.abortSignal(signal);
      return check<Row[]>(await q).map((r) => fromRow<Order>(r));
    },

    async updateOrderStatus(id, status) {
      const row = check(await sb().from('orders').update({ status }).eq('id', id).select().maybeSingle());
      return fromRow<Order>(row);
    },

    async listProducts(signal) {
      let q = sb().from('products').select('*').order('name');
      if (signal) q = q.abortSignal(signal);
      return check<Row[]>(await q).map((r) => fromRow<Product>(r));
    },

    async saveProduct(input, id) {
      const row = toRow({ ...input, supplierId: await uid() });
      const res = id
        ? await sb().from('products').update(row).eq('id', id).select().single()
        : await sb().from('products').insert(row).select().single();
      const { supplierId: _s, ...product } = fromRow<Product & { supplierId: string }>(check(res));
      return product;
    },

    async listPromotions(signal) {
      let q = sb().from('promotions').select('*').order('starts_at', { ascending: false });
      if (signal) q = q.abortSignal(signal);
      return check<Row[]>(await q).map((r) => fromRow<Promotion>(r));
    },

    async createPromotion(input) {
      const row = check(
        await sb()
          .from('promotions')
          .insert(toRow({ ...input, supplierId: await uid() }))
          .select()
          .single(),
      );
      return fromRow<Promotion>(row);
    },

    async setPromotionStatus(id, status) {
      const patch = status === 'ended' ? { status, ends_at: new Date().toISOString() } : { status };
      check(await sb().from('promotions').update(patch).eq('id', id).select().single());
    },
  };
}
