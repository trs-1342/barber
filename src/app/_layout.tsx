import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useSession } from '@/store';
import { useColors, useIsDark } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const dark = useIsDark();
  const colors = useColors();
  const user = useSession();
  const base = dark ? DarkTheme : DefaultTheme;

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

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
