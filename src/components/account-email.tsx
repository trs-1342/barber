import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { SectionTitle } from '@/components/supplier';
import { Badge, Button, Card, Input, Text } from '@/components/ui';
import { repo, type AccountInfo } from '@/data';
import { session, useSession } from '@/store';
import { spacing } from '@/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Panel = 'none' | 'change' | 'upgrade';

/** Ayarlar > Hesap ve e-posta: doğrulama, şifre sıfırlama, e-posta değiştirme ve misafiri kalıcı hesaba çevirme. */
export function AccountEmail() {
  const user = useSession();
  const [info, setInfo] = useState<AccountInfo>();
  const [panel, setPanel] = useState<Panel>('none');
  const [busy, setBusy] = useState<string>();
  const [form, setForm] = useState({ email: '', password: '', companyName: '', contactName: '', phone: '', taxNumber: '' });
  const [error, setError] = useState<string>();
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const refresh = useCallback(() => {
    repo.getAccountInfo().then(setInfo, () => setInfo(undefined));
  }, []);
  useEffect(refresh, [refresh, user?.id]);

  async function run(key: string, fn: () => Promise<void>) {
    setError(undefined);
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(undefined);
    }
  }

  const resend = () =>
    run('resend', async () => {
      await repo.resendVerification();
      Alert.alert('Gönderildi', `${info?.email} adresine doğrulama bağlantısı gönderildi.`);
    });

  const reset = () =>
    run('reset', async () => {
      if (!info?.email) return;
      await repo.sendPasswordReset(info.email);
      Alert.alert('Gönderildi', `${info.email} adresine şifre sıfırlama bağlantısı gönderildi.`);
    });

  const change = () =>
    run('change', async () => {
      if (!EMAIL_RE.test(form.email.trim())) throw new Error('Geçerli bir e-posta girin');
      if (form.email.trim().toLowerCase() === info?.email) throw new Error('Yeni e-posta mevcut adresle aynı');
      await repo.changeEmail(form.email, form.password);
      setPanel('none');
      setForm((f) => ({ ...f, email: '', password: '' }));
      refresh();
      Alert.alert(
        'Doğrulama gönderildi',
        `${form.email.trim()} adresine gelen bağlantıya tıkladığınızda e-postanız değişir. Sonra yeni adresle giriş yapın.`,
      );
    });

  const upgrade = () =>
    run('upgrade', async () => {
      if (!EMAIL_RE.test(form.email.trim())) throw new Error('Geçerli bir e-posta girin');
      if (form.password.length < 6) throw new Error('Şifre en az 6 karakter olmalı');
      if (form.companyName.trim().length < 2) throw new Error('Firma adı gerekli');
      if (!/^\d{10,11}$/.test(form.taxNumber)) throw new Error('Vergi/TC no 10-11 haneli olmalı');
      const supplier = await repo.upgradeGuest({
        email: form.email,
        password: form.password,
        companyName: form.companyName.trim(),
        contactName: form.contactName.trim() || form.companyName.trim(),
        phone: form.phone.trim(),
        city: user?.city || 'İstanbul',
        taxNumber: form.taxNumber,
      });
      session.set(supplier);
      setPanel('none');
      refresh();
      Alert.alert('Hesabınız kalıcı', 'Misafirken eklediğiniz veriler korundu. E-postanıza doğrulama bağlantısı gönderildi.');
    });

  if (!info) return null;

  return (
    <View style={styles.gap}>
      <SectionTitle title="Hesap ve e-posta" />
      <Card style={styles.gap}>
        {info.isGuest ? (
          <>
            <View style={styles.row}>
              <Text variant="subheading" style={styles.flex}>
                Misafir hesap
              </Text>
              <Badge label="E-posta yok" tone="warning" />
            </View>
            <Text color="textMuted">
              E-posta ekleyerek hesabınızı kalıcı yapın; eklediğiniz ürün ve kampanyalar korunur.
            </Text>
            {panel !== 'upgrade' && <Button title="E-posta ekle" icon="mail-outline" onPress={() => setPanel('upgrade')} />}
          </>
        ) : (
          <>
            <View style={styles.row}>
              <Text variant="subheading" style={styles.flex} numberOfLines={1}>
                {info.email}
              </Text>
              <Badge label={info.emailVerified ? 'Doğrulandı' : 'Doğrulanmadı'} tone={info.emailVerified ? 'success' : 'warning'} />
            </View>
            {!info.emailVerified && (
              <Button title="Doğrulama e-postasını tekrar gönder" variant="secondary" onPress={resend} loading={busy === 'resend'} />
            )}
            <Button title="Şifre sıfırlama bağlantısı gönder" variant="ghost" onPress={reset} loading={busy === 'reset'} />
            {panel !== 'change' && <Button title="E-postayı değiştir" variant="ghost" onPress={() => setPanel('change')} />}
          </>
        )}

        {panel === 'change' && (
          <View style={styles.gap}>
            <Input label="Yeni e-posta" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
            <Input label="Mevcut şifre" value={form.password} onChangeText={set('password')} secureTextEntry />
            <View style={styles.row}>
              <Button title="Vazgeç" variant="ghost" onPress={() => setPanel('none')} />
              <Button title="Doğrulama gönder" onPress={change} loading={busy === 'change'} style={styles.flex} />
            </View>
          </View>
        )}

        {panel === 'upgrade' && (
          <View style={styles.gap}>
            <Input label="E-posta" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
            <Input label="Şifre" value={form.password} onChangeText={set('password')} secureTextEntry />
            <Input label="Firma adı" value={form.companyName} onChangeText={set('companyName')} />
            <Input label="Yetkili adı" value={form.contactName} onChangeText={set('contactName')} />
            <Input label="Telefon" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
            <Input label="Vergi / TC no" value={form.taxNumber} onChangeText={set('taxNumber')} keyboardType="number-pad" maxLength={11} />
            <View style={styles.row}>
              <Button title="Vazgeç" variant="ghost" onPress={() => setPanel('none')} />
              <Button title="Hesabı kalıcı yap" onPress={upgrade} loading={busy === 'upgrade'} style={styles.flex} />
            </View>
          </View>
        )}

        {error && (
          <Text color="danger" accessibilityRole="alert">
            {error}
          </Text>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
