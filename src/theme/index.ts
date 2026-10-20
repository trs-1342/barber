import { useColorScheme } from 'react-native';

// Tek kaynaktan tasarım belirteçleri: görev gelince yalnızca buradaki renkleri değiştirmek yeter.
const palette = {
  light: {
    bg: '#F6F4F1',
    surface: '#FFFFFF',
    surfaceAlt: '#EFECE7',
    border: '#E2DED7',
    text: '#16181D',
    textMuted: '#6E7480',
    primary: '#C9A227',
    primaryText: '#16181D',
    success: '#2E9E5B',
    warning: '#D98E04',
    danger: '#D64545',
    overlay: 'rgba(0,0,0,0.4)',
  },
  dark: {
    bg: '#0E0F11',
    surface: '#17191D',
    surfaceAlt: '#212328',
    border: '#2B2E34',
    text: '#F3F1EC',
    textMuted: '#9AA0AB',
    primary: '#D4AF37',
    primaryText: '#0E0F11',
    success: '#3DBE72',
    warning: '#F0A92A',
    danger: '#EF5B5B',
    overlay: 'rgba(0,0,0,0.6)',
  },
} as const;

export type Colors = { [K in keyof (typeof palette)['light']]: string };
export type ColorName = keyof Colors;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const typography = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  subheading: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
} as const;

export type TypographyVariant = keyof typeof typography;

export { themePreference, useThemePreference, type ThemePreference } from './preference';

export function useColors(): Colors {
  return palette[useColorScheme() === 'dark' ? 'dark' : 'light'];
}

export function useIsDark() {
  return useColorScheme() === 'dark';
}
