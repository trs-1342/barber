import { FlashList } from '@shopify/flash-list';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PromotionCard } from '@/components/promotion-card';
import { StatCard } from '@/components/supplier';
import { Button, Chip, EmptyState, ErrorState, Screen, Skeleton, Text } from '@/components/ui';
import type { Promotion } from '@/data';
import { formatPct, formatPrice } from '@/lib/format';
import { effectiveStatus, summarizePromotions } from '@/lib/promotions';
import { promotions } from '@/store';
import { spacing } from '@/theme';

type Tab = Promotion['status'];
const TABS: { key: Tab; label: string }[] = [
  { key: 'active', label: 'Yayında' },
  { key: 'paused', label: 'Duraklatılan' },
  { key: 'ended', label: 'Biten' },
];

export default function PromotionsScreen() {
  const { items, loaded, loading, error } = promotions.useList();
  const [tab, setTab] = useState<Tab>('active');
  // "Şimdi" ekrana her dönüşte güncellenir; süresi dolan kampanya "Biten"e geçer.
  const [now, setNow] = useState(() => Date.now());
  useFocusEffect(useCallback(() => setNow(Date.now()), []));

  const { list, counts, summary } = useMemo(() => {
    const c: Record<Tab, number> = { active: 0, paused: 0, ended: 0 };
    for (const p of items) c[effectiveStatus(p, now)] += 1;
    return {
      counts: c,
      list: items
        .filter((p) => effectiveStatus(p, now) === tab)
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
      summary: summarizePromotions(items, now),
    };
  }, [items, tab, now]);

  const open = useCallback((id: string) => router.push({ pathname: '/promotion/[id]', params: { id } }), []);
  const create = () => router.push('/promotion/new');

  return (
    <Screen scroll={false}>
      <FlashList
        data={list}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PromotionCard promotion={item} now={now} onPress={open} />}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.list}
        refreshing={loading && loaded}
        onRefresh={promotions.load}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text variant="title">Reklam</Text>
                <Text color="textMuted">Ürünlerinizi salonlarda öne çıkarın</Text>
              </View>
              <Button title="Yeni" icon="add" onPress={create} style={styles.small} haptic />
            </View>
            {loaded && (
              <View style={styles.grid}>
                <StatCard icon="radio-outline" label="Yayında" value={String(summary.active)} tone="success" />
                <StatCard icon="wallet-outline" label="Toplam harcama" value={formatPrice(summary.spend)} />
                <StatCard icon="eye-outline" label="Gösterim" value={summary.impressions.toLocaleString('tr-TR')} />
                <StatCard
                  icon="hand-left-outline"
                  label="Tıklama oranı"
                  value={formatPct(summary.ctr)}
                  hint={`${summary.clicks.toLocaleString('tr-TR')} tıklama`}
                />
              </View>
            )}
            <View style={styles.row}>
              {TABS.map((t) => (
                <Chip key={t.key} label={`${t.label} (${counts[t.key]})`} selected={tab === t.key} onPress={() => setTab(t.key)} />
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          !loaded ? (
            <View style={styles.gap}>
              <Skeleton height={96} rounded={16} />
              <Skeleton height={160} rounded={16} />
            </View>
          ) : error ? (
            <ErrorState error={error} onRetry={promotions.load} />
          ) : (
            <EmptyState
              icon="megaphone-outline"
              title={tab === 'active' ? 'Yayında kampanya yok' : 'Burada kampanya yok'}
              message={tab === 'active' ? 'Bir ürününüzü öne çıkararak daha çok salona ulaşın.' : undefined}
              actionTitle={tab === 'active' ? 'Kampanya oluştur' : undefined}
              onAction={create}
            />
          )
        }
      />
    </Screen>
  );
}

const Separator = () => <View style={{ height: spacing.md }} />;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.lg },
  header: { gap: spacing.md, marginBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gap: { gap: spacing.md },
  small: { minHeight: 40, paddingHorizontal: spacing.lg },
});
