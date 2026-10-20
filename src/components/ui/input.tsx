import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { radius, spacing, typography, useColors } from '@/theme';

import { Icon, type IconName } from './icon';
import { Text } from './text';

export type InputProps = TextInputProps & { label?: string; error?: string; icon?: IconName };

export function Input({ label, error, icon, style, onFocus, onBlur, ...rest }: InputProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={styles.wrap}>
      {label && (
        <Text variant="label" color="textMuted">
          {label}
        </Text>
      )}
      <View style={[styles.field, { backgroundColor: colors.surface, borderColor }]}>
        {icon && <Icon name={icon} size={18} color="textMuted" />}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, typography.body, { color: colors.text }, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
      </View>
      {error && (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  input: { flex: 1, paddingVertical: spacing.sm },
});
