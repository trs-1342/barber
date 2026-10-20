import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar, Card, Icon, Text } from '@/components/ui';
import type { Shop } from '@/data/types';
import { formatPrice } from '@/lib/format';
import { spacing } from '@/theme';

type Props = { shop: Shop; onPress: (id: string) => void };

// memo: liste kaydırılırken değişmeyen kartlar yeniden çizilmez.
export const ShopCard = memo(function ShopCard({ shop, onPress }: Props) {
  const minPrice = Math.min(...shop.services.map((s) => s.price));

  return (
    <Card onPress={() => onPress(shop.id)} accessibilityLabel={`${shop.name}, ${shop.district}`}>
      <View style={styles.row}>
        <Avatar name={shop.name} uri={shop.cover} size={56} />
        <View style={styles.info}>
          <Text variant="subheading" numberOfLines={1}>
            {shop.name}
          </Text>
          <View style={styles.meta}>
            <Icon name="location-outline" size={14} color="textMuted" />
            <Text variant="caption" color="textMuted">
              {shop.district}
            </Text>
          </View>
          <View style={styles.meta}>
            <Icon name="star" size={14} color="primary" />
            <Text variant="caption" tabular>
              {shop.rating.toFixed(1)}
            </Text>
            <Text variant="caption" color="textMuted">
              ({shop.reviewCount})
            </Text>
          </View>
        </View>
        <View style={styles.price}>
          <Text variant="label" color="textMuted">
            başlayan
          </Text>
          <Text variant="subheading" tabular>
            {formatPrice(minPrice)}
          </Text>
        </View>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  info: { flex: 1, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  price: { alignItems: 'flex-end' },
});
