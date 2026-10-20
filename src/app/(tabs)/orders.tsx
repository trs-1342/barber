import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { OrderRow } from '@/components/supplier';
import { Chip, EmptyState, ErrorState, Input, Screen, Skeleton, Text } from '@/components/ui';
import type { OrderStatus } from '@/data';
import { ORDER_STATUS } from '@/lib/orders';
import { orders } from '@/store';
import { spacing } from '@/theme';

const FILTERS: (OrderStatus | 'all')[] = ['all', 'new', 'preparing', 'shipped', 'delivered', 'cancelled'];
const norm = (s: string) => s.toLocaleLowerCase('tr-TR');

export default function OrdersScreen() {
  const { items, loading, loaded, error } = orders.useList();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const q = norm(useDeferredValue(query).trim());

  const counts = useMemo(() => {
    const c: Partial<Record<OrderStatus, number>> = {};
    for (const o of items) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [items]);

  const list = useMemo(
    () =>
      items.filter(
        (o) =>
          (filter === 'all' || o.status === filter) &&
          (!q || norm(o.salonName).includes(q) || norm(o.code).includes(q)),
      ),
    [items, filter, q],
  );

  const open = useCallback((id: string) => router.push({ pathname: '/order/[id]', params: { id } }), []);

  return (
    <Screen scroll={false}>
      <FlashList
        data={list}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => <OrderRow order={item} onPress={open} />}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.list}
        keyboardDismissMode="on-drag"
        refreshing={loading && loaded}
        onRefresh={orders.load}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="title">Salon Siparişleri</Text>
            <Input icon="search" placeholder="Salon adı veya sipariş no" value={query} onChangeText={setQuery} autoCorrect={false} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {FILTERS.map((f) => (
                <Chip
                  key={f}
                  label={f === 'all' ? `Tümü (${items.length})` : `${ORDER_STATUS[f].label} (${counts[f] ?? 0})`}
                  selected={filter === f}
                  onPress={() => setFilter(f)}
                />
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          !loaded ? (
            <View style={styles.gap}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height={92} rounded={16} />
              ))}
            </View>
          ) : error ? (
            <ErrorState error={error} onRetry={orders.load} />
          ) : (
            <EmptyState icon="file-tray-outline" title="Sipariş yok" message="Bu filtreye uyan sipariş bulunamadı." />
          )
        }
      />
    </Screen>
  );
}

const Separator = () => <View style={{ height: spacing.md }} />;

const styles = StyleSheet.create({
  list: { padding: spacing.lg },
  header: { gap: spacing.md, marginBottom: spacing.lg },
  chips: { gap: spacing.sm },
  gap: { gap: spacing.md },
});
