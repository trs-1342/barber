import { NativeTabs } from 'expo-router/native-tabs';

import { orders } from '@/store';
import { useColors } from '@/theme';

export default function TabsLayout() {
  const colors = useColors();
  const pending = orders.useList().items.filter((o) => o.status === 'new').length;

  return (
    <NativeTabs
      backgroundColor={colors.surface}
      indicatorColor={colors.surfaceAlt}
      iconColor={{ default: colors.textMuted, selected: colors.primary }}
      labelStyle={{ default: { color: colors.textMuted }, selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Panel</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.grid.2x2" md="dashboard" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="orders">
        <NativeTabs.Trigger.Label>Siparişler</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="shippingbox" md="local_shipping" />
        {pending > 0 && <NativeTabs.Trigger.Badge>{String(pending)}</NativeTabs.Trigger.Badge>}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="products">
        <NativeTabs.Trigger.Label>Ürünler</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="tag" md="inventory_2" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="reports">
        <NativeTabs.Trigger.Label>Raporlar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar" md="bar_chart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Label>Hesap</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
