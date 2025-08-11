import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: ['1001stories.seedsofempowerment.org', 'seedsofempowerment.org'],
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ko', 'es', 'fr', 'zh'],
  },
}

export default nextConfig;
