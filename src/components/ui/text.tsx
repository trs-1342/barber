import { Text as RNText, type TextProps } from 'react-native';

import { typography, useColors, type ColorName, type TypographyVariant } from '@/theme';

export type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: ColorName;
  center?: boolean;
  /** Para ve sayılar için sabit genişlikli rakamlar. */
  tabular?: boolean;
};

export function Text({
  variant = 'body',
  color = 'text',
  center,
  tabular,
  style,
  ...rest
}: AppTextProps) {
  const colors = useColors();
  return (
    <RNText
      style={[
        typography[variant],
        { color: colors[color] },
        center && { textAlign: 'center' },
        tabular && { fontVariant: ['tabular-nums'] },
        style,
      ]}
      {...rest}
    />
  );
}
