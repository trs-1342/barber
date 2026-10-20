import { useEffect, useSyncExternalStore } from 'react';

import { repo, type Appointment, type NewAppointment } from '@/data';

/**
 * Randevular için bağımlılıksız global store. useSyncExternalStore sayesinde yalnızca
 * abone olan bileşenler yeniden çizilir; yazma işlemleri iyimser (optimistic) uygulanır.
 */
type State = { items: Appointment[]; loading: boolean; error?: Error; loaded: boolean };

let state: State = { items: [], loading: false, loaded: false };
const listeners = new Set<() => void>();

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const appointmentStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: () => state,

  async load() {
    set({ loading: true, error: undefined });
    try {
      set({ items: await repo.listAppointments(), loading: false, loaded: true });
    } catch (e) {
      set({ error: e as Error, loading: false });
    }
  },

  async add(input: NewAppointment) {
    const created = await repo.createAppointment(input);
    set({ items: [created, ...state.items] });
    return created;
  },

  async cancel(id: string) {
    const prev = state.items;
    set({ items: prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a)) });
    try {
      await repo.cancelAppointment(id);
    } catch (e) {
      set({ items: prev }); // geri al
      throw e;
    }
  },

  /** Testler için. */
  reset(items: Appointment[] = []) {
    state = { items, loading: false, loaded: true };
    listeners.forEach((l) => l());
  },
};

export function useAppointments() {
  const s = useSyncExternalStore(appointmentStore.subscribe, appointmentStore.get, appointmentStore.get);
  useEffect(() => {
    if (!appointmentStore.get().loaded && !appointmentStore.get().loading) appointmentStore.load();
  }, []);
  return s;
}
