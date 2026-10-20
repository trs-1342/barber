import { router } from 'expo-router';
import { useDeferredValue, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, Chip, Icon, Input, Screen, Text } from '@/components/ui';
import { repo, type Product } from '@/data';
import { formatPrice } from '@/lib/format';
import { DURATIONS, estimateReach, PLACEMENTS, validateDraft, type Placement } from '@/lib/promotions';
import { products, promotions } from '@/store';
import { radius, spacing, useColors } from '@/theme';

const norm = (s: string) => s.toLocaleLowerCase('tr-TR');
const QUICK_BUDGETS = [100, 250, 500, 1000];
const DAY = 86_400_000;

export default function NewPromotionScreen() {
  const colors = useColors();
  const prod = products.useList();
  const promo = promotions.useList();

  const [productId, setProductId] = useState<string>();
  const [query, setQuery] = useState('');
  const [placement, setPlacement] = useState<Placement>('featured');
  const [duration, setDuration] = useState<number>(7);
  const [budget, setBudget] = useState('100');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const q = norm(useDeferredValue(query).trim());
  const daily = Number(budget.replace(/\./g, '').replace(',', '.'));
  const product = prod.items.find((p) => p.id === productId);

  // Satışta olmayan ürün reklam edilemez; stok azsa uyarılır.
  const candidates = useMemo(
    () => prod.items.filter((p) => p.active && (!q || norm(p.name).includes(q) || norm(p.brand).includes(q))),
    [prod.items, q],
  );
  const errors = validateDraft({ productId, placement, daily }, promo.items);
  const valid = Object.keys(errors).length === 0;
  const reach = valid ? estimateReach(placement, daily, duration) : null;

  async function submit() {
    setTouched(true);
    if (!valid || !product) return;
    setSaving(true);
    try {
      const start = new Date();
      const created = await repo.createPromotion({
        productId: product.id,
        productName: product.name,
        placement,
        dailyBudget: daily,
        startsAt: start.toISOString(),
        endsAt: new Date(start.getTime() + duration * DAY).toISOString(),
      });
      promotions.upsert(created);
      router.replace({ pathname: '/promotion/[id]', params: { id: created.id } });
    } catch (e) {
      Alert.alert('Kampanya oluşturulamadı', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen
      edges={[]}
      footer={
        <View style={styles.footer}>
          <View style={styles.flex}>
            <Text variant="caption" color="textMuted">
              {duration} gün · en fazla
            </Text>
            <Text variant="heading" tabular>
              {Number.isFinite(daily) && daily > 0 ? formatPrice(daily * duration) : '—'}
            </Text>
          </View>
          <Button title="Yayına al" icon="rocket-outline" onPress={submit} loading={saving} disabled={touched && !valid} haptic />
        </View>
      }>
      <Step n={1} title="Ürün seç" error={touched ? errors.product : undefined} />
      <Input icon="search" placeholder="Ürün ara" value={query} onChangeText={setQuery} autoCorrect={false} />
      <View style={styles.gapSm}>
        {candidates.slice(0, 6).map((p) => (
          <ProductOption key={p.id} product={p} selected={p.id === productId} onPress={() => setProductId(p.id)} />
        ))}
        {candidates.length === 0 && <Text color="textMuted">Satışta olan ürün bulunamadı.</Text>}
      </View>

      <Step n={2} title="Nerede görünsün?" />
      <View style={styles.gapSm}>
        {(Object.keys(PLACEMENTS) as Placement[]).map((k) => {
          const pl = PLACEMENTS[k];
          const on = placement === k;
          return (
            <Card key={k} selected={on} onPress={() => setPlacement(k)}>
              <View style={styles.row}>
                <View style={[styles.iconBox, { backgroundColor: on ? colors.primary : colors.surfaceAlt }]}>
                  <Icon name={pl.icon} size={20} color={on ? 'primaryText' : 'text'} />
                </View>
                <View style={styles.flex}>
                  <Text variant="subheading">{pl.label}</Text>
                  <Text variant="caption" color="textMuted">
                    {pl.description}
                  </Text>
                </View>
                <Text variant="label" color="textMuted">
                  min {pl.minDaily} ₺
                </Text>
              </View>
            </Card>
          );
        })}
      </View>
      {touched && errors.overlap && (
        <Text color="danger" accessibilityRole="alert">
          {errors.overlap}
        </Text>
      )}

      <Step n={3} title="Süre ve bütçe" error={touched ? errors.budget : undefined} />
      <View style={styles.wrap}>
        {DURATIONS.map((d) => (
          <Chip key={d} label={`${d} gün`} selected={duration === d} onPress={() => setDuration(d)} />
        ))}
      </View>
      <Input
        label="Günlük bütçe (₺)"
        value={budget}
        onChangeText={setBudget}
        keyboardType="number-pad"
        error={touched ? errors.budget : undefined}
      />
      <View style={styles.wrap}>
        {QUICK_BUDGETS.map((b) => (
          <Chip key={b} label={`${b} ₺`} selected={daily === b} onPress={() => setBudget(String(b))} />
        ))}
      </View>

      <Step n={4} title="Önizleme" />
      <Card style={styles.gapSm}>
        <Text variant="label" color="textMuted">
          SALON UYGULAMASINDA · {PLACEMENTS[placement].label.toLocaleUpperCase('tr-TR')}
        </Text>
        <View style={[styles.preview, { borderColor: colors.primary, backgroundColor: colors.bg }]}>
          <View style={[styles.thumb, { backgroundColor: colors.surfaceAlt }]}>
            <Icon name="cube-outline" size={28} color="textMuted" />
          </View>
          <View style={styles.flex}>
            <Badge label="Sponsorlu" />
            <Text variant="subheading" numberOfLines={2}>
              {product?.name ?? 'Ürün seçilmedi'}
            </Text>
            <Text color="textMuted" variant="caption">
              {product?.brand ?? '—'}
            </Text>
          </View>
          <Text variant="subheading" tabular>
            {product ? formatPrice(product.price) : ''}
          </Text>
        </View>
        {reach && (
          <View style={styles.row}>
            <Icon name="people-outline" size={18} color="primary" />
            <Text style={styles.flex}>
              Tahmini {reach.min.toLocaleString('tr-TR')} – {reach.max.toLocaleString('tr-TR')} gösterim
            </Text>
          </View>
        )}
        {product && product.stock <= 15 && (
          <View style={styles.row}>
            <Icon name="warning-outline" size={18} color="warning" />
            <Text color="warning" style={styles.flex}>
              Stok az ({product.stock} {product.unit}). Kampanya talebi karşılanamayabilir.
            </Text>
          </View>
        )}
      </Card>
    </Screen>
  );
}

function Step({ n, title, error }: { n: number; title: string; error?: string }) {
  const colors = useColors();
  return (
    <View style={styles.step}>
      <View style={[styles.stepNo, { backgroundColor: error ? colors.danger : colors.primary }]}>
        <Text variant="label" color="primaryText">
          {n}
        </Text>
      </View>
      <Text variant="heading" style={styles.flex}>
        {title}
      </Text>
      {error && (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      )}
    </View>
  );
}

function ProductOption({ product: p, selected, onPress }: { product: Product; selected: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[
        styles.option,
        { borderColor: selected ? colors.primary : colors.border, backgroundColor: colors.surface, borderWidth: selected ? 2 : 1 },
      ]}>
      <Icon name={selected ? 'radio-button-on' : 'radio-button-off'} size={20} color={selected ? 'primary' : 'textMuted'} />
      <View style={styles.flex}>
        <Text numberOfLines={1}>{p.name}</Text>
        <Text variant="caption" color="textMuted">
          {p.brand} · stok {p.stock}
        </Text>
      </View>
      {p.featured && <Badge label="Vitrinde" />}
      <Text variant="subheading" tabular>
        {formatPrice(p.price)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  gapSm: { gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  stepNo: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md },
  preview: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed' },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
});
