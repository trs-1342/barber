import { env } from '@/lib/env';

import type { Repository } from './repository';
import { createFirebaseRepository } from './sources/firebase';
import { createMockRepository } from './sources/mock';
import { createSupabaseRepository } from './sources/supabase';

/** Veri kaynağı `.env` içindeki EXPO_PUBLIC_DATA_SOURCE ile seçilir. */
function create(): Repository {
  switch (env.dataSource) {
    case 'firebase':
      return createFirebaseRepository();
    case 'supabase':
      return createSupabaseRepository();
    default:
      return createMockRepository();
  }
}

export const repo: Repository = create();

export { AuthError, InvalidTransitionError, NotFoundError } from './repository';
export type { Credentials, ProductInput, PromotionInput, Registration, Repository } from './repository';
export * from './types';
