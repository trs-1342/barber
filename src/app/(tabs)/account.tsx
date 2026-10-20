import Constants from 'expo-constants';
import { router, type Href } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Card, Icon, Screen, Text, type IconName } from '@/components/ui';
import { session, useDataSource, useSession } from '@/store';
import { spacing, useColors } from '@/theme';

export default function AccountScreen() {
  const user = useSession();
  const source = useDataSource();
  if (!user) return null;

  const signOut = () =>
    Alert.alert('Çıkış yap', 'Hesabınızdan çıkış yapılsın mı?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış yap', style: 'destructive', onPress: () => session.signOut() },
    ]);

  return (
    <Screen>
      <Text variant="title">Tedarikçi Hesabı</Text>
      <Card style={styles.user}>
        <Avatar name={user.companyName} size={64} />
        <View style={styles.flex}>
          <Text variant="heading" numberOfLines={1}>
            {user.companyName}
          </Text>
          <Text color="textMuted" numberOfLines={1}>
            {user.contactName}
          </Text>
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {user.email}
          </Text>
        </View>
      </Card>

      <Card padded={false}>
        <Row icon="bar-chart-outline" label="Satış raporları" href="/reports" />
        <Row icon="settings-outline" label="Ayarlar ve firma bilgileri" href="/settings" />
        <Row icon="log-out-outline" label="Çıkış yap" onPress={signOut} danger last />
      </Card>

      <Text variant="caption" color="textMuted" center>
        v{Constants.expoConfig?.version} · veri: {source === 'mock' ? 'demo' : source}
      </Text>
    </Screen>
  );
}

function Row({
  icon,
  label,
  href,
  onPress,
  danger,
  last,
}: {
  icon: IconName;
  label: string;
  href?: Href;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress ?? (() => href && router.push(href))}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
        pressed && { backgroundColor: colors.surfaceAlt },
      ]}>
      <Icon name={icon} size={20} color={danger ? 'danger' : 'text'} />
      <Text style={styles.flex} color={danger ? 'danger' : 'text'}>
        {label}
      </Text>
      {!danger && <Icon name="chevron-forward" size={18} color="textMuted" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  user: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
});
