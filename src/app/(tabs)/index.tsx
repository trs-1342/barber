import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { BarChart, OrderRow, SectionTitle, StatCard } from '@/components/supplier';
import { Button, Card, ErrorState, Icon, Screen, Skeleton, Text } from '@/components/ui';
import { formatDay, formatPrice } from '@/lib/format';
import { revenueByDay, summarize } from '@/lib/orders';
import { orders, products, useSession } from '@/store';
import { spacing } from '@/theme';

const LOW_STOCK = 15;

export default function DashboardScreen() {
  const user = useSession();
  const o = orders.useList();
  const p = products.useList();

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todays = o.items.filter((x) => Date.parse(x.createdAt) >= today.getTime());
    return { all: summarize(o.items), today: summarize(todays), week: revenueByDay(o.items, 7) };
  }, [o.items]);

  const lowStock = useMemo(() => p.items.filter((x) => x.active && x.stock <= LOW_STOCK), [p.items]);
  const latest = o.items.slice(0, 4);
  const openOrder = useCallback((id: string) => router.push({ pathname: '/order/[id]', params: { id } }), []);

  if (o.error) return <ErrorState error={o.error} onRetry={orders.load} />;

  return (
    <Screen refreshing={o.loading && o.loaded} onRefresh={() => Promise.all([orders.load(), products.load()])}>
      <View>
        <Text color="textMuted">Hoş geldiniz</Text>
        <Text variant="title" numberOfLines={1}>
          {user?.companyName}
        </Text>
      </View>

      {!o.loaded ? (
        <View style={styles.grid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.skel}>
              <Skeleton height={96} rounded={16} />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.grid}>
          <StatCard icon="cash-outline" label="Bugünkü satış" value={formatPrice(stats.today.revenue)} hint={`${stats.today.orderCount} sipariş`} />
          <StatCard
            icon="time-outline"
            label="Onay bekleyen"
            value={String(stats.all.pending)}
            hint="Dokun ve yönet"
            tone="warning"
            onPress={() => router.navigate('/orders')}
          />
          <StatCard icon="storefront-outline" label="Aktif salon" value={String(stats.all.salonCount)} tone="success" />
          <StatCard icon="basket-outline" label="Ort. sepet" value={formatPrice(stats.all.avgBasket)} />
        </View>
      )}

      <Card style={styles.gap}>
        <SectionTitle
          title="Son 7 gün"
          action={
            <Text variant="subheading" tabular>
              {formatPrice(stats.week.reduce((s, d) => s + d.total, 0))}
            </Text>
          }
        />
        <BarChart
          data={stats.week.map((d) => ({
            label: formatDay(d.day),
            value: d.total,
            a11y: `${formatDay(d.day)}: ${formatPrice(d.total)}`,
          }))}
        />
      </Card>

      {lowStock.length > 0 && (
        <Card style={styles.gap} onPress={() => router.navigate('/products')}>
          <View style={styles.row}>
            <Icon name="warning-outline" color="danger" />
            <Text variant="subheading" style={styles.flex}>
              {lowStock.length} üründe stok azaldı
            </Text>
            <Icon name="chevron-forward" color="textMuted" />
          </View>
          <Text color="textMuted" numberOfLines={2}>
            {lowStock.map((x) => `${x.name} (${x.stock})`).join(', ')}
          </Text>
        </Card>
      )}

      <SectionTitle
        title="Son siparişler"
        action={<Button title="Tümü" variant="ghost" onPress={() => router.navigate('/orders')} style={styles.small} />}
      />
      {latest.map((x) => (
        <OrderRow key={x.id} order={x} onPress={openOrder} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  skel: { flex: 1, minWidth: '45%' },
  gap: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  small: { minHeight: 36, paddingHorizontal: spacing.md },
});
