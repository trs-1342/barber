import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BarChart, SectionTitle, StatCard } from '@/components/supplier';
import { Card, Chip, ErrorState, Screen, Skeleton, Text } from '@/components/ui';
import { formatPrice } from '@/lib/format';
import { isRevenue, revenueByDay, summarize, topProducts } from '@/lib/orders';
import { orders } from '@/store';
import { spacing, useColors } from '@/theme';

const RANGES = [7, 30] as const;
const shortDate = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' });

export default function ReportsScreen() {
  const colors = useColors();
  const { items, loaded, loading, error } = orders.useList();
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);

  const r = useMemo(() => {
    const buckets = revenueByDay(items, days);
    const from = buckets[0]!.day.getTime();
    const inRange = items.filter((o) => Date.parse(o.createdAt) >= from);
    // Bir önceki eşit dönemle karşılaştırma.
    const prevFrom = from - days * 86_400_000;
    const prev = items.filter((o) => {
      const t = Date.parse(o.createdAt);
      return t >= prevFrom && t < from;
    });
    const cur = summarize(inRange);
    const before = summarize(prev);
    const change = before.revenue ? Math.round(((cur.revenue - before.revenue) / before.revenue) * 100) : null;

    const bySalon = new Map<string, number>();
    for (const o of inRange.filter(isRevenue)) bySalon.set(o.salonName, (bySalon.get(o.salonName) ?? 0) + o.total);

    return {
      buckets,
      cur,
      change,
      cancelled: inRange.filter((o) => o.status === 'cancelled').length,
      top: topProducts(inRange, 5),
      salons: [...bySalon.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [items, days]);

  if (error) return <ErrorState error={error} onRetry={orders.load} />;

  const maxTop = Math.max(1, ...r.top.map((t) => t.revenue));

  return (
    <Screen edges={[]} refreshing={loading && loaded} onRefresh={orders.load}>
      <View style={styles.row}>
        {RANGES.map((d) => (
          <Chip key={d} label={`Son ${d} gün`} selected={days === d} onPress={() => setDays(d)} />
        ))}
      </View>

      {!loaded ? (
        <Skeleton height={220} rounded={16} />
      ) : (
        <>
          <View style={styles.grid}>
            <StatCard
              icon="trending-up-outline"
              label="Ciro"
              value={formatPrice(r.cur.revenue)}
              hint={r.change === null ? 'Önceki dönem verisi yok' : `${r.change >= 0 ? '▲' : '▼'} %${Math.abs(r.change)} önceki döneme göre`}
              tone={r.change !== null && r.change < 0 ? 'danger' : 'success'}
            />
            <StatCard icon="receipt-outline" label="Sipariş" value={String(r.cur.orderCount)} hint={`${r.cancelled} iptal`} />
            <StatCard icon="basket-outline" label="Ort. sepet" value={formatPrice(r.cur.avgBasket)} />
            <StatCard icon="storefront-outline" label="Alıcı salon" value={String(r.cur.salonCount)} tone="success" />
          </View>

          <Card style={styles.gap}>
            <SectionTitle title="Günlük ciro" />
            <BarChart
              data={r.buckets.map((b) => ({
                label: shortDate.format(b.day),
                value: b.total,
                a11y: `${shortDate.format(b.day)}: ${formatPrice(b.total)}, ${b.count} sipariş`,
              }))}
            />
          </Card>

          <Card style={styles.gap}>
            <SectionTitle title="En çok satan ürünler" />
            {r.top.length === 0 && <Text color="textMuted">Bu dönemde satış yok.</Text>}
            {r.top.map((t, i) => (
              <View key={t.productId} style={styles.gapXs}>
                <View style={styles.row}>
                  <Text variant="subheading" color="textMuted" tabular>
                    {i + 1}
                  </Text>
                  <Text style={styles.flex} numberOfLines={1}>
                    {t.name}
                  </Text>
                  <Text variant="subheading" tabular>
                    {formatPrice(t.revenue)}
                  </Text>
                </View>
                <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
                  <View style={{ width: `${(t.revenue / maxTop) * 100}%`, height: '100%', borderRadius: 3, backgroundColor: colors.primary }} />
                </View>
                <Text variant="label" color="textMuted" tabular>
                  {t.qty} adet
                </Text>
              </View>
            ))}
          </Card>

          <Card style={styles.gap}>
            <SectionTitle title="En çok alan salonlar" />
            {r.salons.map(([name, total]) => (
              <View key={name} style={styles.row}>
                <Text style={styles.flex} numberOfLines={1}>
                  {name}
                </Text>
                <Text variant="subheading" tabular>
                  {formatPrice(total)}
                </Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gap: { gap: spacing.md },
  gapXs: { gap: spacing.xs },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
});
