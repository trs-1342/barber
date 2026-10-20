import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { radius, spacing, useColors } from '@/theme';

export type CardProps = ViewProps & { onPress?: () => void; selected?: boolean; padded?: boolean };

export function Card({ onPress, selected, padded = true, style, children, ...rest }: CardProps) {
  const colors = useColors();
  const cardStyle = [
    styles.card,
    padded && styles.padded,
    {
      backgroundColor: colors.surface,
      borderColor: selected ? colors.primary : colors.border,
      borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
    },
    style,
  ];

  if (!onPress) {
    return (
      <View style={cardStyle} {...rest}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [cardStyle, pressed && { opacity: 0.8 }]}
      {...rest}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  padded: { padding: spacing.lg },
});
