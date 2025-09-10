import type { NextConfig } from "next";

// Docker environment enforcement check
if (typeof window === 'undefined') {
  // Only run on server side
  try {
    const { enforceDockerEnvironment } = require('./lib/docker-check');
    enforceDockerEnvironment();
  } catch (error) {
    console.warn('Docker check module not available during build:', error);
  }
}

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: ['1001stories.seedsofempowerment.org', 'seedsofempowerment.org', 'localhost'],
    unoptimized: true, // Disable image optimization to prevent errors with missing images
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    typedRoutes: false,
  },
  serverExternalPackages: ['sharp'],
  async headers() {
    return [
      {
        source: '/books/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; media-src 'self' blob: data:; connect-src 'self' https://api.openai.com",
          },
        ],
      },
    ];
  },
}

export default nextConfig;
