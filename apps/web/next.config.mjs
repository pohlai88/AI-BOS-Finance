import createMDX from '@next/mdx'
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure page extensions to include MDX
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    // Add domains if using external images
    // domains: ['example.com'],
  },

  // ⚠️ CRITICAL: Do NOT use output: 'export' if you need rewrites/proxy
  // Static exports cannot support server-side rewrites
  // Use default output (Node.js server) for rewrites
  // output: 'export', // ❌ REMOVED - conflicts with rewrites

  // Proxy configuration (replaces Vite proxy)
  // ⚠️ Requires Node.js server (cannot use with output: 'export')
  async rewrites() {
    return [
      {
        source: '/odata/:path*',
        destination: 'http://localhost:4004/odata/:path*',
      },
    ]
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },

  // Wave 2: Alias redirects to native routes
  // Ensures legacy URLs redirect to new native App Router pages
  async redirects() {
    return [
      {
        source: '/payment-hub',
        destination: '/payments',
        permanent: true,
      },
      {
        source: '/settings',
        destination: '/system',
        permanent: true,
      },
      {
        source: '/meta-registry',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },
}

// Merge MDX config with Next.js config
const withMDX = createMDX({
  // Add markdown plugins here if needed
  options: {
    // Use the MDX components from the canon-pages directory
    // Use path alias so it works from subdirectories (META/, PAYMENT/, etc.)
    providerImportSource: '@/canon-pages/mdx-components',
  },
})

// Chain plugins: MDX -> Bundle Analyzer
export default withBundleAnalyzer(withMDX(nextConfig))
