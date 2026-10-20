import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { ValidationError } from '@/data/repository';
import { env } from '@/lib/env';

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

/** Expo Go'da Google'ın yerel modülü yoktur ve Google, Expo Go'nun kimliğiyle gelen girişi reddeder. */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let configured = false;

function load(): GoogleSigninModule {
  // Statik import Expo Go'da uygulamayı açılışta çökertir; modül yalnızca derlenmiş uygulamada yüklenir.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod: GoogleSigninModule = require('@react-native-google-signin/google-signin');
  if (!configured) {
    mod.GoogleSignin.configure({ webClientId: env.googleWebClientId });
    configured = true;
  }
  return mod;
}

/**
 * Yerel Google girişini açar ve Firebase/Supabase'e verilecek kimlik belirtecini (idToken) döner.
 * Kullanıcı vazgeçerse `null` döner.
 */
export async function getGoogleIdToken(): Promise<string | null> {
  if (Platform.OS === 'web') throw new ValidationError('Web için açılır pencereyle giriş kullanılır');
  if (isExpoGo) {
    throw new ValidationError(
      'Google ile giriş Expo Go içinde çalışmaz. Derlenmiş Android uygulamasında (npm run android) ya da web sürümünde deneyin.',
    );
  }
  if (!env.googleWebClientId) {
    throw new ValidationError('Google girişi yapılandırılmamış: .env içinde EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID eksik');
  }
  const { GoogleSignin, isErrorWithCode, statusCodes } = load();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    if (res.type !== 'success') return null;
    if (!res.data.idToken) throw new ValidationError('Google kimlik belirteci alınamadı (webClientId yanlış olabilir)');
    return res.data.idToken;
  } catch (e) {
    if (isErrorWithCode(e) && e.code === statusCodes.IN_PROGRESS) return null;
    if (isErrorWithCode(e) && e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new ValidationError('Bu cihazda Google Play Hizmetleri yok ya da güncel değil');
    }
    throw e;
  }
}

/** Sonraki girişte hesap seçici yeniden çıksın diye yerel Google oturumu da kapatılır. */
export async function googleSignOut() {
  if (Platform.OS === 'web' || isExpoGo || !configured) return;
  try {
    await load().GoogleSignin.signOut();
  } catch {
    // Google oturumu zaten kapalıysa sorun değil.
  }
}
