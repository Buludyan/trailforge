import { lngLatToTile, metersPerPixel } from '@trailforge/geo';

const YEREVAN = { lng: 44.4991, lat: 40.1792 };

export default function Home() {
  const tile = lngLatToTile(YEREVAN, 12);

  return (
    <main style={{ padding: 32, fontFamily: 'ui-monospace, monospace' }}>
      <h1>TrailForge</h1>
      <p>
        tile: {tile.z}/{tile.x}/{tile.y}
      </p>
      <p>{metersPerPixel(YEREVAN.lat, 14).toFixed(2)} м/пиксель на z=14</p>
    </main>
  );
}
