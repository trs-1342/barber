import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { memo, useCallback, useDeferredValue, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, Chip, EmptyState, ErrorState, Input, Screen, Skeleton, Text } from '@/components/ui';
import { repo, type Product } from '@/data';
import { products as sampleProducts } from '@/data/seed';
import { formatPrice } from '@/lib/format';
import { products } from '@/store';
import { spacing } from '@/theme';

const norm = (s: string) => s.toLocaleLowerCase('tr-TR');
type Filter = 'all' | 'low' | 'passive' | 'featured';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'low', label: 'Stok az' },
  { key: 'featured', label: 'Öne çıkan' },
  { key: 'passive', label: 'Pasif' },
];
const LOW = 15;

export default function ProductsScreen() {
  const { items, loading, loaded, error } = products.useList();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const q = norm(useDeferredValue(query).trim());

  const list = useMemo(
    () =>
      items.filter((p) => {
        if (q && !norm(p.name).includes(q) && !norm(p.brand).includes(q)) return false;
        if (filter === 'low') return p.active && p.stock <= LOW;
        if (filter === 'passive') return !p.active;
        if (filter === 'featured') return p.featured;
        return true;
      }),
    [items, q, filter],
  );

  const [seeding, setSeeding] = useState(false);
  // Yeni (gerçek) hesapta liste boş başlar; örnek ürünler stoklu ve stoksuz durumları birlikte gösterir.
  async function addSamples() {
    setSeeding(true);
    try {
      for (const { id: _id, ...p } of sampleProducts) products.upsert(await repo.saveProduct(p));
    } catch (e) {
      Alert.alert('Örnek ürünler eklenemedi', (e as Error).message);
    } finally {
      setSeeding(false);
    }
  }

  const open = useCallback((id: string) => router.push({ pathname: '/product/[id]', params: { id } }), []);

  return (
    <Screen scroll={false}>
      <FlashList
        data={list}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <ProductRow product={item} onPress={open} />}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.list}
        keyboardDismissMode="on-drag"
        refreshing={loading && loaded}
        onRefresh={products.load}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.row}>
              <Text variant="title" style={styles.flex}>
                Ürünler
              </Text>
              <Button title="Yeni" icon="add" onPress={() => open('new')} style={styles.small} />
            </View>
            <Input icon="search" placeholder="Ürün veya marka ara" value={query} onChangeText={setQuery} autoCorrect={false} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {FILTERS.map((f) => (
                <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          !loaded ? (
            <View style={styles.gap}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height={80} rounded={16} />
              ))}
            </View>
          ) : error ? (
            <ErrorState error={error} onRetry={products.load} />
          ) : (
            <View style={styles.gap}>
              <EmptyState icon="pricetags-outline" title="Ürün bulunamadı" actionTitle="Ürün ekle" onAction={() => open('new')} />
              {items.length === 0 && (
                <Button title="Örnek ürünleri ekle" icon="sparkles-outline" variant="ghost" onPress={addSamples} loading={seeding} />
              )}
            </View>
          )
        }
      />
    </Screen>
  );
}

const ProductRow = memo(function ProductRow({ product: p, onPress }: { product: Product; onPress: (id: string) => void }) {
  const stockTone = p.stock === 0 ? 'danger' : p.stock <= LOW ? 'warning' : 'success';
  return (
    <Card onPress={() => onPress(p.id)} style={[styles.gapSm, !p.active && styles.dim]} accessibilityLabel={`${p.name}, stok ${p.stock}`}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text variant="subheading" numberOfLines={2}>
            {p.name}
          </Text>
          <Text variant="caption" color="textMuted">
            {p.brand} · {p.category}
          </Text>
        </View>
        <Text variant="subheading" tabular>
          {formatPrice(p.price)}
        </Text>
      </View>
      <View style={styles.row}>
        <Badge label={p.stock === 0 ? 'Stok yok' : `Stok: ${p.stock} ${p.unit}`} tone={stockTone} />
        {p.featured && <Badge label="Öne çıkan" />}
        {!p.active && <Badge label="Pasif" tone="textMuted" />}
      </View>
    </Card>
  );
});

const Separator = () => <View style={{ height: spacing.md }} />;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.lg },
  header: { gap: spacing.md, marginBottom: spacing.lg },
  chips: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  gap: { gap: spacing.md },
  gapSm: { gap: spacing.sm },
  dim: { opacity: 0.6 },
  small: { minHeight: 40, paddingHorizontal: spacing.lg },
});
