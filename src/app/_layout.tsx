import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { initDataSource, useAppReady, useSession } from '@/store';
import { useColors, useIsDark } from '@/theme';

SplashScreen.preventAutoHideAsync();
// Kayıtlı veri kaynağını uygula ve oturumu dinlemeye başla (kalıcı oturum varsa giriş atlanır).
initDataSource();

export default function RootLayout() {
  const dark = useIsDark();
  const colors = useColors();
  const user = useSession();
  const ready = useAppReady();
  const base = dark ? DarkTheme : DefaultTheme;

  // İlk oturum durumu gelene kadar açılış ekranı kalır; giriş ekranı bir anlığına görünmez.
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          background: colors.bg,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          primary: colors.primary,
        },
      }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal', headerShadowVisible: false }}>
        {/* Oturum yoksa yalnızca giriş ekranlarına erişilir; korumalı rotalar otomatik yönlenir. */}
        <Stack.Protected guard={!user}>
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="order/[id]" options={{ title: 'Sipariş' }} />
          <Stack.Screen name="product/[id]" options={{ title: 'Ürün', presentation: 'modal' }} />
          <Stack.Screen name="promotion/new" options={{ title: 'Yeni kampanya', presentation: 'modal' }} />
          <Stack.Screen name="promotion/[id]" options={{ title: 'Kampanya' }} />
          <Stack.Screen name="reports" options={{ title: 'Satış Raporları' }} />
          <Stack.Screen name="settings" options={{ title: 'Ayarlar' }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
