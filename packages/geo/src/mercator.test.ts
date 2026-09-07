import { describe, expect, it } from 'vitest';

import {
  EARTH_CIRCUMFERENCE,
  MAX_LATITUDE,
  clampLatitude,
  lngLatToMercator,
  lngLatToTile,
  mercatorToLngLat,
  metersPerPixel,
  normalizeLongitude,
  tileBounds,
  tilesPerAxis,
  tileToLngLat,
} from './mercator';

const YEREVAN = { lng: 44.4991, lat: 40.1792 };
const NULL_ISLAND = { lng: 0, lat: 0 };

describe('tilesPerAxis', () => {
  it('returns a single tile at zoom 0', () => {
    expect(tilesPerAxis(0)).toBe(1);
  });

  it('doubles with every zoom level', () => {
    expect(tilesPerAxis(1)).toBe(2);
    expect(tilesPerAxis(12)).toBe(4096);
  });

  it('rejects fractional and negative zoom', () => {
    expect(() => tilesPerAxis(1.5)).toThrow(RangeError);
    expect(() => tilesPerAxis(-1)).toThrow(RangeError);
  });
});

describe('clampLatitude', () => {
  it('leaves latitudes inside the range untouched', () => {
    expect(clampLatitude(40.1792)).toBe(40.1792);
  });

  it('clamps the poles to the projection limit', () => {
    expect(clampLatitude(90)).toBeCloseTo(MAX_LATITUDE, 9);
    expect(clampLatitude(-90)).toBeCloseTo(-MAX_LATITUDE, 9);
  });
});

describe('normalizeLongitude', () => {
  it('leaves longitude inside the range as is', () => {
    expect(normalizeLongitude(44.4991)).toBeCloseTo(44.4991, 9);
  });

  it('wraps across the antimeridian', () => {
    expect(normalizeLongitude(181)).toBeCloseTo(-179, 9);
    expect(normalizeLongitude(-181)).toBeCloseTo(179, 9);
    expect(normalizeLongitude(360)).toBeCloseTo(0, 9);
  });
});

describe('lngLatToTile', () => {
  it('places Yerevan in 12/2554/1547', () => {
    expect(lngLatToTile(YEREVAN, 12)).toEqual({ z: 12, x: 2554, y: 1547 });
  });

  it('puts everything in the single tile at zoom 0', () => {
    expect(lngLatToTile(YEREVAN, 0)).toEqual({ z: 0, x: 0, y: 0 });
    expect(lngLatToTile({ lng: -170, lat: -60 }, 0)).toEqual({ z: 0, x: 0, y: 0 });
  });

  it('puts the prime meridian and the equator on the quadrant boundary', () => {
    expect(lngLatToTile(NULL_ISLAND, 1)).toEqual({ z: 1, x: 1, y: 1 });
  });

  it('maps the north-west corner of the world to tile 0/0', () => {
    expect(lngLatToTile({ lng: -180, lat: MAX_LATITUDE }, 4)).toEqual({ z: 4, x: 0, y: 0 });
  });

  it('stays inside the grid at the poles and the antimeridian', () => {
    const north = lngLatToTile({ lng: 180, lat: 90 }, 5);
    expect(north.x).toBeLessThanOrEqual(31);
    expect(north.y).toBe(0);

    const south = lngLatToTile({ lng: 179.9999, lat: -90 }, 5);
    expect(south.x).toBe(31);
    expect(south.y).toBe(31);
  });

  it('is consistent across zooms: the parent is the child halved', () => {
    const child = lngLatToTile(YEREVAN, 13);
    const parent = lngLatToTile(YEREVAN, 12);
    expect({ x: Math.floor(child.x / 2), y: Math.floor(child.y / 2) }).toEqual({
      x: parent.x,
      y: parent.y,
    });
  });
});

describe('tileToLngLat', () => {
  it('returns the north-west corner of the world for tile 0/0/0', () => {
    const nw = tileToLngLat({ z: 0, x: 0, y: 0 });
    expect(nw.lng).toBe(-180);
    expect(nw.lat).toBeCloseTo(MAX_LATITUDE, 6);
  });

  it('inverts lngLatToTile down to the tile corner', () => {
    const tile = lngLatToTile(YEREVAN, 14);
    const corner = tileToLngLat(tile);
    expect(lngLatToTile(corner, 14)).toEqual(tile);
    expect(corner.lng).toBeLessThanOrEqual(YEREVAN.lng);
    expect(corner.lat).toBeGreaterThanOrEqual(YEREVAN.lat);
  });
});

describe('tileBounds', () => {
  it('covers the whole world at zoom 0', () => {
    const bounds = tileBounds({ z: 0, x: 0, y: 0 });
    expect(bounds.west).toBe(-180);
    expect(bounds.east).toBe(180);
    expect(bounds.north).toBeCloseTo(MAX_LATITUDE, 6);
    expect(bounds.south).toBeCloseTo(-MAX_LATITUDE, 6);
  });

  it('contains the point the tile was derived from', () => {
    const bounds = tileBounds(lngLatToTile(YEREVAN, 12));
    expect(YEREVAN.lng).toBeGreaterThanOrEqual(bounds.west);
    expect(YEREVAN.lng).toBeLessThanOrEqual(bounds.east);
    expect(YEREVAN.lat).toBeGreaterThanOrEqual(bounds.south);
    expect(YEREVAN.lat).toBeLessThanOrEqual(bounds.north);
  });
});

describe('lngLatToMercator', () => {
  it('maps null island to the origin', () => {
    expect(lngLatToMercator(NULL_ISLAND)).toEqual({ x: 0, y: 0 });
  });

  it('stretches the world to half the equator on each axis', () => {
    const east = lngLatToMercator({ lng: 180, lat: 0 });
    expect(east.x).toBeCloseTo(EARTH_CIRCUMFERENCE / 2, 3);

    const north = lngLatToMercator({ lng: 0, lat: MAX_LATITUDE });
    expect(north.y).toBeCloseTo(EARTH_CIRCUMFERENCE / 2, 0);
  });

  it('survives the round trip', () => {
    const back = mercatorToLngLat(lngLatToMercator(YEREVAN));
    expect(back.lng).toBeCloseTo(YEREVAN.lng, 9);
    expect(back.lat).toBeCloseTo(YEREVAN.lat, 9);
  });

  it('sends the northern hemisphere up and the southern one down', () => {
    expect(lngLatToMercator({ lng: 0, lat: 40 }).y).toBeGreaterThan(0);
    expect(lngLatToMercator({ lng: 0, lat: -40 }).y).toBeLessThan(0);
  });
});

describe('metersPerPixel', () => {
  it('gives the classic 156543 m at the equator and zoom 0', () => {
    expect(metersPerPixel(0, 0)).toBeCloseTo(156543.03392, 4);
  });

  it('gives 7.30 m at the latitude of Yerevan and zoom 14', () => {
    expect(metersPerPixel(YEREVAN.lat, 14).toFixed(2)).toBe('7.30');
  });

  it('halves with every next zoom level', () => {
    expect(metersPerPixel(YEREVAN.lat, 15)).toBeCloseTo(metersPerPixel(YEREVAN.lat, 14) / 2, 9);
  });

  it('decreases as latitude grows', () => {
    expect(metersPerPixel(60, 10)).toBeLessThan(metersPerPixel(30, 10));
  });

  it('is symmetric about the equator', () => {
    expect(metersPerPixel(-40.1792, 14)).toBeCloseTo(metersPerPixel(40.1792, 14), 9);
  });

  it('rejects an invalid zoom', () => {
    expect(() => metersPerPixel(0, 31)).toThrow(RangeError);
  });
});
