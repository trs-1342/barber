import type { Auth, User } from 'firebase/auth';

// tsconfig, kalıcı oturum için firebase/auth tiplerini React Native sürümüne eşler; o sürümde
// signInWithPopup tanımlı değildir. Metro web'de tarayıcı sürümünü yüklediği için çalışma anında vardır.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GoogleAuthProvider, signInWithPopup } = require('firebase/auth') as {
  GoogleAuthProvider: new () => unknown;
  signInWithPopup: (auth: Auth, provider: unknown) => Promise<{ user: User }>;
};

export async function googlePopupSignIn(auth: Auth): Promise<User> {
  return (await signInWithPopup(auth, new GoogleAuthProvider())).user;
}
