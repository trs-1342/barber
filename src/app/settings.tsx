import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';

import { SectionTitle } from '@/components/supplier';
import { Button, Card, Input, Screen, Text } from '@/components/ui';
import { repo } from '@/data';
import { session, useSession } from '@/store';
import { spacing, useColors } from '@/theme';

export default function SettingsScreen() {
  const colors = useColors();
  const user = useSession();
  const [form, setForm] = useState({
    companyName: user?.companyName ?? '',
    contactName: user?.contactName ?? '',
    phone: user?.phone ?? '',
    city: user?.city ?? '',
  });
  const [notify, setNotify] = useState({ orders: true, stock: true, reports: false });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (form.companyName.trim().length < 2) return Alert.alert('Firma adı gerekli');
    setSaving(true);
    try {
      session.set(await repo.updateSupplier({ ...form, companyName: form.companyName.trim() }));
      router.back();
    } catch (e) {
      Alert.alert('Kaydedilemedi', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const toggles: { key: keyof typeof notify; label: string }[] = [
    { key: 'orders', label: 'Yeni sipariş bildirimi' },
    { key: 'stock', label: 'Düşük stok uyarısı' },
    { key: 'reports', label: 'Haftalık satış özeti' },
  ];

  return (
    <Screen edges={[]} footer={<Button title="Kaydet" onPress={save} loading={saving} />}>
      <SectionTitle title="Firma bilgileri" />
      <Input label="Firma adı" value={form.companyName} onChangeText={set('companyName')} />
      <Input label="Yetkili" value={form.contactName} onChangeText={set('contactName')} />
      <Input label="Telefon" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
      <Input label="Şehir" value={form.city} onChangeText={set('city')} />
      <Input label="Vergi no" value={user?.taxNumber ?? ''} editable={false} />

      <SectionTitle title="Bildirimler" />
      <Card padded={false}>
        {toggles.map((t, i) => (
          <View
            key={t.key}
            style={[styles.toggle, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}>
            <Text style={styles.flex}>{t.label}</Text>
            <Switch
              value={notify[t.key]}
              onValueChange={(v) => setNotify((n) => ({ ...n, [t.key]: v }))}
              accessibilityLabel={t.label}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
});
