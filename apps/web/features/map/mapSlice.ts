import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { LngLat } from '@trailforge/geo';

export const DEFAULT_BASEMAP =
  process.env.NEXT_PUBLIC_BASEMAP_STYLE ?? 'https://demotiles.maplibre.org/style.json';

export interface Viewport {
  center: LngLat;
  zoom: number;
  bearing: number;
  pitch: number;
}

export type LayerId = 'trails' | 'route' | 'waypoints' | 'hillshade';

export interface MapState {
  viewport: Viewport;
  visibleLayers: Record<LayerId, boolean>;
  basemap: string;
}

const initialState: MapState = {
  viewport: {
    center: { lng: 44.9, lat: 40.3 },
    zoom: 7,
    bearing: 0,
    pitch: 0,
  },
  visibleLayers: {
    trails: true,
    route: true,
    waypoints: true,
    hillshade: false,
  },
  basemap: DEFAULT_BASEMAP,
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    viewportChanged(state, action: PayloadAction<Viewport>) {
      state.viewport = action.payload;
    },
    layerToggled(state, action: PayloadAction<LayerId>) {
      state.visibleLayers[action.payload] = !state.visibleLayers[action.payload];
    },
    basemapChanged(state, action: PayloadAction<string>) {
      state.basemap = action.payload;
    },
  },
});

export const { basemapChanged, layerToggled, viewportChanged } = mapSlice.actions;

export const mapReducer = mapSlice.reducer;

export const selectViewport = (state: { map: MapState }): Viewport => state.map.viewport;

export const selectVisibleLayers = (state: { map: MapState }): Record<LayerId, boolean> =>
  state.map.visibleLayers;

export const selectBasemap = (state: { map: MapState }): string => state.map.basemap;
