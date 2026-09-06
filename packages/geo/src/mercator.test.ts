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
  it('даёт один тайл на нулевом зуме', () => {
    expect(tilesPerAxis(0)).toBe(1);
  });

  it('удваивается с каждым зумом', () => {
    expect(tilesPerAxis(1)).toBe(2);
    expect(tilesPerAxis(12)).toBe(4096);
  });

  it('отвергает дробный и отрицательный зум', () => {
    expect(() => tilesPerAxis(1.5)).toThrow(RangeError);
    expect(() => tilesPerAxis(-1)).toThrow(RangeError);
  });
});

describe('clampLatitude', () => {
  it('не трогает широты внутри диапазона', () => {
    expect(clampLatitude(40.1792)).toBe(40.1792);
  });

  it('обрезает полюса до предела проекции', () => {
    expect(clampLatitude(90)).toBeCloseTo(MAX_LATITUDE, 9);
    expect(clampLatitude(-90)).toBeCloseTo(-MAX_LATITUDE, 9);
  });
});

describe('normalizeLongitude', () => {
  it('оставляет долготу внутри диапазона как есть', () => {
    expect(normalizeLongitude(44.4991)).toBeCloseTo(44.4991, 9);
  });

  it('заворачивает переход через антимеридиан', () => {
    expect(normalizeLongitude(181)).toBeCloseTo(-179, 9);
    expect(normalizeLongitude(-181)).toBeCloseTo(179, 9);
    expect(normalizeLongitude(360)).toBeCloseTo(0, 9);
  });
});

describe('lngLatToTile', () => {
  it('кладёт Ереван в 12/2554/1547', () => {
    expect(lngLatToTile(YEREVAN, 12)).toEqual({ z: 12, x: 2554, y: 1547 });
  });

  it('на нулевом зуме всё попадает в единственный тайл', () => {
    expect(lngLatToTile(YEREVAN, 0)).toEqual({ z: 0, x: 0, y: 0 });
    expect(lngLatToTile({ lng: -170, lat: -60 }, 0)).toEqual({ z: 0, x: 0, y: 0 });
  });

  it('ставит нулевой меридиан и экватор на границу квадрантов', () => {
    expect(lngLatToTile(NULL_ISLAND, 1)).toEqual({ z: 1, x: 1, y: 1 });
  });

  it('северо-западный угол мира — это тайл 0/0', () => {
    expect(lngLatToTile({ lng: -180, lat: MAX_LATITUDE }, 4)).toEqual({ z: 4, x: 0, y: 0 });
  });

  it('не выходит за сетку на полюсах и антимеридиане', () => {
    const north = lngLatToTile({ lng: 180, lat: 90 }, 5);
    expect(north.x).toBeLessThanOrEqual(31);
    expect(north.y).toBe(0);

    const south = lngLatToTile({ lng: 179.9999, lat: -90 }, 5);
    expect(south.x).toBe(31);
    expect(south.y).toBe(31);
  });

  it('согласован по зумам: родитель это ребёнок, делённый пополам', () => {
    const child = lngLatToTile(YEREVAN, 13);
    const parent = lngLatToTile(YEREVAN, 12);
    expect({ x: Math.floor(child.x / 2), y: Math.floor(child.y / 2) }).toEqual({
      x: parent.x,
      y: parent.y,
    });
  });
});

describe('tileToLngLat', () => {
  it('возвращает северо-западный угол мира для тайла 0/0/0', () => {
    const nw = tileToLngLat({ z: 0, x: 0, y: 0 });
    expect(nw.lng).toBe(-180);
    expect(nw.lat).toBeCloseTo(MAX_LATITUDE, 6);
  });

  it('обратна lngLatToTile с точностью до угла тайла', () => {
    const tile = lngLatToTile(YEREVAN, 14);
    const corner = tileToLngLat(tile);
    expect(lngLatToTile(corner, 14)).toEqual(tile);
    expect(corner.lng).toBeLessThanOrEqual(YEREVAN.lng);
    expect(corner.lat).toBeGreaterThanOrEqual(YEREVAN.lat);
  });
});

describe('tileBounds', () => {
  it('покрывает весь мир на нулевом зуме', () => {
    const bounds = tileBounds({ z: 0, x: 0, y: 0 });
    expect(bounds.west).toBe(-180);
    expect(bounds.east).toBe(180);
    expect(bounds.north).toBeCloseTo(MAX_LATITUDE, 6);
    expect(bounds.south).toBeCloseTo(-MAX_LATITUDE, 6);
  });

  it('содержит точку, из которой тайл получен', () => {
    const bounds = tileBounds(lngLatToTile(YEREVAN, 12));
    expect(YEREVAN.lng).toBeGreaterThanOrEqual(bounds.west);
    expect(YEREVAN.lng).toBeLessThanOrEqual(bounds.east);
    expect(YEREVAN.lat).toBeGreaterThanOrEqual(bounds.south);
    expect(YEREVAN.lat).toBeLessThanOrEqual(bounds.north);
  });
});

describe('lngLatToMercator', () => {
  it('ставит нулевую точку в начало координат', () => {
    expect(lngLatToMercator(NULL_ISLAND)).toEqual({ x: 0, y: 0 });
  });

  it('растягивает мир до половины экватора по каждой оси', () => {
    const east = lngLatToMercator({ lng: 180, lat: 0 });
    expect(east.x).toBeCloseTo(EARTH_CIRCUMFERENCE / 2, 3);

    const north = lngLatToMercator({ lng: 0, lat: MAX_LATITUDE });
    expect(north.y).toBeCloseTo(EARTH_CIRCUMFERENCE / 2, 0);
  });

  it('переживает обратное преобразование', () => {
    const back = mercatorToLngLat(lngLatToMercator(YEREVAN));
    expect(back.lng).toBeCloseTo(YEREVAN.lng, 9);
    expect(back.lat).toBeCloseTo(YEREVAN.lat, 9);
  });

  it('северное полушарие уходит вверх, южное вниз', () => {
    expect(lngLatToMercator({ lng: 0, lat: 40 }).y).toBeGreaterThan(0);
    expect(lngLatToMercator({ lng: 0, lat: -40 }).y).toBeLessThan(0);
  });
});

describe('metersPerPixel', () => {
  it('на экваторе и нулевом зуме даёт классические 156543 м', () => {
    expect(metersPerPixel(0, 0)).toBeCloseTo(156543.03392, 4);
  });

  it('на широте Еревана и зуме 14 даёт 7.30 м', () => {
    expect(metersPerPixel(YEREVAN.lat, 14).toFixed(2)).toBe('7.30');
  });

  it('уменьшается вдвое на каждом следующем зуме', () => {
    expect(metersPerPixel(YEREVAN.lat, 15)).toBeCloseTo(metersPerPixel(YEREVAN.lat, 14) / 2, 9);
  });

  it('падает с ростом широты', () => {
    expect(metersPerPixel(60, 10)).toBeLessThan(metersPerPixel(30, 10));
  });

  it('симметричен относительно экватора', () => {
    expect(metersPerPixel(-40.1792, 14)).toBeCloseTo(metersPerPixel(40.1792, 14), 9);
  });

  it('отвергает некорректный зум', () => {
    expect(() => metersPerPixel(0, 31)).toThrow(RangeError);
  });
});
