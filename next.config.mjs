import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure page extensions to include MDX
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  
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
}

// Merge MDX config with Next.js config
const withMDX = createMDX({
  // Add markdown plugins here if needed
})

export default withMDX(nextConfig)
