import { describe, expect, it } from 'vitest';

import {
  MEAN_EARTH_RADIUS,
  destination,
  haversineDistance,
  initialBearing,
  lineLength,
} from './distance';

const YEREVAN = { lng: 44.4991, lat: 40.1792 };
const TBILISI = { lng: 44.8271, lat: 41.7151 };

describe('haversineDistance', () => {
  it('is zero for coincident points', () => {
    expect(haversineDistance(YEREVAN, YEREVAN)).toBe(0);
  });

  it('puts about 173 km between Yerevan and Tbilisi', () => {
    expect(haversineDistance(YEREVAN, TBILISI) / 1000).toBeCloseTo(172.99, 2);
  });

  it('is symmetric', () => {
    expect(haversineDistance(YEREVAN, TBILISI)).toBeCloseTo(haversineDistance(TBILISI, YEREVAN), 9);
  });

  it('makes one degree of latitude about 111.2 km', () => {
    const step = haversineDistance({ lng: 0, lat: 0 }, { lng: 0, lat: 1 });
    expect(step / 1000).toBeCloseTo(111.2, 1);
  });

  it('makes half the equator equal to half a great circle', () => {
    const half = haversineDistance({ lng: -90, lat: 0 }, { lng: 90, lat: 0 });
    expect(half).toBeCloseTo(Math.PI * MEAN_EARTH_RADIUS, 3);
  });
});

describe('initialBearing', () => {
  it('points due north along a meridian', () => {
    expect(initialBearing({ lng: 0, lat: 0 }, { lng: 0, lat: 10 })).toBeCloseTo(0, 9);
  });

  it('points due east along the equator', () => {
    expect(initialBearing({ lng: 0, lat: 0 }, { lng: 10, lat: 0 })).toBeCloseTo(90, 9);
  });

  it('points due south and due west', () => {
    expect(initialBearing({ lng: 0, lat: 10 }, { lng: 0, lat: 0 })).toBeCloseTo(180, 9);
    expect(initialBearing({ lng: 10, lat: 0 }, { lng: 0, lat: 0 })).toBeCloseTo(270, 9);
  });

  it('runs almost due north from Yerevan to Tbilisi', () => {
    expect(initialBearing(YEREVAN, TBILISI)).toBeCloseTo(9.06, 2);
  });

  it('always stays within [0, 360)', () => {
    const bearing = initialBearing(TBILISI, YEREVAN);
    expect(bearing).toBeGreaterThanOrEqual(0);
    expect(bearing).toBeLessThan(360);
  });
});

describe('destination', () => {
  it('inverts haversineDistance', () => {
    const target = destination(YEREVAN, 45, 25000);
    expect(haversineDistance(YEREVAN, target)).toBeCloseTo(25000, 6);
  });

  it('preserves the bearing', () => {
    const target = destination(YEREVAN, 137, 10000);
    expect(initialBearing(YEREVAN, target)).toBeCloseTo(137, 6);
  });

  it('leaves the point in place for a zero offset', () => {
    const target = destination(YEREVAN, 90, 0);
    expect(target.lng).toBeCloseTo(YEREVAN.lng, 9);
    expect(target.lat).toBeCloseTo(YEREVAN.lat, 9);
  });
});

describe('lineLength', () => {
  it('gives zero length for empty and single-point tracks', () => {
    expect(lineLength([])).toBe(0);
    expect(lineLength([YEREVAN])).toBe(0);
  });

  it('equals the distance between the two points for a two-point track', () => {
    expect(lineLength([YEREVAN, TBILISI])).toBeCloseTo(haversineDistance(YEREVAN, TBILISI), 9);
  });

  it('sums the segments', () => {
    const middle = destination(YEREVAN, 8, 80000);
    const total = lineLength([YEREVAN, middle, TBILISI]);
    expect(total).toBeGreaterThan(haversineDistance(YEREVAN, TBILISI));
    expect(total).toBeCloseTo(
      haversineDistance(YEREVAN, middle) + haversineDistance(middle, TBILISI),
      9,
    );
  });

  it('doubles the length when returning to the start', () => {
    expect(lineLength([YEREVAN, TBILISI, YEREVAN])).toBeCloseTo(
      2 * haversineDistance(YEREVAN, TBILISI),
      9,
    );
  });
});
