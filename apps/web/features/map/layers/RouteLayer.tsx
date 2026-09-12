'use client';

import type { GeoJSONSource } from 'maplibre-gl';
import { useEffect } from 'react';

import { selectRouteBounds, selectRouteTrack } from '@/features/route-builder/routeSlice';
import { useAppSelector } from '@/store/hooks';

import { useMap } from '../MapProvider';

const SOURCE_ID = 'route';
const LAYER_ID = 'route-line';

const EMPTY_DATA = { type: 'FeatureCollection', features: [] } as const;

function toGeoJson(segments: { points: { lng: number; lat: number }[] }[]) {
  const coordinates = segments
    .filter((segment) => segment.points.length > 1)
    .map((segment) => segment.points.map((point) => [point.lng, point.lat]));

  if (coordinates.length === 0) {
    return EMPTY_DATA;
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: { type: 'MultiLineString', coordinates },
      },
    ],
  } as const;
}

export function RouteLayer() {
  const { mapRef, ready } = useMap();
  const track = useAppSelector(selectRouteTrack);
  const bounds = useAppSelector(selectRouteBounds);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !ready) {
      return;
    }

    map.addSource(SOURCE_ID, { type: 'geojson', data: EMPTY_DATA });
    map.addLayer({
      id: LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#e2483d', 'line-width': 3 },
    });

    return () => {
      if (map.getLayer(LAYER_ID) !== undefined) {
        map.removeLayer(LAYER_ID);
      }

      if (map.getSource(SOURCE_ID) !== undefined) {
        map.removeSource(SOURCE_ID);
      }
    };
  }, [mapRef, ready]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !ready) {
      return;
    }

    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(toGeoJson(track?.segments ?? []));
  }, [mapRef, ready, track]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !ready || !bounds) {
      return;
    }

    map.fitBounds(bounds, { padding: 48, duration: 600 });
  }, [mapRef, ready, bounds]);

  return null;
}
