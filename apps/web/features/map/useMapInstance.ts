'use client';

import { Map as MapLibreMap, addProtocol, setWorkerUrl } from 'maplibre-gl';
import type { ErrorEvent as MapErrorEvent } from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { useAppDispatch, useAppStore } from '@/store/hooks';

import { viewportChanged } from './mapSlice';
import type { Viewport } from './mapSlice';

const VIEWPORT_DEBOUNCE_MS = 200;

const MAPLIBRE_WORKER_URL = '/maplibre/maplibre-gl-worker.mjs';

let mapLibreConfigured = false;

function configureMapLibre(): void {
  if (mapLibreConfigured) {
    return;
  }

  setWorkerUrl(MAPLIBRE_WORKER_URL);
  addProtocol('pmtiles', new Protocol().tile);
  mapLibreConfigured = true;
}

function readViewport(map: MapLibreMap): Viewport {
  const center = map.getCenter();

  return {
    center: { lng: center.lng, lat: center.lat },
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  };
}

export interface MapInstance {
  mapRef: RefObject<MapLibreMap | null>;
  ready: boolean;
}

export function useMapInstance(container: RefObject<HTMLDivElement | null>): MapInstance {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const mapRef = useRef<MapLibreMap | null>(null);
  const viewportRef = useRef<Viewport | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = container.current;

    if (!element) {
      return;
    }

    configureMapLibre();

    const { basemap, viewport } = store.getState().map;
    viewportRef.current = viewport;

    const map = new MapLibreMap({
      container: element,
      style: basemap,
      center: [viewport.center.lng, viewport.center.lat],
      zoom: viewport.zoom,
      bearing: viewport.bearing,
      pitch: viewport.pitch,
    });

    mapRef.current = map;

    let commitTimer: ReturnType<typeof setTimeout> | undefined;

    const handleLoad = () => {
      setReady(true);
    };

    const handleError = (event: MapErrorEvent) => {
      console.error('[map]', event.error);
    };

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });

    resizeObserver.observe(element);

    const handleMove = () => {
      viewportRef.current = readViewport(map);

      if (commitTimer !== undefined) {
        clearTimeout(commitTimer);
      }

      commitTimer = setTimeout(() => {
        commitTimer = undefined;

        if (viewportRef.current) {
          dispatch(viewportChanged(viewportRef.current));
        }
      }, VIEWPORT_DEBOUNCE_MS);
    };

    map.on('load', handleLoad);
    map.on('move', handleMove);
    map.on('error', handleError);

    return () => {
      if (commitTimer !== undefined) {
        clearTimeout(commitTimer);
      }

      resizeObserver.disconnect();

      map.off('load', handleLoad);
      map.off('move', handleMove);
      map.off('error', handleError);
      map.remove();

      mapRef.current = null;
      setReady(false);
    };
  }, [container, dispatch, store]);

  return { mapRef, ready };
}
