'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';

import { MapProvider } from './MapProvider';
import { useMapInstance } from './useMapInstance';

export function MapCanvas({ children }: { children?: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mapRef, ready } = useMapInstance(containerRef);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      <MapProvider mapRef={mapRef} ready={ready}>
        {ready ? children : null}
      </MapProvider>
    </div>
  );
}
