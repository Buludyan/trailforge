import type { LngLat } from './mercator';

export const MEAN_EARTH_RADIUS = 6371008.8;

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export function haversineDistance(a: LngLat, b: LngLat): number {
  const lat1 = a.lat * DEG_TO_RAD;
  const lat2 = b.lat * DEG_TO_RAD;
  const dLat = lat2 - lat1;
  const dLng = (b.lng - a.lng) * DEG_TO_RAD;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * MEAN_EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function initialBearing(a: LngLat, b: LngLat): number {
  const lat1 = a.lat * DEG_TO_RAD;
  const lat2 = b.lat * DEG_TO_RAD;
  const dLng = (b.lng - a.lng) * DEG_TO_RAD;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return (Math.atan2(y, x) * RAD_TO_DEG + 360) % 360;
}

export function destination(origin: LngLat, bearing: number, distance: number): LngLat {
  const angular = distance / MEAN_EARTH_RADIUS;
  const theta = bearing * DEG_TO_RAD;
  const lat1 = origin.lat * DEG_TO_RAD;
  const lng1 = origin.lng * DEG_TO_RAD;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(theta),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(theta) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    );

  return {
    lng: ((lng2 * RAD_TO_DEG + 540) % 360) - 180,
    lat: lat2 * RAD_TO_DEG,
  };
}

export function lineLength(points: readonly LngLat[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const current = points[i];
    if (prev === undefined || current === undefined) continue;
    total += haversineDistance(prev, current);
  }
  return total;
}
