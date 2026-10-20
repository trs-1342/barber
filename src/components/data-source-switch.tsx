import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import type { DataSource } from '@/lib/env';
import { setDataSource, useDataSource } from '@/store';
import { radius, spacing, useColors } from '@/theme';

const OPTIONS: { value: DataSource; label: string }[] = [
  { value: 'mock', label: 'Demo veri' },
  { value: 'firebase', label: 'Gerçek veri' },
];

/** Demo veri (çevrimdışı örnek) ile Gerçek veri (Firebase) arasında seçim. Seçim cihazda saklanır. */
export function DataSourceSwitch({ onChange }: { onChange?: (s: DataSource) => void }) {
  const colors = useColors();
  const current = useDataSource();
  return (
    <View accessibilityRole="tablist" style={[styles.segment, { backgroundColor: colors.surfaceAlt }]}>
      {OPTIONS.map((o) => {
        const selected = current === o.value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              setDataSource(o.value);
              onChange?.(o.value);
            }}
            style={[styles.item, selected && { backgroundColor: colors.surface }]}>
            <Text variant="subheading" color={selected ? 'text' : 'textMuted'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', borderRadius: radius.md, padding: 4 },
  item: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.sm },
});
