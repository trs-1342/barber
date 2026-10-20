import { env, type DataSource } from '@/lib/env';

import type { Repository } from './repository';
import { createFirebaseRepository } from './sources/firebase';
import { createMockRepository } from './sources/mock';
import { createSupabaseRepository } from './sources/supabase';

function create(source: DataSource): Repository {
  switch (source) {
    case 'firebase':
      return createFirebaseRepository();
    case 'supabase':
      return createSupabaseRepository();
    default:
      // Demo: giriş gerekmeden demo tedarikçiyle açılır.
      return createMockRepository(true, true);
  }
}

/**
 * Veri kaynağı çalışma anında değiştirilebilir (Demo veri / Gerçek veri). İlk değer
 * `.env` içindeki EXPO_PUBLIC_DATA_SOURCE; kullanıcı seçimi store tarafından saklanır.
 * Kaynaklar ilk kullanımda bir kez oluşturulur, böylece demo verisindeki değişiklikler
 * kaynak değiştirip geri dönünce kaybolmaz.
 */
let current: DataSource = env.dataSource;
const cache: Partial<Record<DataSource, Repository>> = {};
const getRepo = (source: DataSource = current) => (cache[source] ??= create(source));

export const getDataSource = () => current;
/** Yalnızca kaynağı değiştirir; oturum ve liste sıfırlaması `@/store` içindeki `setDataSource` ile yapılır. */
export function setRepoSource(source: DataSource) {
  current = source;
}

/** Ekranların kullandığı tek giriş noktası: her çağrı o anki kaynağa yönlenir. */
export const repo: Repository = new Proxy({} as Repository, {
  get: (_t, key: keyof Repository) => getRepo()[key],
});

export { AuthError, InvalidTransitionError, NotFoundError, ValidationError } from './repository';
export type { AccountInfo, Credentials, ProductInput, PromotionInput, Registration, Repository } from './repository';
export * from './types';
