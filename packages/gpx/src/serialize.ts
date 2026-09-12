import type { GpxDocument, Track, TrackPoint, Waypoint } from './types';

export const GPX_NAMESPACE = 'http://www.topografix.com/GPX/1/1';

const DEFAULT_CREATOR = 'TrailForge';

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => XML_ESCAPES[character] ?? character);
}

function element(indent: string, tag: string, value: string | number): string {
  return `${indent}<${tag}>${escapeXml(String(value))}</${tag}>`;
}

function coordinateAttributes(point: { lng: number; lat: number }): string {
  return `lat="${String(point.lat)}" lon="${String(point.lng)}"`;
}

function serializeTrackPoint(point: TrackPoint, indent: string): string[] {
  const lines = [`${indent}<trkpt ${coordinateAttributes(point)}>`];

  if (point.ele !== undefined) {
    lines.push(element(`${indent}  `, 'ele', point.ele));
  }

  if (point.time !== undefined) {
    lines.push(element(`${indent}  `, 'time', point.time));
  }

  lines.push(`${indent}</trkpt>`);
  return lines;
}

function serializeTrack(track: Track, indent: string): string[] {
  const lines = [`${indent}<trk>`];

  if (track.name !== undefined) {
    lines.push(element(`${indent}  `, 'name', track.name));
  }

  for (const segment of track.segments) {
    lines.push(`${indent}  <trkseg>`);

    for (const point of segment.points) {
      lines.push(...serializeTrackPoint(point, `${indent}    `));
    }

    lines.push(`${indent}  </trkseg>`);
  }

  lines.push(`${indent}</trk>`);
  return lines;
}

function serializeWaypoint(waypoint: Waypoint, indent: string): string[] {
  const lines = [`${indent}<wpt ${coordinateAttributes(waypoint)}>`];

  if (waypoint.ele !== undefined) {
    lines.push(element(`${indent}  `, 'ele', waypoint.ele));
  }

  if (waypoint.name !== undefined) {
    lines.push(element(`${indent}  `, 'name', waypoint.name));
  }

  if (waypoint.description !== undefined) {
    lines.push(element(`${indent}  `, 'desc', waypoint.description));
  }

  lines.push(`${indent}</wpt>`);
  return lines;
}

export function serializeGpx(document: GpxDocument): string {
  const creator = document.metadata.creator ?? DEFAULT_CREATOR;

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<gpx version="1.1" creator="${escapeXml(creator)}" xmlns="${GPX_NAMESPACE}">`,
  ];

  if (document.metadata.name !== undefined) {
    lines.push('  <metadata>');
    lines.push(element('    ', 'name', document.metadata.name));
    lines.push('  </metadata>');
  }

  for (const waypoint of document.waypoints) {
    lines.push(...serializeWaypoint(waypoint, '  '));
  }

  for (const track of document.tracks) {
    lines.push(...serializeTrack(track, '  '));
  }

  lines.push('</gpx>');
  return `${lines.join('\n')}\n`;
}
