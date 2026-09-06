import { describe, expect, it } from 'vitest';

import {
  MEAN_EARTH_RADIUS,
  destination,
  haversineDistance,
  initialBearing,
  pathLength,
} from './distance';

const YEREVAN = { lng: 44.4991, lat: 40.1792 };
const TBILISI = { lng: 44.8271, lat: 41.7151 };

describe('haversineDistance', () => {
  it('нулевая для совпадающих точек', () => {
    expect(haversineDistance(YEREVAN, YEREVAN)).toBe(0);
  });

  it('Ереван и Тбилиси разделяют примерно 173 км', () => {
    expect(haversineDistance(YEREVAN, TBILISI) / 1000).toBeCloseTo(172.99, 2);
  });

  it('симметрична', () => {
    expect(haversineDistance(YEREVAN, TBILISI)).toBeCloseTo(haversineDistance(TBILISI, YEREVAN), 9);
  });

  it('градус широты это примерно 111.2 км', () => {
    const step = haversineDistance({ lng: 0, lat: 0 }, { lng: 0, lat: 1 });
    expect(step / 1000).toBeCloseTo(111.2, 1);
  });

  it('половина экватора равна половине большого круга', () => {
    const half = haversineDistance({ lng: -90, lat: 0 }, { lng: 90, lat: 0 });
    expect(half).toBeCloseTo(Math.PI * MEAN_EARTH_RADIUS, 3);
  });
});

describe('initialBearing', () => {
  it('строго на север по меридиану', () => {
    expect(initialBearing({ lng: 0, lat: 0 }, { lng: 0, lat: 10 })).toBeCloseTo(0, 9);
  });

  it('строго на восток вдоль экватора', () => {
    expect(initialBearing({ lng: 0, lat: 0 }, { lng: 10, lat: 0 })).toBeCloseTo(90, 9);
  });

  it('строго на юг и на запад', () => {
    expect(initialBearing({ lng: 0, lat: 10 }, { lng: 0, lat: 0 })).toBeCloseTo(180, 9);
    expect(initialBearing({ lng: 10, lat: 0 }, { lng: 0, lat: 0 })).toBeCloseTo(270, 9);
  });

  it('из Еревана в Тбилиси идёт почти строго на север', () => {
    expect(initialBearing(YEREVAN, TBILISI)).toBeCloseTo(9.06, 2);
  });

  it('всегда лежит в диапазоне от 0 включительно до 360', () => {
    const bearing = initialBearing(TBILISI, YEREVAN);
    expect(bearing).toBeGreaterThanOrEqual(0);
    expect(bearing).toBeLessThan(360);
  });
});

describe('destination', () => {
  it('обратна haversineDistance', () => {
    const target = destination(YEREVAN, 45, 25000);
    expect(haversineDistance(YEREVAN, target)).toBeCloseTo(25000, 6);
  });

  it('сохраняет азимут', () => {
    const target = destination(YEREVAN, 137, 10000);
    expect(initialBearing(YEREVAN, target)).toBeCloseTo(137, 6);
  });

  it('нулевое смещение оставляет точку на месте', () => {
    const target = destination(YEREVAN, 90, 0);
    expect(target.lng).toBeCloseTo(YEREVAN.lng, 9);
    expect(target.lat).toBeCloseTo(YEREVAN.lat, 9);
  });
});

describe('pathLength', () => {
  it('пустой и одноточечный трек имеют нулевую длину', () => {
    expect(pathLength([])).toBe(0);
    expect(pathLength([YEREVAN])).toBe(0);
  });

  it('для двух точек совпадает с расстоянием между ними', () => {
    expect(pathLength([YEREVAN, TBILISI])).toBeCloseTo(haversineDistance(YEREVAN, TBILISI), 9);
  });

  it('складывает сегменты', () => {
    const middle = destination(YEREVAN, 8, 80000);
    const total = pathLength([YEREVAN, middle, TBILISI]);
    expect(total).toBeGreaterThan(haversineDistance(YEREVAN, TBILISI));
    expect(total).toBeCloseTo(
      haversineDistance(YEREVAN, middle) + haversineDistance(middle, TBILISI),
      9,
    );
  });

  it('возврат в исходную точку удваивает длину', () => {
    expect(pathLength([YEREVAN, TBILISI, YEREVAN])).toBeCloseTo(
      2 * haversineDistance(YEREVAN, TBILISI),
      9,
    );
  });
});
