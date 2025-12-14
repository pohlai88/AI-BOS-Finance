import path from "node:path";
import { fileURLToPath } from "node:url";

// ESM path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Kernel runs as API-only service on port 3001
  // No UI pages - pure Control Plane
  reactStrictMode: true,

  // Security: Hide framework identifier
  poweredByHeader: false,

  // Transpile workspace packages
  transpilePackages: [
    "@aibos/contracts",
    "@aibos/kernel-core",
    "@aibos/kernel-adapters",
  ],

  // Turbopack: Set root to monorepo root for workspace package resolution
  // This allows Turbopack to resolve packages outside apps/kernel
  // CRITICAL: Without this, Turbopack cannot resolve workspace packages
  turbopack: {
    // apps/kernel -> repo root (../../ from apps/kernel)
    root: path.resolve(__dirname, "../.."),
  },

  // Security Headers (Day 7 Hardening)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          // CORS: Allow credentials and common methods
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          // TODO: Lock down to specific domains in production
          { key: 'Access-Control-Allow-Origin', value: process.env.CORS_ORIGIN || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-tenant-id, x-correlation-id, x-kernel-bootstrap-key, Authorization' },
          // Security: Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Security: Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Security: HSTS (enable in production with HTTPS)
          // { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default nextConfig;

