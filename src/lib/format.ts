const currency = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
});
const dayFmt = new Intl.DateTimeFormat('tr-TR', { weekday: 'short' });
const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
const timeFmt = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' });

export const formatPrice = (tl: number) => currency.format(tl);
export const formatDay = (d: Date) => dayFmt.format(d);
export const formatDate = (d: Date) => dateFmt.format(d);
export const formatTime = (d: Date) => timeFmt.format(d);

/** Hesaplanamayan metrikler (null) için tire gösterilir. */
export const formatPct = (v: number | null) => (v === null ? '—' : `%${v.toLocaleString('tr-TR')}`);

export function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} dk`;
  return m ? `${h} sa ${m} dk` : `${h} sa`;
}
