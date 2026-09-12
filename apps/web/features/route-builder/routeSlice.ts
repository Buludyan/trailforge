import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { lineLength } from '@trailforge/geo';
import type { Track } from '@trailforge/gpx';

export type RouteBounds = [west: number, south: number, east: number, north: number];

export interface ImportedTrack {
  track: Track;
  fileName: string;
}

export interface RouteState {
  track: Track | null;
  fileName: string | null;
}

const initialState: RouteState = {
  track: null,
  fileName: null,
};

const routeSlice = createSlice({
  name: 'route',
  initialState,
  reducers: {
    trackImported(state, action: PayloadAction<ImportedTrack>) {
      state.track = action.payload.track;
      state.fileName = action.payload.fileName;
    },
    trackCleared(state) {
      state.track = null;
      state.fileName = null;
    },
  },
});

export const { trackCleared, trackImported } = routeSlice.actions;

export const routeReducer = routeSlice.reducer;

export const selectRouteTrack = (state: { route: RouteState }): Track | null => state.route.track;

export const selectRouteFileName = (state: { route: RouteState }): string | null =>
  state.route.fileName;

export const selectRouteLength = createSelector([selectRouteTrack], (track): number => {
  if (!track) {
    return 0;
  }

  return track.segments.reduce((total, segment) => total + lineLength(segment.points), 0);
});

export const selectRoutePointCount = createSelector([selectRouteTrack], (track): number => {
  if (!track) {
    return 0;
  }

  return track.segments.reduce((total, segment) => total + segment.points.length, 0);
});

export const selectRouteBounds = createSelector([selectRouteTrack], (track): RouteBounds | null => {
  if (!track) {
    return null;
  }

  let west = Number.POSITIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;

  for (const segment of track.segments) {
    for (const point of segment.points) {
      west = Math.min(west, point.lng);
      south = Math.min(south, point.lat);
      east = Math.max(east, point.lng);
      north = Math.max(north, point.lat);
    }
  }

  if (!Number.isFinite(west) || !Number.isFinite(south)) {
    return null;
  }

  return [west, south, east, north];
});
