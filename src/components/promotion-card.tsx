import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, Card, Icon, Text } from '@/components/ui';
import type { Promotion } from '@/data';
import { formatPrice } from '@/lib/format';
import { ctr, effectiveStatus, maxBudget, PLACEMENTS, progress, PROMO_STATUS, remainingDays, spent } from '@/lib/promotions';
import { spacing, useColors } from '@/theme';

const shortDate = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' });
export const formatRange = (p: Pick<Promotion, 'startsAt' | 'endsAt'>) =>
  `${shortDate.format(new Date(p.startsAt))} – ${shortDate.format(new Date(p.endsAt))}`;

export function ProgressBar({ value, tone = 'primary' }: { value: number; tone?: 'primary' | 'success' | 'warning' }) {
  const colors = useColors();
  return (
    <View
      style={[styles.track, { backgroundColor: colors.surfaceAlt }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}>
      <View style={{ width: `${Math.round(value * 100)}%`, height: '100%', backgroundColor: colors[tone] }} />
    </View>
  );
}

export const PromotionCard = memo(function PromotionCard({
  promotion: p,
  now,
  onPress,
}: {
  promotion: Promotion;
  now: number;
  onPress: (id: string) => void;
}) {
  const status = effectiveStatus(p, now);
  const s = PROMO_STATUS[status];
  const place = PLACEMENTS[p.placement];
  const used = spent(p, now);
  const cap = maxBudget(p);
  const left = remainingDays(p, now);

  return (
    <Card onPress={() => onPress(p.id)} style={styles.card} accessibilityLabel={`${p.productName}, ${place.label}, ${s.label}`}>
      <View style={styles.row}>
        <Icon name={place.icon} size={18} color="primary" />
        <Text variant="subheading" style={styles.flex} numberOfLines={1}>
          {p.productName}
        </Text>
        <Badge label={s.label} tone={s.tone} />
      </View>
      <Text variant="caption" color="textMuted">
        {place.label} · {formatRange(p)}
        {status !== 'ended' ? ` · ${left} gün kaldı` : ''}
      </Text>
      <View style={styles.metrics}>
        <Metric label="Gösterim" value={p.impressions.toLocaleString('tr-TR')} />
        <Metric label="Tıklama" value={p.clicks.toLocaleString('tr-TR')} />
        <Metric label="TO" value={`%${ctr(p).toLocaleString('tr-TR')}`} />
      </View>
      <View style={styles.gapXs}>
        <View style={styles.row}>
          <Text variant="label" color="textMuted" style={styles.flex}>
            Harcama
          </Text>
          <Text variant="label" tabular>
            {formatPrice(used)} / {formatPrice(cap)}
          </Text>
        </View>
        <ProgressBar value={used / cap} tone={status === 'active' ? 'primary' : 'warning'} />
      </View>
      {status === 'active' && <Text variant="label" color="textMuted">Zaman: %{Math.round(progress(p, now) * 100)}</Text>}
    </Card>
  );
});

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.flex}>
      <Text variant="label" color="textMuted">
        {label}
      </Text>
      <Text variant="subheading" tabular numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metrics: { flexDirection: 'row', gap: spacing.md },
  gapXs: { gap: spacing.xs },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
});
