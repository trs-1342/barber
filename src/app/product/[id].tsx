import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';

import { Button, Card, Input, Screen, Text } from '@/components/ui';
import { repo, type ProductInput } from '@/data';
import { products } from '@/store';
import { spacing, useColors } from '@/theme';

const EMPTY: ProductInput = {
  name: '',
  brand: '',
  category: '',
  price: 0,
  stock: 0,
  unit: 'adet',
  active: true,
  featured: false,
};

/** "1.250,50" gibi Türkçe girişleri sayıya çevirir. */
const parseNum = (s: string) => Number(s.replace(/\./g, '').replace(',', '.'));

export default function ProductEditScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const existing = products.useList().items.find((p) => p.id === id);
  const initial = existing ?? EMPTY;

  const [form, setForm] = useState({
    ...initial,
    price: isNew ? '' : String(initial.price),
    stock: isNew ? '' : String(initial.stock),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof form>(k: K) => (v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    const price = parseNum(form.price);
    const stock = parseNum(form.stock);
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = 'Ürün adı gerekli';
    if (!form.brand.trim()) e.brand = 'Marka gerekli';
    if (!Number.isFinite(price) || price <= 0) e.price = 'Geçerli bir fiyat girin';
    if (!Number.isInteger(stock) || stock < 0) e.stock = 'Stok 0 veya pozitif tam sayı olmalı';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const saved = await repo.saveProduct(
        {
          name: form.name.trim(),
          brand: form.brand.trim(),
          category: form.category.trim() || 'Genel',
          unit: form.unit.trim() || 'adet',
          price,
          stock,
          active: form.active,
          featured: form.featured,
        },
        isNew ? undefined : id,
      );
      products.upsert(saved);
      router.back();
    } catch (err) {
      Alert.alert('Kaydedilemedi', (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen edges={[]} footer={<Button title={isNew ? 'Ürünü ekle' : 'Kaydet'} onPress={save} loading={saving} haptic />}>
      <Stack.Screen options={{ title: isNew ? 'Yeni ürün' : 'Ürünü düzenle' }} />
      <Input label="Ürün adı" value={form.name} onChangeText={set('name')} error={errors.name} />
      <View style={styles.row}>
        <View style={styles.flex}>
          <Input label="Marka" value={form.brand} onChangeText={set('brand')} error={errors.brand} />
        </View>
        <View style={styles.flex}>
          <Input label="Kategori" value={form.category} onChangeText={set('category')} placeholder="Genel" />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Input label="Birim fiyat (₺)" value={form.price} onChangeText={set('price')} error={errors.price} keyboardType="decimal-pad" />
        </View>
        <View style={styles.flex}>
          <Input label="Stok" value={form.stock} onChangeText={set('stock')} error={errors.stock} keyboardType="number-pad" />
        </View>
        <View style={styles.unit}>
          <Input label="Birim" value={form.unit} onChangeText={set('unit')} />
        </View>
      </View>

      <Card padded={false}>
        <ToggleRow
          label="Satışta"
          hint="Kapalıysa salonlar bu ürünü göremez"
          value={form.active}
          onChange={set('active')}
        />
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
        <ToggleRow
          label="Öne çıkar"
          hint="Salon uygulamasında vitrinde gösterilir"
          value={form.featured}
          onChange={set('featured')}
        />
      </Card>
    </Screen>
  );
}

function ToggleRow({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  const colors = useColors();
  return (
    <View style={styles.toggle}>
      <View style={styles.flex}>
        <Text variant="subheading">{label}</Text>
        <Text variant="caption" color="textMuted">
          {hint}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ true: colors.primary, false: colors.border }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.md },
  unit: { width: 84 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
});
