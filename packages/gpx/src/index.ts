export type {
  GpxDocument,
  GpxMetadata,
  Track,
  TrackPoint,
  TrackSegment,
  Waypoint,
} from './types';

export { GpxParseError, parseGpx } from './parse';

export { GPX_NAMESPACE, serializeGpx } from './serialize';
