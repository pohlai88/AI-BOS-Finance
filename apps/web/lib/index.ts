/**
 * Library exports
 * 
 * Use these imports in your components:
 * 
 * Client Components (browser):
 *   import { bffClient } from '@/lib';
 * 
 * Server Components / API Routes:
 *   import { metadataStudio, kernel } from '@/lib/backend.server';
 */

// Browser-safe client (for Client Components)
export { bffClient, BffError } from './bff-client';
export type * from './bff-client';

// Utilities
export { cn } from './utils';
export { env } from './env';

// Legacy client (deprecated - use bffClient instead)
export { kernelClient } from './kernel-client';
