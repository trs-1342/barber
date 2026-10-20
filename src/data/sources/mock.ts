import { filterShops, NotFoundError, overlaps, SlotTakenError, type Repository } from '../repository';
import { seedAppointments, shops } from '../seed';
import type { Appointment } from '../types';

/** Ağ olmadan çalışan kaynak: demo, test ve bağlantı yokken yedek. */
const LATENCY_MS = 250;

function delay<T>(value: T, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => resolve(value), LATENCY_MS);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

export function createMockRepository(latency = true): Repository {
  let appointments: Appointment[] = [...seedAppointments];
  const wait = <T,>(v: T, signal?: AbortSignal) => (latency ? delay(v, signal) : Promise.resolve(v));

  return {
    listShops: (params, signal) => wait(filterShops(shops, params), signal),

    async getShop(id, signal) {
      const shop = shops.find((s) => s.id === id);
      if (!shop) throw new NotFoundError('İşletme');
      return wait(shop, signal);
    },

    listAppointments: (signal) => wait(appointments, signal),

    async createAppointment(input) {
      const clash = appointments.some(
        (a) =>
          a.status !== 'cancelled' &&
          a.shopId === input.shopId &&
          a.staffId !== null &&
          a.staffId === input.staffId &&
          overlaps(a, input),
      );
      if (clash) throw new SlotTakenError();
      const created: Appointment = { ...input, id: `a${Date.now()}`, status: 'pending' };
      appointments = [created, ...appointments];
      return wait(created);
    },

    async cancelAppointment(id) {
      appointments = appointments.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a));
      await wait(undefined);
    },
  };
}
