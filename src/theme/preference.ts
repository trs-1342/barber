import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

import { createStore } from '@/store/create-store';

export type ThemePreference = 'system' | 'light' | 'dark';

const KEY = 'barber.theme';
const [store, useStore] = createStore<ThemePreference>('system');

// Appearance.setColorScheme tüm uygulamayı (sekme çubuğu, başlıklar, sistem bileşenleri dahil) etkiler;
// useColorScheme kullanan her yer kendiliğinden yeni temaya geçer.
function apply(pref: ThemePreference) {
  Appearance.setColorScheme(pref === 'system' ? 'unspecified' : pref);
}

export const themePreference = {
  get: store.get,
  async set(pref: ThemePreference) {
    store.set(pref);
    apply(pref);
    try {
      await AsyncStorage.setItem(KEY, pref);
    } catch {
      // Kaydedilemezse yalnızca bu oturumda geçerli olur; kullanıcıyı engellemeye gerek yok.
    }
  },
  /** Açılışta bir kez çağrılır: kayıtlı tercihi yükler ve uygular. */
  async load() {
    try {
      const saved = await AsyncStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        store.set(saved);
        apply(saved);
      }
    } catch {
      // Depolama erişilemezse sistem teması kullanılır.
    }
  },
};

export const useThemePreference = useStore;
