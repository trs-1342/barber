import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useCallback, useDeferredValue, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ShopCard } from '@/components/shop-card';
import { Chip, EmptyState, ErrorState, Input, Screen, Skeleton, Text } from '@/components/ui';
import { repo } from '@/data';
import { CATEGORIES } from '@/data/categories';
import { useQuery } from '@/hooks/use-query';
import { spacing, useColors } from '@/theme';

export default function DiscoverScreen() {
  const colors = useColors();
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string>();
  // Yazarken her tuşta filtrelemeyi ertele; giriş akıcı kalır.
  const deferredQuery = useDeferredValue(query);

  const { data, error, loading, refreshing, refetch } = useQuery(
    (signal) => repo.listShops({ query: deferredQuery, tag }, signal),
    [deferredQuery, tag],
  );

  const openShop = useCallback((id: string) => router.push({ pathname: '/shop/[id]', params: { id } }), []);

  const header = (
    <View style={styles.header}>
      <Text variant="title">Keşfet</Text>
      <Input
        icon="search"
        placeholder="İşletme veya semt ara"
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Tümü" selected={!tag} onPress={() => setTag(undefined)} />
        {CATEGORIES.map((t) => (
          <Chip key={t} label={t} selected={tag === t} onPress={() => setTag(t === tag ? undefined : t)} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Screen scroll={false}>
      <FlashList
        data={loading && !data ? [] : (data ?? [])}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => <ShopCard shop={item} onPress={openShop} />}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={header}
        ListEmptyComponent={
          loading ? (
            <View style={styles.gap}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height={88} rounded={16} />
              ))}
            </View>
          ) : error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : (
            <EmptyState icon="cut-outline" title="Sonuç yok" message="Farklı bir arama deneyin." />
          )
        }
        contentContainerStyle={styles.list}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshing={refreshing}
        onRefresh={refetch}
        style={{ backgroundColor: colors.bg }}
      />
    </Screen>
  );
}

const Separator = () => <View style={{ height: spacing.md }} />;

const styles = StyleSheet.create({
  header: { gap: spacing.md, marginBottom: spacing.lg },
  chips: { gap: spacing.sm },
  list: { padding: spacing.lg },
  gap: { gap: spacing.md },
});
