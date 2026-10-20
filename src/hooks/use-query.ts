import { useCallback, useEffect, useRef, useState } from 'react';

type State<T> = { data?: T; error?: Error; loading: boolean };

/**
 * Bağımlılık eklemeden küçük bir veri çekme kancası: yarış koşullarını AbortController ile
 * önler, yenilemede eski veriyi gösterirken arka planda yükler.
 */
export function useQuery<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<State<T>>({ loading: true });
  const [refreshing, setRefreshing] = useState(false);
  const controller = useRef<AbortController | null>(null);

  // deps çağıranın sorumluluğunda; fetcher her render'da yeni olabilir.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fetcher, deps);

  const load = useCallback(
    async (isRefresh = false) => {
      controller.current?.abort();
      const c = new AbortController();
      controller.current = c;
      if (isRefresh) setRefreshing(true);
      else setState((s) => ({ ...s, loading: true, error: undefined }));
      try {
        const data = await run(c.signal);
        if (!c.signal.aborted) setState({ data, loading: false });
      } catch (e) {
        if (!c.signal.aborted) setState((s) => ({ ...s, error: e as Error, loading: false }));
      } finally {
        if (!c.signal.aborted) setRefreshing(false);
      }
    },
    [run],
  );

  useEffect(() => {
    load();
    return () => controller.current?.abort();
  }, [load]);

  return { ...state, refreshing, refetch: () => load(true) };
}
