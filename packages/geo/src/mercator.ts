/**
 * Web Mercator (EPSG:3857): проекция, тайловая сетка XYZ и разрешение.
 */

/** Радиус сферы, на которой определён Web Mercator, в метрах. */
export const EARTH_RADIUS = 6378137;

/** Длина экватора этой сферы, в метрах. */
export const EARTH_CIRCUMFERENCE = 2 * Math.PI * EARTH_RADIUS;

/** Сторона тайла в пикселях. */
export const TILE_SIZE = 256;

/**
 * Широта, на которой мир проекции становится квадратным.
 * Полюса в Web Mercator недостижимы — y уходит в бесконечность.
 */
export const MAX_LATITUDE = 85.0511287798066;

/** Точка на поверхности, градусы WGS84. */
export interface LngLat {
  lng: number;
  lat: number;
}

/** Тайл схемы XYZ: начало отсчёта в северо-западном углу. */
export interface Tile {
  z: number;
  x: number;
  y: number;
}

/** Точка в метрах проекции, начало координат в центре мира. */
export interface MercatorPoint {
  x: number;
  y: number;
}

/** Прямоугольник в градусах. */
export interface Bounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function assertZoom(z: number): void {
  if (!Number.isInteger(z) || z < 0 || z > 30) {
    throw new RangeError(`zoom должен быть целым в диапазоне 0..30, получено: ${z}`);
  }
}

/** Число тайлов по стороне мира на данном зуме. */
export function tilesPerAxis(z: number): number {
  assertZoom(z);
  return 2 ** z;
}

/** Обрезает широту до предела проекции. */
export function clampLatitude(lat: number): number {
  return Math.min(Math.max(lat, -MAX_LATITUDE), MAX_LATITUDE);
}

/** Приводит долготу к полуинтервалу [-180, 180). */
export function normalizeLongitude(lng: number): number {
  const wrapped = ((lng + 180) % 360 + 360) % 360;
  return wrapped - 180;
}

/** Тайл, в который попадает точка на заданном зуме. */
export function lngLatToTile(point: LngLat, z: number): Tile {
  const n = tilesPerAxis(z);
  const lat = clampLatitude(point.lat) * DEG_TO_RAD;

  const rawX = (normalizeLongitude(point.lng) + 180) / 360 * n;
  const rawY = (1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2 * n;

  const last = n - 1;
  return {
    z,
    x: Math.min(Math.max(Math.floor(rawX), 0), last),
    y: Math.min(Math.max(Math.floor(rawY), 0), last),
  };
}

/** Северо-западный угол тайла. */
export function tileToLngLat(tile: Tile): LngLat {
  const n = tilesPerAxis(tile.z);
  return {
    lng: tile.x / n * 360 - 180,
    lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * tile.y / n))) * RAD_TO_DEG,
  };
}

/** Границы тайла в градусах. */
export function tileBounds(tile: Tile): Bounds {
  const nw = tileToLngLat(tile);
  const se = tileToLngLat({ z: tile.z, x: tile.x + 1, y: tile.y + 1 });
  return { west: nw.lng, south: se.lat, east: se.lng, north: nw.lat };
}

/**
 * Проекция точки в метры Web Mercator.
 *
 * Долгота намеренно не заворачивается: проекция линейна по x, а периодичность
 * мира — свойство тайловой сетки, а не самого преобразования. Поэтому lng=180
 * даёт восточный край мира, а не западный.
 *
 * Форма `asinh(tan φ)` эквивалентна `ln(tan(π/4 + φ/2))`, но на экваторе
 * даёт ровный ноль, а не -7e-10.
 */
export function lngLatToMercator(point: LngLat): MercatorPoint {
  const lat = clampLatitude(point.lat) * DEG_TO_RAD;
  return {
    x: EARTH_RADIUS * point.lng * DEG_TO_RAD,
    y: EARTH_RADIUS * Math.asinh(Math.tan(lat)),
  };
}

/** Обратная проекция: метры Web Mercator в градусы. */
export function mercatorToLngLat(point: MercatorPoint): LngLat {
  return {
    lng: point.x / EARTH_RADIUS * RAD_TO_DEG,
    lat: Math.atan(Math.sinh(point.y / EARTH_RADIUS)) * RAD_TO_DEG,
  };
}

/**
 * Сколько метров земной поверхности приходится на один пиксель тайла.
 * Зависит от широты: у экватора масштаб самый крупный.
 */
export function metersPerPixel(lat: number, z: number): number {
  assertZoom(z);
  const clamped = clampLatitude(lat) * DEG_TO_RAD;
  return EARTH_CIRCUMFERENCE * Math.cos(clamped) / (TILE_SIZE * 2 ** z);
}
