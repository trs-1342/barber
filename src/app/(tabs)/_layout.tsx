import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { orders } from '@/store';
import { useColors } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName, active: IconName) {
  return function TabIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
    return <Ionicons name={focused ? active : name} size={size} color={color} />;
  };
}

export default function TabsLayout() {
  const colors = useColors();
  const pending = orders.useList().items.filter((o) => o.status === 'new').length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Panel', tabBarIcon: tabIcon('grid-outline', 'grid') }} />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Siparişler',
          tabBarIcon: tabIcon('cube-outline', 'cube'),
          tabBarBadge: pending > 0 ? pending : undefined,
        }}
      />
      <Tabs.Screen name="products" options={{ title: 'Ürünler', tabBarIcon: tabIcon('pricetags-outline', 'pricetags') }} />
      <Tabs.Screen name="promotions" options={{ title: 'Reklam', tabBarIcon: tabIcon('megaphone-outline', 'megaphone') }} />
      <Tabs.Screen name="account" options={{ title: 'Hesap', tabBarIcon: tabIcon('person-circle-outline', 'person-circle') }} />
    </Tabs>
  );
}
