/**
 * Ortam değişkenleri. Expo yalnızca EXPO_PUBLIC_ önekli değişkenleri uygulamaya gömer
 * ve onları yalnızca `process.env.X` biçiminde doğrudan yazıldığında tanır.
 * Bu değerler istemciye gider: buraya asla gizli anahtar (service role vb.) konmaz.
 */
export type DataSource = 'mock' | 'firebase' | 'supabase';

const source = (process.env.EXPO_PUBLIC_DATA_SOURCE ?? 'mock') as DataSource;

export const env = {
  dataSource: (['mock', 'firebase', 'supabase'] as const).includes(source) ? source : 'mock',
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  },
  /** Firebase > Authentication > Google sağlayıcısı > Web SDK yapılandırması > Web istemci kimliği. */
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
} as const;
