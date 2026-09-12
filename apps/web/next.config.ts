import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@trailforge/geo', '@trailforge/gpx'],
};

export default nextConfig;
