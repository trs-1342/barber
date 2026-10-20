import { useEffect, useSyncExternalStore } from 'react';

/** Bağımlılıksız küçük store: yalnızca abone olan bileşenler yeniden çizilir. */
export function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  const store = {
    get: () => state,
    set(next: T | ((prev: T) => T)) {
      state = typeof next === 'function' ? (next as (p: T) => T)(state) : next;
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
  const useStore = () => useSyncExternalStore(store.subscribe, store.get, store.get);
  return [store, useStore] as const;
}

export type ListState<T> = { items: T[]; loading: boolean; loaded: boolean; error?: Error };

/** Liste + yükleme durumu; ilk abonelikte veriyi çeker. */
export function createListStore<T extends { id: string }>(fetch: () => Promise<T[]>) {
  const [store, useRaw] = createStore<ListState<T>>({ items: [], loading: false, loaded: false });
  let inflight: Promise<void> | null = null;

  function load() {
    // Aynı anda birden çok ekran isterse tek istek atılır.
    inflight ??= (async () => {
      store.set((s) => ({ ...s, loading: true, error: undefined }));
      try {
        store.set({ items: await fetch(), loading: false, loaded: true });
      } catch (e) {
        store.set((s) => ({ ...s, loading: false, error: e as Error }));
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  }

  /** Tek kaydı yerinde günceller ya da başa ekler. */
  function upsert(item: T) {
    store.set((s) => {
      const exists = s.items.some((x) => x.id === item.id);
      return { ...s, items: exists ? s.items.map((x) => (x.id === item.id ? item : x)) : [item, ...s.items] };
    });
  }

  function useList() {
    const s = useRaw();
    useEffect(() => {
      const cur = store.get();
      if (!cur.loaded && !cur.loading) load();
    }, []);
    return s;
  }

  const reset = () => store.set({ items: [], loading: false, loaded: false });
  return { store, load, upsert, useList, reset };
}
