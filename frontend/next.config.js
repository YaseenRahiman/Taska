/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'default',
  },
  eslint: {
    // ESLint runs separately in CI; skip during Docker/production builds
    // to avoid version-mismatch failures with @typescript-eslint plugins
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizeCss: true,
  },
};

module.exports = nextConfig;