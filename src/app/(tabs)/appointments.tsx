import { FlashList } from '@shopify/flash-list';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, Chip, EmptyState, ErrorState, Icon, Screen, Skeleton, Text } from '@/components/ui';
import type { Appointment, AppointmentStatus } from '@/data';
import { formatDate, formatPrice, formatTime } from '@/lib/format';
import { appointmentStore, useAppointments } from '@/store/appointments';
import { spacing, type ColorName } from '@/theme';

const STATUS: Record<AppointmentStatus, { label: string; tone: ColorName }> = {
  pending: { label: 'Onay bekliyor', tone: 'warning' },
  confirmed: { label: 'Onaylandı', tone: 'primary' },
  completed: { label: 'Tamamlandı', tone: 'success' },
  cancelled: { label: 'İptal', tone: 'textMuted' },
  noshow: { label: 'Gelmedi', tone: 'danger' },
};

type Tab = 'upcoming' | 'past';

export default function AppointmentsScreen() {
  const { items, loading, error } = useAppointments();
  const [tab, setTab] = useState<Tab>('upcoming');
  // "Şimdi" sekmeye her dönüşte güncellenir; geçen randevular "Geçmiş"e kayar.
  const [now, setNow] = useState(() => Date.now());
  useFocusEffect(useCallback(() => setNow(Date.now()), []));

  const list = useMemo(() => {
    const upcoming = (a: Appointment) =>
      Date.parse(a.start) >= now && (a.status === 'pending' || a.status === 'confirmed');
    return items
      .filter((a) => (tab === 'upcoming' ? upcoming(a) : !upcoming(a)))
      .sort((a, b) => (tab === 'upcoming' ? 1 : -1) * (Date.parse(a.start) - Date.parse(b.start)));
  }, [items, tab, now]);

  const cancel = (a: Appointment) =>
    Alert.alert('Randevuyu iptal et', `${a.shopName} randevunuz iptal edilsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'İptal et',
        style: 'destructive',
        onPress: () =>
          appointmentStore.cancel(a.id).catch((e: Error) => Alert.alert('İptal edilemedi', e.message)),
      },
    ]);

  return (
    <Screen scroll={false}>
      <FlashList
        data={list}
        keyExtractor={(a) => a.id}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.list}
        refreshing={false}
        onRefresh={appointmentStore.load}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="title">Randevularım</Text>
            <View style={styles.tabs}>
              <Chip label="Yaklaşan" selected={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
              <Chip label="Geçmiş" selected={tab === 'past'} onPress={() => setTab('past')} />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <Skeleton height={120} rounded={16} />
          ) : error ? (
            <ErrorState error={error} onRetry={appointmentStore.load} />
          ) : (
            <EmptyState
              icon="calendar-outline"
              title={tab === 'upcoming' ? 'Yaklaşan randevunuz yok' : 'Geçmiş randevu yok'}
              actionTitle={tab === 'upcoming' ? 'Randevu al' : undefined}
              onAction={() => router.navigate('/')}
            />
          )
        }
        renderItem={({ item: a }) => {
          const d = new Date(a.start);
          const s = STATUS[a.status];
          const canCancel = tab === 'upcoming';
          return (
            <Card style={styles.card}>
              <View style={styles.row}>
                <Text variant="subheading" style={styles.flex} numberOfLines={1}>
                  {a.shopName}
                </Text>
                <Badge label={s.label} tone={s.tone} />
              </View>
              <View style={styles.row}>
                <Icon name="calendar-outline" size={16} color="textMuted" />
                <Text color="textMuted" tabular>
                  {formatDate(d)} · {formatTime(d)}
                </Text>
              </View>
              <View style={styles.row}>
                <Icon name="person-outline" size={16} color="textMuted" />
                <Text color="textMuted">{a.staffName}</Text>
              </View>
              <Text numberOfLines={2}>{a.services.map((x) => x.name).join(', ')}</Text>
              <View style={styles.row}>
                <Text variant="heading" tabular style={styles.flex}>
                  {formatPrice(a.total)}
                </Text>
                {canCancel && <Button title="İptal et" variant="ghost" onPress={() => cancel(a)} />}
              </View>
            </Card>
          );
        }}
      />
    </Screen>
  );
}

const Separator = () => <View style={{ height: spacing.md }} />;

const styles = StyleSheet.create({
  list: { padding: spacing.lg },
  header: { gap: spacing.md, marginBottom: spacing.lg },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
