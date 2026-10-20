import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { formatRange, Metric, ProgressBar } from '@/components/promotion-card';
import { Badge, Button, Card, EmptyState, Icon, Screen, Text } from '@/components/ui';
import { repo, type Promotion } from '@/data';
import { formatPrice } from '@/lib/format';
import {
  ctr,
  effectiveStatus,
  maxBudget,
  PLACEMENTS,
  progress,
  PROMO_STATUS,
  remainingDays,
  spent,
  totalDays,
} from '@/lib/promotions';
import { promotions } from '@/store';
import { spacing } from '@/theme';

export default function PromotionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = promotions.useList().items.find((x) => x.id === id);
  const [busy, setBusy] = useState<Promotion['status']>();
  const [now] = useState(() => Date.now());

  if (!p) return <EmptyState icon="alert-circle-outline" title="Kampanya bulunamadı" />;

  const status = effectiveStatus(p, now);
  const s = PROMO_STATUS[status];
  const place = PLACEMENTS[p.placement];
  const used = spent(p, now);
  const cap = maxBudget(p);
  const cpc = p.clicks ? used / p.clicks : 0;

  async function change(next: Promotion['status']) {
    setBusy(next);
    try {
      await repo.setPromotionStatus(p!.id, next);
      promotions.upsert({ ...p!, status: next, ...(next === 'ended' ? { endsAt: new Date().toISOString() } : {}) });
    } catch (e) {
      Alert.alert('İşlem yapılamadı', (e as Error).message);
      promotions.load();
    } finally {
      setBusy(undefined);
    }
  }

  const confirmEnd = () =>
    Alert.alert('Kampanyayı bitir', 'Kampanya hemen yayından kalkar ve tekrar başlatılamaz. Kalan bütçe harcanmaz.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Bitir', style: 'destructive', onPress: () => change('ended') },
    ]);

  return (
    <Screen
      edges={[]}
      footer={
        status !== 'ended' ? (
          <View style={styles.footer}>
            <Button title="Bitir" variant="ghost" onPress={confirmEnd} loading={busy === 'ended'} disabled={!!busy} />
            <Button
              title={status === 'active' ? 'Duraklat' : 'Devam ettir'}
              icon={status === 'active' ? 'pause' : 'play'}
              onPress={() => change(status === 'active' ? 'paused' : 'active')}
              loading={busy === 'paused' || busy === 'active'}
              disabled={!!busy}
              style={styles.flex}
              haptic
            />
          </View>
        ) : undefined
      }>
      <Stack.Screen options={{ title: place.label }} />

      <Card style={styles.gap}>
        <View style={styles.row}>
          <Icon name={place.icon} size={20} color="primary" />
          <Text variant="heading" style={styles.flex} numberOfLines={2}>
            {p.productName}
          </Text>
          <Badge label={s.label} tone={s.tone} />
        </View>
        <Text color="textMuted">
          {formatRange(p)} · {totalDays(p)} gün
          {status !== 'ended' ? ` · ${remainingDays(p, now)} gün kaldı` : ''}
        </Text>
        <ProgressBar value={progress(p, now)} tone={status === 'active' ? 'success' : 'warning'} />
      </Card>

      <Card style={styles.gap}>
        <Text variant="subheading">Performans</Text>
        <View style={styles.metrics}>
          <Metric label="Gösterim" value={p.impressions.toLocaleString('tr-TR')} />
          <Metric label="Tıklama" value={p.clicks.toLocaleString('tr-TR')} />
        </View>
        <View style={styles.metrics}>
          <Metric label="Tıklama oranı" value={`%${ctr(p).toLocaleString('tr-TR')}`} />
          <Metric label="Tıklama başı" value={cpc ? formatPrice(Math.round(cpc * 100) / 100) : '—'} />
        </View>
      </Card>

      <Card style={styles.gap}>
        <Text variant="subheading">Bütçe</Text>
        <View style={styles.row}>
          <Text color="textMuted" style={styles.flex}>
            Günlük
          </Text>
          <Text tabular>{formatPrice(p.dailyBudget)}</Text>
        </View>
        <View style={styles.row}>
          <Text color="textMuted" style={styles.flex}>
            Harcanan / tavan
          </Text>
          <Text tabular>
            {formatPrice(used)} / {formatPrice(cap)}
          </Text>
        </View>
        <ProgressBar value={used / cap} />
        <Text variant="caption" color="textMuted">
          Ücretlendirme gösterim başınadır; günlük bütçe aşılmaz. Duraklatılan günlerde harcama yapılmaz.
        </Text>
      </Card>

      {p.impressions === 0 && status === 'active' && (
        <Card style={styles.row}>
          <Icon name="time-outline" color="textMuted" />
          <Text color="textMuted" style={styles.flex}>
            Kampanya yayına alındı. İlk gösterimler genellikle birkaç dakika içinde gelir.
          </Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metrics: { flexDirection: 'row', gap: spacing.md },
  footer: { flexDirection: 'row', gap: spacing.md },
});
