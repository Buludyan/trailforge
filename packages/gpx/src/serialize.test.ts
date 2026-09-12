import { describe, expect, it } from 'vitest';

import { parseGpx } from './parse';
import { GPX_NAMESPACE, serializeGpx } from './serialize';
import type { GpxDocument } from './types';

const EMPTY: GpxDocument = { metadata: {}, tracks: [], waypoints: [] };

describe('serializeGpx structure', () => {
  it('writes an XML declaration and a GPX 1.1 root element', () => {
    const xml = serializeGpx(EMPTY);

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(true);
    expect(xml).toContain('<gpx version="1.1"');
    expect(xml).toContain(`xmlns="${GPX_NAMESPACE}"`);
    expect(xml.trimEnd().endsWith('</gpx>')).toBe(true);
  });

  it('falls back to TrailForge as the creator', () => {
    expect(serializeGpx(EMPTY)).toContain('creator="TrailForge"');
  });

  it('keeps the original creator when the document has one', () => {
    expect(serializeGpx({ ...EMPTY, metadata: { creator: 'Garmin Connect' } })).toContain(
      'creator="Garmin Connect"',
    );
  });

  it('omits ele and time for points that have none', () => {
    const xml = serializeGpx({
      ...EMPTY,
      tracks: [{ segments: [{ points: [{ lng: 44.5, lat: 40.1 }] }] }],
    });

    expect(xml).toContain('<trkpt lat="40.1" lon="44.5">');
    expect(xml).not.toContain('<ele>');
    expect(xml).not.toContain('<time>');
  });

  it('writes ele before time, as the GPX schema requires', () => {
    const xml = serializeGpx({
      ...EMPTY,
      tracks: [
        {
          segments: [{ points: [{ lng: 44.5, lat: 40.1, ele: 1200, time: '2024-01-01T00:00:00Z' }] }],
        },
      ],
    });

    expect(xml.indexOf('<ele>')).toBeLessThan(xml.indexOf('<time>'));
  });

  it('writes one trkseg per segment', () => {
    const xml = serializeGpx({
      ...EMPTY,
      tracks: [
        {
          segments: [
            { points: [{ lng: 44.5, lat: 40.1 }] },
            { points: [{ lng: 44.6, lat: 40.2 }] },
          ],
        },
      ],
    });

    expect(xml.match(/<trkseg>/g)).toHaveLength(2);
  });
});

describe('serializeGpx escaping', () => {
  it('escapes XML special characters in names', () => {
    const xml = serializeGpx({
      ...EMPTY,
      tracks: [{ name: 'Kari <lake> & "ridge"', segments: [] }],
    });

    expect(xml).toContain('<name>Kari &lt;lake&gt; &amp; &quot;ridge&quot;</name>');
    expect(xml).not.toContain('<name>Kari <lake>');
  });

  it('escapes special characters in the creator attribute', () => {
    expect(serializeGpx({ ...EMPTY, metadata: { creator: 'a & b' } })).toContain(
      'creator="a &amp; b"',
    );
  });

  it('produces a document that survives being parsed back', () => {
    const document: GpxDocument = {
      metadata: { name: 'Route <1> & "2"', creator: 'TrailForge' },
      tracks: [{ name: 'Trail & path', segments: [{ points: [{ lng: 44.5, lat: 40.1 }] }] }],
      waypoints: [{ lng: 44.5, lat: 40.1, name: '<summit>', description: 'a & b' }],
    };

    expect(parseGpx(serializeGpx(document))).toEqual(document);
  });
});

describe('serializeGpx numbers', () => {
  it('writes coordinates without losing precision', () => {
    const point = { lng: 44.186123456, lat: 40.472987654 };
    const parsed = parseGpx(serializeGpx({ ...EMPTY, tracks: [{ segments: [{ points: [point] }] }] }));

    expect(parsed.tracks[0]?.segments[0]?.points[0]).toEqual(point);
  });

  it('writes negative coordinates correctly', () => {
    const point = { lng: -73.9857, lat: -33.8688 };
    const parsed = parseGpx(serializeGpx({ ...EMPTY, tracks: [{ segments: [{ points: [point] }] }] }));

    expect(parsed.tracks[0]?.segments[0]?.points[0]).toEqual(point);
  });
});
