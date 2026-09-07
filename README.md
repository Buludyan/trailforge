# TrailForge

A hiking route planner for regions with thin cartographic coverage — Armenia,
Georgia, the Caucasus. Terrain-aware routing, elevation profiles, interactive
hillshade, offline mode.

## Layout

- `apps/web` — Next.js application (App Router)
- `packages/geo` — Web Mercator projection, tile math, geodesy

## Development

    pnpm install
    pnpm --filter web dev
    pnpm --filter @trailforge/geo test

Requirements: Node.js >= 20.9, pnpm >= 9.
