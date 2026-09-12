import { XMLParser } from 'fast-xml-parser';
import type { LngLat } from '@trailforge/geo';

import type { GpxDocument, Track, TrackPoint, TrackSegment, Waypoint } from './types';

export class GpxParseError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'GpxParseError';

    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

const ARRAY_PATHS = new Set([
  'gpx.trk',
  'gpx.trk.trkseg',
  'gpx.trk.trkseg.trkpt',
  'gpx.wpt',
]);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  isArray: (_tagName, jpath) => typeof jpath === 'string' && ARRAY_PATHS.has(jpath),
});

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function readText(value: unknown): string | undefined {
  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readNumber(value: unknown): number | undefined {
  const text = readText(value);

  if (text === undefined) {
    return undefined;
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readCoordinates(node: Record<string, unknown>): LngLat | undefined {
  const lat = readNumber(node['@_lat']);
  const lng = readNumber(node['@_lon']);

  if (lat === undefined || lng === undefined) {
    return undefined;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return undefined;
  }

  return { lng, lat };
}

function readTrackPoint(value: unknown): TrackPoint | undefined {
  const node = asRecord(value);

  if (!node) {
    return undefined;
  }

  const coordinates = readCoordinates(node);

  if (!coordinates) {
    return undefined;
  }

  const ele = readNumber(node['ele']);
  const time = readText(node['time']);

  return {
    ...coordinates,
    ...(ele !== undefined ? { ele } : {}),
    ...(time !== undefined ? { time } : {}),
  };
}

function readSegment(value: unknown): TrackSegment {
  const node = asRecord(value);

  const points = asArray(node?.['trkpt'])
    .map(readTrackPoint)
    .filter((point): point is TrackPoint => point !== undefined);

  return { points };
}

function readTrack(value: unknown): Track {
  const node = asRecord(value);
  const name = readText(node?.['name']);

  return {
    ...(name !== undefined ? { name } : {}),
    segments: asArray(node?.['trkseg']).map(readSegment),
  };
}

function readWaypoint(value: unknown): Waypoint | undefined {
  const node = asRecord(value);

  if (!node) {
    return undefined;
  }

  const coordinates = readCoordinates(node);

  if (!coordinates) {
    return undefined;
  }

  const name = readText(node['name']);
  const description = readText(node['desc']);
  const ele = readNumber(node['ele']);

  return {
    ...coordinates,
    ...(name !== undefined ? { name } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(ele !== undefined ? { ele } : {}),
  };
}

export function parseGpx(xml: string): GpxDocument {
  let parsed: unknown;

  try {
    parsed = parser.parse(xml);
  } catch (error) {
    throw new GpxParseError('The file is not well-formed XML', error);
  }

  const root = asRecord(parsed);

  if (!root || !('gpx' in root)) {
    throw new GpxParseError('The file has no <gpx> root element, so it is not a GPX document');
  }

  const gpx = asRecord(root['gpx']) ?? {};
  const metadata = asRecord(gpx['metadata']);
  const name = readText(metadata?.['name']);
  const creator = readText(gpx['@_creator']);

  return {
    metadata: {
      ...(name !== undefined ? { name } : {}),
      ...(creator !== undefined ? { creator } : {}),
    },
    tracks: asArray(gpx['trk']).map(readTrack),
    waypoints: asArray(gpx['wpt'])
      .map(readWaypoint)
      .filter((waypoint): waypoint is Waypoint => waypoint !== undefined),
  };
}
