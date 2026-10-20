import Constants from 'expo-constants';
import { StyleSheet, View } from 'react-native';

import { Avatar, Card, Icon, Screen, Text, type IconName } from '@/components/ui';
import { env } from '@/lib/env';
import { useAppointments } from '@/store/appointments';
import { spacing, useColors } from '@/theme';

export default function ProfileScreen() {
  const { items } = useAppointments();
  const done = items.filter((a) => a.status === 'completed').length;

  return (
    <Screen>
      <Text variant="title">Profil</Text>
      <Card style={styles.user}>
        <Avatar name="Misafir Kullanıcı" size={64} />
        <View style={styles.flex}>
          <Text variant="heading">Misafir Kullanıcı</Text>
          <Text color="textMuted">{done} tamamlanan randevu</Text>
        </View>
      </Card>

      <Card padded={false}>
        <Row icon="notifications-outline" label="Bildirimler" />
        <Row icon="heart-outline" label="Favori işletmeler" />
        <Row icon="help-circle-outline" label="Yardım" last />
      </Card>

      <Text variant="caption" color="textMuted" center>
        v{Constants.expoConfig?.version} · veri kaynağı: {env.dataSource}
      </Text>
    </Screen>
  );
}

function Row({ icon, label, last }: { icon: IconName; label: string; last?: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.row, !last && { ...styles.divider, borderColor: colors.border }]}>
      <Icon name={icon} size={20} />
      <Text style={styles.flex}>{label}</Text>
      <Icon name="chevron-forward" size={18} color="textMuted" />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  user: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth },
});
