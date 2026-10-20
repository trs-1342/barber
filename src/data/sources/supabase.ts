import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from '@/lib/env';

import { filterShops, NotFoundError, SlotTakenError, type Repository } from '../repository';
import type { Appointment, Shop } from '../types';

/**
 * Tablo şeması `supabase/schema.sql` dosyasında. Çift rezervasyonu veritabanı engeller
 * (EXCLUDE kısıtı); ihlal 23P01 koduyla döner.
 */
let client: SupabaseClient | undefined;
function sb() {
  client ??= createClient(env.supabase.url, env.supabase.anonKey, {
    auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return client;
}

type AppointmentRow = {
  id: string;
  shop_id: string;
  shop_name: string;
  staff_id: string | null;
  staff_name: string;
  services: Appointment['services'];
  start_at: string;
  duration_min: number;
  total: number;
  status: Appointment['status'];
};

const toAppointment = (r: AppointmentRow): Appointment => ({
  id: r.id,
  shopId: r.shop_id,
  shopName: r.shop_name,
  staffId: r.staff_id,
  staffName: r.staff_name,
  services: r.services,
  start: r.start_at,
  durationMin: r.duration_min,
  total: r.total,
  status: r.status,
});

type ShopRow = Omit<Shop, 'reviewCount' | 'opensAt' | 'closesAt'> & {
  review_count: number;
  opens_at: number;
  closes_at: number;
};

const toShop = ({ review_count, opens_at, closes_at, ...r }: ShopRow): Shop => ({
  ...r,
  reviewCount: review_count,
  opensAt: opens_at,
  closesAt: closes_at,
});

export function createSupabaseRepository(): Repository {
  return {
    async listShops(params, signal) {
      let q = sb().from('shops').select('*');
      if (signal) q = q.abortSignal(signal);
      const { data, error } = await q;
      if (error) throw error;
      return filterShops((data as ShopRow[]).map(toShop), params);
    },

    async getShop(id, signal) {
      let q = sb().from('shops').select('*').eq('id', id);
      if (signal) q = q.abortSignal(signal);
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      if (!data) throw new NotFoundError('İşletme');
      return toShop(data as ShopRow);
    },

    async listAppointments(signal) {
      let q = sb().from('appointments').select('*').order('start_at', { ascending: false });
      if (signal) q = q.abortSignal(signal);
      const { data, error } = await q;
      if (error) throw error;
      return (data as AppointmentRow[]).map(toAppointment);
    },

    async createAppointment(input) {
      const { data, error } = await sb()
        .from('appointments')
        .insert({
          shop_id: input.shopId,
          shop_name: input.shopName,
          staff_id: input.staffId,
          staff_name: input.staffName,
          services: input.services,
          start_at: input.start,
          duration_min: input.durationMin,
          total: input.total,
        })
        .select()
        .single();
      if (error?.code === '23P01') throw new SlotTakenError();
      if (error) throw error;
      return toAppointment(data as AppointmentRow);
    },

    async cancelAppointment(id) {
      const { error } = await sb().from('appointments').update({ status: 'cancelled' }).eq('id', id);
      if (error) throw error;
    },
  };
}
