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
};

export default nextConfig;

