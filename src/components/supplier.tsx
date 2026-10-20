import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, Card, Icon, Text, type IconName } from '@/components/ui';
import type { Order } from '@/data';
import { formatPrice } from '@/lib/format';
import { ORDER_STATUS } from '@/lib/orders';
import { radius, spacing, useColors, type ColorName } from '@/theme';

export function StatCard({
  icon,
  label,
  value,
  hint,
  tone = 'primary',
  onPress,
}: {
  icon: IconName;
  label: string;
  value: string;
  hint?: string;
  tone?: ColorName;
  onPress?: () => void;
}) {
  const colors = useColors();
  return (
    <Card style={styles.stat} onPress={onPress} accessibilityLabel={`${label}: ${value}`}>
      <View style={[styles.statIcon, { backgroundColor: colors[tone] + '22' }]}>
        <Icon name={icon} size={18} color={tone} />
      </View>
      <Text variant="caption" color="textMuted" numberOfLines={1}>
        {label}
      </Text>
      <Text variant="heading" tabular numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {hint && (
        <Text variant="label" color="textMuted" numberOfLines={1}>
          {hint}
        </Text>
      )}
    </Card>
  );
}

/** Bağımlılıksız çubuk grafik; erişilebilirlik için her çubuğun değeri okunur. */
export function BarChart({
  data,
  height = 140,
  highlightLast = true,
}: {
  data: { label: string; value: number; a11y: string }[];
  height?: number;
  highlightLast?: boolean;
}) {
  const colors = useColors();
  const max = Math.max(1, ...data.map((d) => d.value));
  const showEvery = Math.ceil(data.length / 7);

  return (
    <View>
      <View style={[styles.chart, { height }]}>
        {data.map((d, i) => (
          <View key={i} style={styles.barCol} accessible accessibilityLabel={d.a11y}>
            <View
              style={{
                height: Math.max(2, (d.value / max) * height),
                borderRadius: 4,
                backgroundColor:
                  highlightLast && i === data.length - 1 ? colors.primary : colors.primary + '66',
              }}
            />
          </View>
        ))}
      </View>
      <View style={styles.axis}>
        {data.map((d, i) => (
          <Text key={i} variant="label" color="textMuted" style={styles.axisLabel} numberOfLines={1}>
            {i % showEvery === 0 || i === data.length - 1 ? d.label : ''}
          </Text>
        ))}
      </View>
    </View>
  );
}

const rel = new Intl.RelativeTimeFormat('tr-TR', { numeric: 'auto' });
export function timeAgo(iso: string, now = Date.now()) {
  const min = Math.round((Date.parse(iso) - now) / 60_000);
  if (Math.abs(min) < 60) return rel.format(min, 'minute');
  const h = Math.round(min / 60);
  if (Math.abs(h) < 24) return rel.format(h, 'hour');
  return rel.format(Math.round(h / 24), 'day');
}

export const OrderRow = memo(function OrderRow({
  order,
  onPress,
}: {
  order: Order;
  onPress: (id: string) => void;
}) {
  const s = ORDER_STATUS[order.status];
  const qty = order.items.reduce((n, it) => n + it.qty, 0);
  return (
    <Card onPress={() => onPress(order.id)} style={styles.order} accessibilityLabel={`${order.code}, ${order.salonName}, ${s.label}`}>
      <View style={styles.row}>
        <Text variant="subheading" style={styles.flex} numberOfLines={1}>
          {order.salonName}
        </Text>
        <Badge label={s.label} tone={s.tone} />
      </View>
      <View style={styles.row}>
        <Text variant="caption" color="textMuted" style={styles.flex} numberOfLines={1}>
          {order.code} · {order.salonDistrict} · {qty} ürün
        </Text>
        <Text variant="caption" color="textMuted">
          {timeAgo(order.createdAt)}
        </Text>
      </View>
      <Text variant="subheading" tabular>
        {formatPrice(order.total)}
      </Text>
    </Card>
  );
});

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text variant="heading" style={styles.flex}>
        {title}
      </Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stat: { flex: 1, gap: 2, minWidth: '45%' },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  barCol: { flex: 1, justifyContent: 'flex-end' },
  axis: { flexDirection: 'row', gap: 3, marginTop: spacing.xs },
  axisLabel: { flex: 1, textAlign: 'center', fontSize: 10 },
  order: { gap: spacing.xs },
});
