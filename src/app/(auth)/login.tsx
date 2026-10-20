import { Image } from 'expo-image';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { DataSourceSwitch } from '@/components/data-source-switch';
import { Button, Icon, Input, Screen, Text } from '@/components/ui';
import { repo } from '@/data';
import { supplier as demoSupplier } from '@/data/seed';
import { session, useDataSource } from '@/store';
import { radius, spacing, useColors } from '@/theme';

type Mode = 'login' | 'register';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const colors = useColors();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({
    email: '',
    password: '',
    companyName: '',
    contactName: '',
    phone: '',
    city: '',
    taxNumber: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [submitError, setSubmitError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const isDemo = useDataSource() === 'mock';

  const set = (k: keyof typeof form) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  function validate() {
    const e: typeof errors = {};
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Geçerli bir e-posta girin';
    if (form.password.length < 6) e.password = 'En az 6 karakter';
    if (mode === 'register') {
      if (form.companyName.trim().length < 2) e.companyName = 'Firma adı gerekli';
      if (form.contactName.trim().length < 2) e.contactName = 'Yetkili adı gerekli';
      if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'Geçerli bir telefon girin';
      if (!/^\d{10,11}$/.test(form.taxNumber)) e.taxNumber = 'Vergi/TC no 10-11 haneli olmalı';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function openDemo() {
    setLoading(true);
    try {
      session.set(await repo.signIn({ email: demoSupplier.email, password: 'demo1234' }));
    } finally {
      setLoading(false);
    }
  }

  async function guest() {
    setSubmitError(undefined);
    setLoading(true);
    try {
      session.set(await repo.signInGuest());
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    setSubmitError(undefined);
    if (!validate()) return;
    setLoading(true);
    try {
      const user =
        mode === 'login'
          ? await repo.signIn({ email: form.email, password: form.password })
          : await repo.register({ ...form, city: form.city.trim() || 'İstanbul' });
      session.set(user); // korumalı rotalar paneli açar
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === 'login';

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen edges={['top', 'bottom']} contentStyle={styles.content}>
        <View style={styles.brand}>
          <Image source={require('@/assets/images/splash-icon.png')} style={styles.logo} contentFit="contain" accessibilityLabel="Logo" />
          <Text variant="title">Tedarikçi Paneli</Text>
          <Text color="textMuted" center>
            Ürünlerinizi salonlara ulaştırın, siparişlerinizi tek yerden yönetin.
          </Text>
        </View>

        {/* Demo seçilirse demo tedarikçiyle doğrudan Reklam sekmesi açılır. */}
        <DataSourceSwitch onChange={() => setSubmitError(undefined)} />

        {isDemo ? (
          <View style={styles.form}>
            <Text color="textMuted" center>
              Örnek verilerle, internet ve hesap gerekmeden denemek için.
            </Text>
            <Button title="Demoyu aç" loading={loading} onPress={openDemo} haptic />
          </View>
        ) : (
          <>
            <View style={[styles.segment, { backgroundColor: colors.surfaceAlt }]}>
              {(['login', 'register'] as const).map((m) => (
                <Pressable
                  key={m}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: mode === m }}
                  onPress={() => {
                    setMode(m);
                    setErrors({});
                    setSubmitError(undefined);
                  }}
                  style={[styles.segmentItem, mode === m && { backgroundColor: colors.surface }]}>
                  <Text variant="subheading" color={mode === m ? 'text' : 'textMuted'}>
                    {m === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.form}>
              {!isLogin && (
                <>
                  <Input
                    label="Firma adı"
                    value={form.companyName}
                    onChangeText={set('companyName')}
                    error={errors.companyName}
                  />
                  <Input
                    label="Yetkili adı soyadı"
                    value={form.contactName}
                    onChangeText={set('contactName')}
                    error={errors.contactName}
                    textContentType="name"
                  />
                  <Input
                    label="Telefon"
                    value={form.phone}
                    onChangeText={set('phone')}
                    error={errors.phone}
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                  />
                  <Input
                    label="Vergi / TC kimlik no"
                    value={form.taxNumber}
                    onChangeText={set('taxNumber')}
                    error={errors.taxNumber}
                    keyboardType="number-pad"
                    maxLength={11}
                  />
                  <Input label="Şehir" value={form.city} onChangeText={set('city')} placeholder="İstanbul" />
                </>
              )}
              <Input
                label="E-posta"
                icon="mail-outline"
                value={form.email}
                onChangeText={set('email')}
                error={errors.email}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
              />
              <Input
                label="Şifre"
                icon="lock-closed-outline"
                value={form.password}
                onChangeText={set('password')}
                error={errors.password}
                secureTextEntry
                textContentType={isLogin ? 'password' : 'newPassword'}
                onSubmitEditing={submit}
                returnKeyType="go"
              />
              {submitError && (
                <Text color="danger" accessibilityRole="alert">
                  {submitError}
                </Text>
              )}
              <Button title={isLogin ? 'Giriş Yap' : 'Hesap Oluştur'} loading={loading} onPress={submit} haptic />
              <Button
                title="Google ile devam et"
                icon="logo-google"
                variant="ghost"
                onPress={() => Alert.alert('Google ile giriş', 'Yakında. Şimdilik e-posta ile ya da giriş yapmadan devam edebilirsiniz.')}
              />
              <Button title="Giriş yapmadan devam et" variant="secondary" onPress={guest} disabled={loading} />
              <Text variant="caption" color="textMuted" center>
                Gerçek veri: Firebase hesabınızla giriş yapın ya da yeni hesap oluşturun.
              </Text>
            </View>
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.xl, flexGrow: 1, justifyContent: 'center' },
  brand: { alignItems: 'center', gap: spacing.sm },
  logo: { width: 88, height: 88 },
  segment: { flexDirection: 'row', borderRadius: radius.md, padding: 4 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.sm },
  form: { gap: spacing.md },
});
