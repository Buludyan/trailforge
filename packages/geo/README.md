# @trailforge/geo

Web Mercator projection, tile math and spherical geodesy.

The package ships **raw TypeScript** — there is no build step. Consumers must run
it through their own compiler (for Next.js that means `transpilePackages`).

## Modules

- `mercator` — coordinates to tiles and projection metres, resolution per pixel
- `distance` — distances, bearings and track length on a sphere

## Conventions

- Coordinates are `{ lng, lat }` objects in degrees, WGS84.
- Tiles follow the XYZ scheme (OSM/Google), origin in the north-west corner.
- Distances are metres, angles are degrees.
