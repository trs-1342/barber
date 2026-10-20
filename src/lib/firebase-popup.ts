import type { Auth, User } from 'firebase/auth';

/** Açılır pencereyle Google girişi yalnızca web'de vardır (bkz. firebase-popup.web.ts). */
export async function googlePopupSignIn(_auth: Auth): Promise<User> {
  throw new Error('Açılır pencereyle giriş yalnızca web sürümünde kullanılır');
}
