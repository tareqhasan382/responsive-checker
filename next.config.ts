import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  experimental: {
    optimizeCss: true,
    // Inline small globals to avoid extra requests for tiny static chunks.
    inlineCss: true,
  },
  // Strip X-Powered-By and instruct the cache layer to be conservative.
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value:
            'camera=(), microphone=(), geolocation=(), interest-cohort=()',
        },
      ],
    },
  ],
};

export default nextConfig;
