import { StyleSheet, View } from 'react-native';

import { radius, spacing, useColors, type ColorName } from '@/theme';

import { Text } from './text';

export function Badge({ label, tone = 'primary' }: { label: string; tone?: ColorName }) {
  const colors = useColors();
  return (
    <View style={[styles.badge, { backgroundColor: colors[tone] + '22' }]}>
      <Text variant="label" style={{ color: colors[tone] }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
});
