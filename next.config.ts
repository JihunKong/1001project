import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: ['1001stories.seedsofempowerment.org', 'seedsofempowerment.org'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig;
