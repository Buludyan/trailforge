'use client';

import { createContext, useContext, useMemo } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { ReactNode, RefObject } from 'react';

export interface MapContextValue {
  mapRef: RefObject<MapLibreMap | null>;
  ready: boolean;
}

const MapContext = createContext<MapContextValue | null>(null);

export function MapProvider({
  mapRef,
  ready,
  children,
}: MapContextValue & { children: ReactNode }) {
  const value = useMemo<MapContextValue>(() => ({ mapRef, ready }), [mapRef, ready]);

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMap(): MapContextValue {
  const context = useContext(MapContext);

  if (!context) {
    throw new Error('useMap must be called inside <MapProvider>');
  }

  return context;
}
