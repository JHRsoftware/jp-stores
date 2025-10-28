/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Headers for better performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300'
          }
        ],
      }
    ];
  },
  
  // Webpack optimizations
  // Note: custom webpack configuration was removed because Turbopack (the new default
  // dev server) doesn't support user webpack overrides. Path aliases are handled
  // via `jsconfig.json` (see `@/*` => `./src/*`). If you need to use webpack-only
  // customizations, remove `--turbopack` from the npm scripts in package.json.
  
  // Output optimization
  output: 'standalone',
  
  // SWC minification is enabled by default in Next.js 13+
  
  // Reduce bundle size
  modularizeImports: {
    'react-icons': {
      transform: 'react-icons/{{member}}',
    },
  },
};

export default nextConfig;
