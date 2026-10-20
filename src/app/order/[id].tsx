import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { timeAgo } from '@/components/supplier';
import { Badge, Button, Card, EmptyState, Icon, Screen, Text } from '@/components/ui';
import { repo, type OrderStatus } from '@/data';
import { formatDate, formatPrice, formatTime } from '@/lib/format';
import { ACTION_LABEL, nextStatuses, ORDER_STATUS } from '@/lib/orders';
import { orders } from '@/store';
import { spacing, useColors } from '@/theme';

const STEPS: OrderStatus[] = ['new', 'preparing', 'shipped', 'delivered'];

export default function OrderDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = orders.useList().items.find((o) => o.id === id);
  const [busy, setBusy] = useState<OrderStatus>();

  if (!order) return <EmptyState icon="alert-circle-outline" title="Sipariş bulunamadı" />;

  const s = ORDER_STATUS[order.status];
  const created = new Date(order.createdAt);
  const stepIdx = STEPS.indexOf(order.status);

  async function change(to: OrderStatus) {
    setBusy(to);
    try {
      orders.upsert(await repo.updateOrderStatus(order!.id, to));
    } catch (e) {
      Alert.alert('İşlem yapılamadı', (e as Error).message);
      orders.load(); // sunucudaki güncel durumu getir
    } finally {
      setBusy(undefined);
    }
  }

  const confirmCancel = () =>
    Alert.alert('Siparişi iptal et', `${order.salonName} siparişi iptal edilsin mi? Salon bilgilendirilecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'İptal et', style: 'destructive', onPress: () => change('cancelled') },
    ]);

  const actions = nextStatuses(order.status);
  const forward = actions.find((a) => a !== 'cancelled');

  return (
    <Screen
      edges={[]}
      footer={
        actions.length > 0 ? (
          <View style={styles.footer}>
            {actions.includes('cancelled') && (
              <Button title="İptal et" variant="ghost" onPress={confirmCancel} loading={busy === 'cancelled'} disabled={!!busy} />
            )}
            {forward && (
              <Button
                title={ACTION_LABEL[forward]!}
                onPress={() => change(forward)}
                loading={busy === forward}
                disabled={!!busy}
                haptic
                style={styles.flex}
              />
            )}
          </View>
        ) : undefined
      }>
      <Stack.Screen options={{ title: order.code }} />

      <Card style={styles.gap}>
        <View style={styles.row}>
          <Text variant="heading" style={styles.flex}>
            {order.salonName}
          </Text>
          <Badge label={s.label} tone={s.tone} />
        </View>
        <View style={styles.row}>
          <Icon name="location-outline" size={16} color="textMuted" />
          <Text color="textMuted">{order.salonDistrict}</Text>
        </View>
        <View style={styles.row}>
          <Icon name="calendar-outline" size={16} color="textMuted" />
          <Text color="textMuted">
            {formatDate(created)} {formatTime(created)} · {timeAgo(order.createdAt)}
          </Text>
        </View>
      </Card>

      {order.status !== 'cancelled' && (
        <View style={styles.steps} accessibilityLabel={`Durum: ${s.label}`}>
          {STEPS.map((st, i) => {
            const done = i <= stepIdx;
            return (
              <View key={st} style={styles.step}>
                <View style={[styles.dot, { backgroundColor: done ? colors.primary : colors.border }]}>
                  {done && <Icon name="checkmark" size={12} color="primaryText" />}
                </View>
                <Text variant="label" color={done ? 'text' : 'textMuted'} center>
                  {ORDER_STATUS[st].label}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <Text variant="heading">Ürünler</Text>
      <Card padded={false}>
        {order.items.map((it, i) => (
          <View
            key={it.productId + i}
            style={[styles.line, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}>
            <View style={styles.flex}>
              <Text numberOfLines={2}>{it.name}</Text>
              <Text variant="caption" color="textMuted" tabular>
                {it.qty} × {formatPrice(it.unitPrice)}
              </Text>
            </View>
            <Text variant="subheading" tabular>
              {formatPrice(it.qty * it.unitPrice)}
            </Text>
          </View>
        ))}
        <View style={[styles.line, { borderTopWidth: 1, borderColor: colors.border }]}>
          <Text variant="subheading" style={styles.flex}>
            Toplam
          </Text>
          <Text variant="heading" tabular>
            {formatPrice(order.total)}
          </Text>
        </View>
      </Card>

      {order.note && (
        <Card style={styles.gap}>
          <Text variant="label" color="textMuted">
            SALON NOTU
          </Text>
          <Text>{order.note}</Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  footer: { flexDirection: 'row', gap: spacing.md },
  steps: { flexDirection: 'row', justifyContent: 'space-between' },
  step: { flex: 1, alignItems: 'center', gap: spacing.xs },
  dot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
});
