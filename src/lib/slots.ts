export type Slot = { start: Date; available: boolean };

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

/** Bugünden başlayarak `count` günlük liste. */
export function nextDays(count: number, from = new Date()) {
  const base = startOfDay(from);
  return Array.from({ length: count }, (_, i) => addDays(base, i));
}

type Busy = { start: Date; durationMin: number };

/**
 * Bir günün randevu saatlerini üretir. Hizmet süresi kapanışa sığmayan, geçmişte kalan
 * ya da dolu bir aralıkla çakışan saatler `available: false` olur.
 */
export function buildSlots({
  day,
  opensAt,
  closesAt,
  durationMin,
  stepMin = 30,
  busy = [],
  now = new Date(),
}: {
  day: Date;
  opensAt: number;
  closesAt: number;
  durationMin: number;
  stepMin?: number;
  busy?: Busy[];
  now?: Date;
}): Slot[] {
  const slots: Slot[] = [];
  const base = startOfDay(day);
  const close = new Date(base).setHours(closesAt, 0, 0, 0);

  for (let min = opensAt * 60; min < closesAt * 60; min += stepMin) {
    const start = new Date(base.getTime() + min * 60_000);
    const end = start.getTime() + durationMin * 60_000;
    const overlaps = busy.some((b) => {
      const bStart = b.start.getTime();
      const bEnd = bStart + b.durationMin * 60_000;
      return start.getTime() < bEnd && end > bStart;
    });
    slots.push({ start, available: end <= close && start > now && !overlaps });
  }
  return slots;
}
