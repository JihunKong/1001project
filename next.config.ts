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
    dirs: [],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    typedRoutes: false,
  },
  serverExternalPackages: ['sharp'],
  // Disable Next.js default security headers that include CSP
  poweredByHeader: false,
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
      // CSP disabled for MVP development - will be re-enabled post-MVP
      // See SECURITY_REQUIREMENTS.md for post-MVP implementation plan
    ];
  },
}

export default nextConfig;
