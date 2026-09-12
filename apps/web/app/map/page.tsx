'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import { GpxImportButton } from '@/features/gpx/GpxImportButton';
import { RouteLayer } from '@/features/map/layers/RouteLayer';
import {
  selectRouteFileName,
  selectRouteLength,
  selectRoutePointCount,
  selectRouteTrack,
} from '@/features/route-builder/routeSlice';
import { useAppSelector } from '@/store/hooks';

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

const MapCanvas = dynamic(
  () => import('@/features/map/MapCanvas').then((module) => module.MapCanvas),
  {
    ssr: false,
    loading: () => <p style={{ padding: 32 }}>Loading map…</p>,
  },
);

export default function MapPage() {
  const track = useAppSelector(selectRouteTrack);
  const fileName = useAppSelector(selectRouteFileName);
  const length = useAppSelector(selectRouteLength);
  const pointCount = useAppSelector(selectRoutePointCount);

  return (
    <main style={{ position: 'relative', flex: 1, minHeight: 0 }}>
      <MapCanvas>
        <RouteLayer />
      </MapCanvas>

      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: 12,
          borderRadius: 6,
          background: 'rgba(255, 255, 255, 0.92)',
          color: '#171717',
          fontFamily: 'ui-monospace, monospace',
          fontSize: 13,
        }}
      >
        <Link href="/">← TrailForge</Link>
        <GpxImportButton />

        {track ? (
          <div>
            <div style={{ fontWeight: 700 }}>{track.name ?? fileName}</div>
            <div>{(length / 1000).toFixed(2)} km</div>
            <div>
              {plural(pointCount, 'point')} · {plural(track.segments.length, 'segment')}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
