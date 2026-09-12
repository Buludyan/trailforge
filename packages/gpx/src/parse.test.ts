import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { GpxParseError, parseGpx } from './parse';
import { serializeGpx } from './serialize';

function fixture(name: string): string {
  return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
}

const SIMPLE = fixture('simple.gpx');
const NO_ELEVATION = fixture('no-elevation.gpx');
const GARMIN = fixture('garmin-extensions.gpx');

describe('parseGpx metadata', () => {
  it('reads the document name and creator', () => {
    const document = parseGpx(SIMPLE);

    expect(document.metadata.name).toBe('Aragats south summit');
    expect(document.metadata.creator).toBe('TrailForge fixture');
  });

  it('leaves metadata empty when the file has none', () => {
    const document = parseGpx(NO_ELEVATION);

    expect(document.metadata.name).toBeUndefined();
    expect(document.metadata.creator).toBe('TrailForge fixture');
  });
});

describe('parseGpx tracks', () => {
  it('reads the track name', () => {
    expect(parseGpx(SIMPLE).tracks[0]?.name).toBe('Aragats south summit');
  });

  it('keeps every trkseg as a separate segment', () => {
    const track = parseGpx(SIMPLE).tracks[0];

    expect(track?.segments).toHaveLength(2);
    expect(track?.segments[0]?.points).toHaveLength(3);
    expect(track?.segments[1]?.points).toHaveLength(2);
  });

  it('reads coordinates as numbers, not strings', () => {
    const point = parseGpx(SIMPLE).tracks[0]?.segments[0]?.points[0];

    expect(point).toEqual({
      lng: 44.1861,
      lat: 40.4728,
      ele: 3190,
      time: '2024-08-17T04:32:11Z',
    });
  });

  it('keeps a single trkseg as an array of one', () => {
    expect(parseGpx(NO_ELEVATION).tracks[0]?.segments).toHaveLength(1);
  });

  it('omits ele and time when the file has none', () => {
    const point = parseGpx(NO_ELEVATION).tracks[0]?.segments[0]?.points[0];

    expect(point).toEqual({ lng: 44.8631, lat: 40.7405 });
    expect(point?.ele).toBeUndefined();
    expect(point?.time).toBeUndefined();
  });
});

describe('parseGpx waypoints', () => {
  it('reads waypoints with their optional fields', () => {
    const document = parseGpx(SIMPLE);

    expect(document.waypoints).toHaveLength(2);
    expect(document.waypoints[0]).toEqual({
      lng: 44.1861,
      lat: 40.4728,
      ele: 3190,
      name: 'Kari Lake trailhead',
      description: 'Parking and start of the ridge path',
    });
    expect(document.waypoints[1]).toEqual({
      lng: 44.198,
      lat: 40.4879,
      name: 'South summit',
    });
  });

  it('returns an empty list when the file has no waypoints', () => {
    expect(parseGpx(NO_ELEVATION).waypoints).toEqual([]);
  });
});

describe('parseGpx vendor extensions', () => {
  it('parses Garmin files and ignores their extension elements', () => {
    const document = parseGpx(GARMIN);
    const points = document.tracks[0]?.segments[0]?.points;

    expect(document.metadata.creator).toBe('Garmin Connect');
    expect(points).toHaveLength(3);
    expect(points?.[0]).toEqual({
      lng: 44.8181,
      lat: 40.1406,
      ele: 1712,
      time: '2024-06-02T06:15:00Z',
    });
  });
});

describe('parseGpx malformed input', () => {
  it('throws on a truncated tag', () => {
    expect(() => parseGpx('<gpx version="1.1"><trk><trkseg><trkpt lat="40" lon="44"')).toThrow(
      GpxParseError,
    );
  });

  it('throws when the root element is not gpx', () => {
    expect(() => parseGpx('<kml><Placemark /></kml>')).toThrow(GpxParseError);
  });

  it('throws on text that is not XML at all', () => {
    expect(() => parseGpx('just some text')).toThrow(GpxParseError);
  });

  it('throws on an empty string', () => {
    expect(() => parseGpx('')).toThrow(GpxParseError);
  });

  it('reports the failure as GpxParseError with a readable message', () => {
    expect(() => parseGpx('<kml />')).toThrow(/not a GPX document/);
  });
});

describe('parseGpx degenerate documents', () => {
  it('accepts a gpx document with no content', () => {
    const document = parseGpx('<gpx version="1.1" />');

    expect(document.tracks).toEqual([]);
    expect(document.waypoints).toEqual([]);
  });

  it('accepts a track with no segments', () => {
    const document = parseGpx('<gpx version="1.1"><trk><name>Empty</name></trk></gpx>');

    expect(document.tracks).toHaveLength(1);
    expect(document.tracks[0]).toEqual({ name: 'Empty', segments: [] });
  });

  it('accepts a segment with no points', () => {
    const document = parseGpx('<gpx version="1.1"><trk><trkseg /></trk></gpx>');

    expect(document.tracks[0]?.segments).toEqual([{ points: [] }]);
  });

  it('skips points whose coordinates are missing or out of range', () => {
    const document = parseGpx(
      '<gpx version="1.1"><trk><trkseg>' +
        '<trkpt lat="40.1" lon="44.5" />' +
        '<trkpt lon="44.5" />' +
        '<trkpt lat="120" lon="44.5" />' +
        '<trkpt lat="40.2" lon="200" />' +
        '<trkpt lat="not-a-number" lon="44.5" />' +
        '</trkseg></trk></gpx>',
    );

    expect(document.tracks[0]?.segments[0]?.points).toEqual([{ lng: 44.5, lat: 40.1 }]);
  });
});

describe('parseGpx and serializeGpx round trip', () => {
  it('preserves a document with elevations, times and waypoints', () => {
    const original = parseGpx(SIMPLE);

    expect(parseGpx(serializeGpx(original))).toEqual(original);
  });

  it('preserves a document without elevations', () => {
    const original = parseGpx(NO_ELEVATION);

    expect(parseGpx(serializeGpx(original))).toEqual(original);
  });

  it('drops vendor extensions but keeps the geometry', () => {
    const original = parseGpx(GARMIN);

    expect(parseGpx(serializeGpx(original))).toEqual(original);
  });
});
