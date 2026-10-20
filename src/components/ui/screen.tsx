import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { spacing, useColors } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  /** false ise içerik kaydırılmaz (FlashList gibi kendi kaydırması olan listeler için). */
  scroll?: boolean;
  /** Ekranın altına sabitlenen alan (ör. "Devam" düğmesi). */
  footer?: ReactNode;
  edges?: Edge[];
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
};

export function Screen({
  children,
  scroll = true,
  footer,
  edges = ['top'],
  refreshing,
  onRefresh,
  contentStyle,
}: ScreenProps) {
  const colors = useColors();

  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: colors.bg }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contentStyle]}>{children}</View>
      )}
      {footer && (
        <SafeAreaView
          edges={['bottom']}
          style={[styles.footer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {footer}
        </SafeAreaView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
