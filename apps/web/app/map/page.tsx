'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const MapCanvas = dynamic(
  () => import('@/features/map/MapCanvas').then((module) => module.MapCanvas),
  {
    ssr: false,
    loading: () => <p style={{ padding: 32 }}>Loading map…</p>,
  },
);

export default function MapPage() {
  return (
    <main style={{ position: 'relative', flex: 1, minHeight: 0 }}>
      <MapCanvas />
      <Link
        href="/"
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 1,
          padding: '6px 10px',
          borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.9)',
          color: '#171717',
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        ← TrailForge
      </Link>
    </main>
  );
}
