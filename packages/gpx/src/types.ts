import type { LngLat } from '@trailforge/geo';

export interface TrackPoint extends LngLat {
  ele?: number;
  time?: string;
}

export interface TrackSegment {
  points: TrackPoint[];
}

export interface Track {
  name?: string;
  segments: TrackSegment[];
}

export interface Waypoint extends LngLat {
  name?: string;
  description?: string;
  ele?: number;
}

export interface GpxMetadata {
  name?: string;
  creator?: string;
}

export interface GpxDocument {
  metadata: GpxMetadata;
  tracks: Track[];
  waypoints: Waypoint[];
}
