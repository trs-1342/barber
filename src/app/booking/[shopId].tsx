import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, ErrorState, Screen, Skeleton, Text } from '@/components/ui';
import { repo, SlotTakenError, type Appointment, type Shop } from '@/data';
import { useQuery } from '@/hooks/use-query';
import { formatDate, formatDay, formatDuration, formatPrice, formatTime } from '@/lib/format';
import { buildSlots, isSameDay, nextDays } from '@/lib/slots';
import { appointmentStore, useAppointments } from '@/store/appointments';
import { radius, spacing, useColors } from '@/theme';

const ANY_STAFF = 'any';

export default function BookingScreen() {
  const colors = useColors();
  const { shopId, services = '' } = useLocalSearchParams<{ shopId: string; services?: string }>();
  const { data: shop, error, loading, refetch } = useQuery((s) => repo.getShop(shopId, s), [shopId]);
  const { items: appointments } = useAppointments();

  const days = useMemo(() => nextDays(14), []);
  const [day, setDay] = useState(days[0]!);
  const [staffId, setStaffId] = useState<string>(ANY_STAFF);
  const [slot, setSlot] = useState<Date>();
  const [submitting, setSubmitting] = useState(false);

  const chosen = useMemo(() => {
    const ids = new Set(services.split(',').filter(Boolean));
    return shop?.services.filter((s) => ids.has(s.id)) ?? [];
  }, [shop, services]);
  const duration = chosen.reduce((sum, s) => sum + s.durationMin, 0);
  const total = chosen.reduce((sum, s) => sum + s.price, 0);

  const slots = useMemo(() => {
    if (!shop) return [];
    const base = { day, opensAt: shop.opensAt, closesAt: shop.closesAt, durationMin: duration };
    if (staffId !== ANY_STAFF) return buildSlots({ ...base, busy: busyFor(appointments, shop.id, staffId) });
    // "Farketmez": en az bir personel boşsa saat açıktır.
    const perStaff = shop.staff.map((p) => buildSlots({ ...base, busy: busyFor(appointments, shop.id, p.id) }));
    return perStaff[0]!.map((s, i) => ({ ...s, available: perStaff.some((ps) => ps[i]!.available) }));
  }, [shop, appointments, day, staffId, duration]);

  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (loading || !shop) {
    return (
      <Screen edges={[]}>
        <Skeleton height={72} />
        <Skeleton height={64} />
        <Skeleton height={200} />
      </Screen>
    );
  }

  const confirm = async () => {
    if (!slot) return;
    const staff =
      staffId === ANY_STAFF ? firstFreeStaff(shop, appointments, slot, duration) : shop.staff.find((p) => p.id === staffId);
    setSubmitting(true);
    try {
      await appointmentStore.add({
        shopId: shop.id,
        shopName: shop.name,
        staffId: staff?.id ?? null,
        staffName: staff?.name ?? 'Farketmez',
        services: chosen,
        start: slot.toISOString(),
        durationMin: duration,
        total,
      });
      router.dismissAll();
      router.navigate('/appointments');
    } catch (e) {
      if (e instanceof SlotTakenError) setSlot(undefined);
      Alert.alert('Randevu oluşturulamadı', (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      edges={[]}
      footer={
        <View style={styles.footer}>
          <View style={styles.flex}>
            <Text variant="caption" color="textMuted" numberOfLines={1}>
              {slot ? `${formatDate(slot)} · ${formatTime(slot)}` : 'Saat seçin'}
            </Text>
            <Text variant="heading" tabular>
              {formatPrice(total)}
            </Text>
          </View>
          <Button title="Onayla" disabled={!slot} loading={submitting} haptic onPress={confirm} />
        </View>
      }>
      <Card>
        <Text variant="subheading">{shop.name}</Text>
        <Text color="textMuted">
          {chosen.map((s) => s.name).join(', ')} · {formatDuration(duration)}
        </Text>
      </Card>

      <Text variant="heading">Personel</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
        {[{ id: ANY_STAFF, name: 'Farketmez' }, ...shop.staff].map((p) => {
          const on = staffId === p.id;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => {
                setStaffId(p.id);
                setSlot(undefined);
              }}
              style={[styles.person, on && { borderColor: colors.primary }]}>
              <Avatar name={p.name} size={48} />
              <Text variant="caption" numberOfLines={1}>
                {p.name.split(' ')[0]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text variant="heading">Tarih</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
        {days.map((d) => {
          const on = isSameDay(d, day);
          return (
            <Pressable
              key={d.toISOString()}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={formatDate(d)}
              onPress={() => {
                setDay(d);
                setSlot(undefined);
              }}
              style={[
                styles.day,
                {
                  backgroundColor: on ? colors.primary : colors.surface,
                  borderColor: on ? colors.primary : colors.border,
                },
              ]}>
              <Text variant="label" color={on ? 'primaryText' : 'textMuted'}>
                {formatDay(d)}
              </Text>
              <Text variant="heading" color={on ? 'primaryText' : 'text'} tabular>
                {d.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text variant="heading">Saat</Text>
      {slots.some((s) => s.available) ? (
        <View style={styles.grid}>
          {slots.map((s) => {
            const on = slot?.getTime() === s.start.getTime();
            return (
              <Pressable
                key={s.start.toISOString()}
                disabled={!s.available}
                accessibilityRole="button"
                accessibilityState={{ selected: on, disabled: !s.available }}
                onPress={() => setSlot(s.start)}
                style={[
                  styles.slot,
                  {
                    backgroundColor: on ? colors.primary : colors.surface,
                    borderColor: on ? colors.primary : colors.border,
                    opacity: s.available ? 1 : 0.35,
                  },
                ]}>
                <Text
                  variant="caption"
                  color={on ? 'primaryText' : 'text'}
                  tabular
                  style={!s.available && styles.strike}>
                  {formatTime(s.start)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text color="textMuted">Bu gün için uygun saat kalmadı. Başka bir gün seçin.</Text>
      )}
    </Screen>
  );
}

function busyFor(appointments: Appointment[], shopId: string, staffId: string) {
  return appointments
    .filter((a) => a.shopId === shopId && a.staffId === staffId && a.status !== 'cancelled')
    .map((a) => ({ start: new Date(a.start), durationMin: a.durationMin }));
}

function firstFreeStaff(shop: Shop, appointments: Appointment[], slot: Date, durationMin: number) {
  return shop.staff.find((p) =>
    buildSlots({
      day: slot,
      opensAt: shop.opensAt,
      closesAt: shop.closesAt,
      durationMin,
      busy: busyFor(appointments, shop.id, p.id),
    }).some((s) => s.available && s.start.getTime() === slot.getTime()),
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  hList: { gap: spacing.sm },
  person: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 80,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  day: {
    width: 56,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: {
    width: '22.5%',
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  strike: { textDecorationLine: 'line-through' },
});
