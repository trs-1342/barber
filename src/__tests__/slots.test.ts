import { buildSlots, nextDays } from '@/lib/slots';

const day = new Date(2030, 0, 15);
const past = new Date(2000, 0, 1);

describe('buildSlots', () => {
  it('açılıştan kapanışa 30 dakikalık saatler üretir', () => {
    const slots = buildSlots({ day, opensAt: 9, closesAt: 11, durationMin: 30, now: past });
    expect(slots.map((s) => s.start.getHours() * 60 + s.start.getMinutes())).toEqual([540, 570, 600, 630]);
    expect(slots.every((s) => s.available)).toBe(true);
  });

  it('kapanışa sığmayan hizmeti kapatır', () => {
    const slots = buildSlots({ day, opensAt: 9, closesAt: 11, durationMin: 45, now: past });
    expect(slots.at(-1)!.available).toBe(false); // 10:30 + 45 dk > 11:00
    expect(slots.at(-2)!.available).toBe(true); // 10:00 + 45 dk = 10:45
  });

  it('dolu aralıkla çakışanları kapatır, bitişik olanları açık bırakır', () => {
    const busy = [{ start: new Date(2030, 0, 15, 10, 0), durationMin: 30 }];
    const slots = buildSlots({ day, opensAt: 9, closesAt: 12, durationMin: 30, busy, now: past });
    const at = (h: number, m: number) =>
      slots.find((s) => s.start.getHours() === h && s.start.getMinutes() === m)!.available;
    expect(at(9, 30)).toBe(true);
    expect(at(10, 0)).toBe(false);
    expect(at(10, 30)).toBe(true);
  });

  it('geçmişteki saatleri kapatır', () => {
    const now = new Date(2030, 0, 15, 10, 0);
    const slots = buildSlots({ day, opensAt: 9, closesAt: 11, durationMin: 30, now });
    expect(slots.filter((s) => s.available)).toHaveLength(1); // yalnızca 10:30
  });
});

it('nextDays bugünden başlayan ardışık günler döner', () => {
  const days = nextDays(3, new Date(2030, 0, 31, 15));
  expect(days.map((d) => d.getDate())).toEqual([31, 1, 2]);
  expect(days[0]!.getHours()).toBe(0);
});
