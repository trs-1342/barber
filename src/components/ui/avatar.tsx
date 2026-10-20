import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useColors } from '@/theme';

import { Text } from './text';

export function Avatar({ name, uri, size = 44 }: { name: string; uri?: string; size?: number }) {
  const colors = useColors();
  const box = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={uri} style={box} contentFit="cover" transition={150} />;
  }
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toLocaleUpperCase('tr-TR'))
    .join('');
  return (
    <View style={[styles.fallback, box, { backgroundColor: colors.surfaceAlt }]}>
      <Text variant="subheading" color="textMuted" style={{ fontSize: size * 0.36 }}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
