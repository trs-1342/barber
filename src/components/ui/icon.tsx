import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { useColors, type ColorName } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Icon({
  name,
  size = 20,
  color = 'text',
}: {
  name: IconName;
  size?: number;
  color?: ColorName;
}) {
  const colors = useColors();
  return <Ionicons name={name} size={size} color={colors[color]} />;
}
