import { formatDuration, formatPrice } from '@/lib/format';

it('fiyatı TL olarak biçimler', () => {
  expect(formatPrice(1250).replace(/\s/g, ' ')).toMatch(/1\.250/);
  expect(formatPrice(1250)).toContain('₺');
});

it('süreyi okunur biçimler', () => {
  expect(formatDuration(30)).toBe('30 dk');
  expect(formatDuration(60)).toBe('1 sa');
  expect(formatDuration(75)).toBe('1 sa 15 dk');
});
