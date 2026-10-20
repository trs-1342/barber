import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar, Badge, Button, Card, ErrorState, Icon, Screen, Skeleton, Text } from '@/components/ui';
import { repo } from '@/data';
import { useQuery } from '@/hooks/use-query';
import { formatDuration, formatPrice } from '@/lib/format';
import { spacing } from '@/theme';

export default function ShopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: shop, error, loading, refetch } = useQuery((signal) => repo.getShop(id, signal), [id]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const chosen = shop?.services.filter((s) => selected.has(s.id)) ?? [];
  const total = chosen.reduce((sum, s) => sum + s.price, 0);
  const duration = chosen.reduce((sum, s) => sum + s.durationMin, 0);

  const toggle = (sid: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });

  return (
    <Screen
      edges={[]}
      footer={
        <View style={styles.footer}>
          <View style={styles.flex}>
            <Text variant="caption" color="textMuted">
              {chosen.length ? `${chosen.length} hizmet · ${formatDuration(duration)}` : 'Hizmet seçin'}
            </Text>
            <Text variant="heading" tabular>
              {formatPrice(total)}
            </Text>
          </View>
          <Button
            title="Devam"
            disabled={!chosen.length}
            onPress={() =>
              router.push({
                pathname: '/booking/[shopId]',
                params: { shopId: id, services: [...selected].join(',') },
              })
            }
          />
        </View>
      }>
      <Stack.Screen options={{ title: shop?.name ?? '' }} />
      {loading || !shop ? (
        <View style={styles.gap}>
          <Skeleton height={28} width="60%" />
          <Skeleton height={16} width="80%" />
          <Skeleton height={64} />
          <Skeleton height={64} />
        </View>
      ) : (
        <>
          <View style={styles.gap}>
            <Text variant="title">{shop.name}</Text>
            <View style={styles.row}>
              <Icon name="star" size={16} color="primary" />
              <Text tabular>
                {shop.rating.toFixed(1)} · {shop.reviewCount} değerlendirme
              </Text>
            </View>
            <View style={styles.row}>
              <Icon name="location-outline" size={16} color="textMuted" />
              <Text color="textMuted" style={styles.flex}>
                {shop.address}
              </Text>
            </View>
            <View style={styles.row}>
              <Icon name="time-outline" size={16} color="textMuted" />
              <Text color="textMuted" tabular>
                {String(shop.opensAt).padStart(2, '0')}:00 – {shop.closesAt}:00
              </Text>
            </View>
          </View>

          <Text variant="heading">Hizmetler</Text>
          {shop.services.map((s) => {
            const on = selected.has(s.id);
            return (
              <Card key={s.id} selected={on} onPress={() => toggle(s.id)}>
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Text variant="subheading">{s.name}</Text>
                    <Text variant="caption" color="textMuted">
                      {formatDuration(s.durationMin)}
                    </Text>
                  </View>
                  <Text variant="subheading" tabular>
                    {formatPrice(s.price)}
                  </Text>
                  <Icon
                    name={on ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={on ? 'primary' : 'textMuted'}
                  />
                </View>
              </Card>
            );
          })}

          <Text variant="heading">Personel</Text>
          <View style={styles.staff}>
            {shop.staff.map((p) => (
              <View key={p.id} style={styles.person}>
                <Avatar name={p.name} uri={p.avatar} size={56} />
                <Text variant="caption" center numberOfLines={1}>
                  {p.name.split(' ')[0]}
                </Text>
                <Badge label={`★ ${p.rating.toFixed(1)}`} />
              </View>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  staff: { flexDirection: 'row', gap: spacing.lg },
  person: { alignItems: 'center', gap: spacing.xs, width: 72 },
});
