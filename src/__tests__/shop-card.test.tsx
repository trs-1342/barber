import { fireEvent, render, screen } from '@testing-library/react-native';

import { ShopCard } from '@/components/shop-card';
import { shops } from '@/data/seed';

it('işletme bilgisini gösterir ve dokununca kimliği iletir', async () => {
  const onPress = jest.fn();
  await render(<ShopCard shop={shops[0]!} onPress={onPress} />);

  expect(screen.getByText('Klasik Makas')).toBeTruthy();
  expect(screen.getByText('Kadıköy')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button'));
  expect(onPress).toHaveBeenCalledWith('s1');
});
