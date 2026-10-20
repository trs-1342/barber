import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, type DimensionValue } from 'react-native';

import { radius, spacing, useColors } from '@/theme';

import { Button } from './button';
import { Icon, type IconName } from './icon';
import { Text } from './text';

/** Boş liste, hata ve "bulunamadı" durumları için ortak görünüm. */
export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  actionTitle,
  onAction,
}: {
  icon?: IconName;
  title: string;
  message?: string;
  actionTitle?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={40} color="textMuted" />
      <Text variant="subheading" center>
        {title}
      </Text>
      {message && (
        <Text color="textMuted" center>
          {message}
        </Text>
      )}
      {actionTitle && onAction && <Button title={actionTitle} variant="secondary" onPress={onAction} />}
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <EmptyState
      icon="alert-circle-outline"
      title="Bir şeyler ters gitti"
      message={error.message}
      actionTitle={onRetry ? 'Tekrar dene' : undefined}
      onAction={onRetry}
    />
  );
}

/** Yükleme sırasında içerik iskeleti; döner simgeden daha hızlı algılanır. */
export function Skeleton({
  width = '100%',
  height = 16,
  rounded = radius.sm,
}: {
  width?: DimensionValue;
  height?: number;
  rounded?: number;
}) {
  const colors = useColors();
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ width, height, borderRadius: rounded, backgroundColor: colors.surfaceAlt, opacity }}
    />
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xxl },
});
