import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { SectionTitle } from '@/components/supplier';
import { Badge, Button, Card, Chip, EmptyState, Input, Screen, Skeleton, Text } from '@/components/ui';
import { repo, type Promotion } from '@/data';
import { formatPrice } from '@/lib/format';
import { products, promotions } from '@/store';
import { spacing } from '@/theme';

const PLACEMENT: Record<Promotion['placement'], string> = {
  featured: 'Vitrin',
  banner: 'Ana sayfa banner',
  search: 'Arama üst sıra',
};
const STATUS = {
  active: { label: 'Yayında', tone: 'success' },
  paused: { label: 'Duraklatıldı', tone: 'warning' },
  ended: { label: 'Bitti', tone: 'textMuted' },
} as const;
const shortDate = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' });
const DURATIONS = [7, 14, 30];

export default function PromotionsScreen() {
  const promo = promotions.useList();
  const prod = products.useList();
  const [productId, setProductId] = useState<string>();
  const [placement, setPlacement] = useState<Promotion['placement']>('featured');
  const [budget, setBudget] = useState('100');
  const [duration, setDuration] = useState(7);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string>();

  const daily = Number(budget.replace(',', '.'));
  const budgetError = budget && (!Number.isFinite(daily) || daily < 50) ? 'En az 50 ₺/gün' : undefined;
  const selectable = prod.items.filter((p) => p.active);

  async function create() {
    const p = prod.items.find((x) => x.id === productId);
    if (!p || budgetError || !daily) return;
    setSaving(true);
    try {
      const start = new Date();
      const created = await repo.createPromotion({
        productId: p.id,
        productName: p.name,
        placement,
        dailyBudget: daily,
        startsAt: start.toISOString(),
        endsAt: new Date(start.getTime() + duration * 86_400_000).toISOString(),
      });
      promotions.upsert(created);
      setProductId(undefined);
    } catch (e) {
      Alert.alert('Kampanya oluşturulamadı', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(p: Promotion) {
    const next = p.status === 'active' ? 'paused' : 'active';
    setBusyId(p.id);
    try {
      await repo.setPromotionStatus(p.id, next);
      promotions.upsert({ ...p, status: next });
    } catch (e) {
      Alert.alert('İşlem yapılamadı', (e as Error).message);
    } finally {
      setBusyId(undefined);
    }
  }

  return (
    <Screen edges={[]}>
      <Card style={styles.gap}>
        <SectionTitle title="Yeni kampanya" />
        <Text variant="label" color="textMuted">
          ÜRÜN
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {selectable.map((p) => (
            <Chip key={p.id} label={p.name} selected={productId === p.id} onPress={() => setProductId(p.id)} />
          ))}
        </ScrollView>
        <Text variant="label" color="textMuted">
          YERLEŞİM
        </Text>
        <View style={styles.wrap}>
          {(Object.keys(PLACEMENT) as Promotion['placement'][]).map((k) => (
            <Chip key={k} label={PLACEMENT[k]} selected={placement === k} onPress={() => setPlacement(k)} />
          ))}
        </View>
        <Text variant="label" color="textMuted">
          SÜRE
        </Text>
        <View style={styles.wrap}>
          {DURATIONS.map((d) => (
            <Chip key={d} label={`${d} gün`} selected={duration === d} onPress={() => setDuration(d)} />
          ))}
        </View>
        <Input label="Günlük bütçe (₺)" value={budget} onChangeText={setBudget} keyboardType="decimal-pad" error={budgetError} />
        {!budgetError && daily > 0 && (
          <Text color="textMuted" tabular>
            Toplam en fazla {formatPrice(daily * duration)}
          </Text>
        )}
        <Button title="Kampanyayı başlat" icon="megaphone-outline" onPress={create} loading={saving} disabled={!productId || !!budgetError || !daily} haptic />
      </Card>

      <SectionTitle title="Kampanyalarım" />
      {!promo.loaded ? (
        <Skeleton height={120} rounded={16} />
      ) : promo.items.length === 0 ? (
        <EmptyState icon="megaphone-outline" title="Henüz kampanya yok" message="Ürünlerinizi öne çıkararak daha çok salona ulaşın." />
      ) : (
        promo.items.map((p) => {
          const s = STATUS[p.status];
          const ctr = p.impressions ? ((p.clicks / p.impressions) * 100).toFixed(1) : '0';
          return (
            <Card key={p.id} style={styles.gapSm}>
              <View style={styles.row}>
                <Text variant="subheading" style={styles.flex} numberOfLines={1}>
                  {p.productName}
                </Text>
                <Badge label={s.label} tone={s.tone} />
              </View>
              <Text variant="caption" color="textMuted">
                {PLACEMENT[p.placement]} · {formatPrice(p.dailyBudget)}/gün · {shortDate.format(new Date(p.startsAt))} – {shortDate.format(new Date(p.endsAt))}
              </Text>
              <View style={styles.metrics}>
                <Metric label="Gösterim" value={p.impressions.toLocaleString('tr-TR')} />
                <Metric label="Tıklama" value={p.clicks.toLocaleString('tr-TR')} />
                <Metric label="TO" value={`%${ctr}`} />
              </View>
              {p.status !== 'ended' && (
                <Button
                  title={p.status === 'active' ? 'Duraklat' : 'Devam ettir'}
                  variant="ghost"
                  onPress={() => toggle(p)}
                  loading={busyId === p.id}
                />
              )}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.flex}>
      <Text variant="label" color="textMuted">
        {label}
      </Text>
      <Text variant="subheading" tabular>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: spacing.md },
  gapSm: { gap: spacing.sm },
  chips: { gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metrics: { flexDirection: 'row', gap: spacing.md },
});
