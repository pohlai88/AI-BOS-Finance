/**
 * API Infrastructure — Barrel Export
 * 
 * Central export for all API infrastructure utilities.
 * This module provides production-ready patterns for:
 * - Rate limiting
 * - Caching
 * - Error handling
 * - Authentication & Authorization
 * 
 * Designed as prototype infrastructure for all AP cells and future departments.
 * 
 * @example
 * ```ts
 * import {
 *   // Rate limiting
 *   rateLimiter,
 *   RateLimitPresets,
 *   withRateLimit,
 *   
 *   // Caching
 *   apiCache,
 *   CacheTTL,
 *   CachePrefix,
 *   cacheKey,
 *   withCache,
 *   
 *   // Errors
 *   handleApiError,
 *   withErrorHandler,
 *   NotFoundError,
 *   ValidationError,
 *   
 *   // Auth
 *   requireAuth,
 *   requirePermission,
 *   APPermissions,
 * } from '@/lib/api';
 * 
 * export const GET = withErrorHandler(
 *   withRateLimit(RateLimitPresets.READ,
 *     requireAuth(async (request, actor) => {
 *       const data = await apiCache.getOrSet(
 *         cacheKey(CachePrefix.DASHBOARD, actor.tenantId),
 *         () => service.getData(actor),
 *         { ttl: CacheTTL.DASHBOARD, tags: ['dashboard'] }
 *       );
 *       return NextResponse.json(data);
 *     })
 *   )
 * );
 * ```
 */

// ============================================================================
// RATE LIMITING
// ============================================================================

export {
  // Service
  rateLimiter,
  
  // Presets
  RateLimitPresets,
  
  // Wrapper
  withRateLimit,
  checkMultipleRateLimits,
  
  // Types
  type RateLimitConfig,
  type RateLimitResult,
} from './rate-limiter';

// ============================================================================
// CACHING
// ============================================================================

export {
  // Service
  apiCache,
  
  // Presets
  CacheTTL,
  CachePrefix,
  
  // Helpers
  cacheKey,
  withCache,
  invalidatesCache,
  
  // Types
  type CacheOptions,
  type CacheStats,
} from './cache';

// ============================================================================
// ERROR HANDLING
// ============================================================================

export {
  // Handler
  handleApiError,
  withErrorHandler,
  
  // Assertions
  assertOrThrow,
  assertExists,
  
  // Error codes
  ErrorCode,
  
  // Base class
  ApiError,
  
  // Specific errors
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  PermissionDeniedError,
  SoDViolationError,
  NotFoundError,
  ConflictError,
  VersionConflictError,
  UnprocessableError,
  PeriodLockedError,
  InvalidStateError,
  RateLimitedError,
  InternalError,
  ServiceUnavailableError,
  
  // Types
  type ErrorResponse,
  type ErrorCodeType,
} from './errors';

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

export {
  // Middleware
  requireAuth,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireSoD,
  
  // Helpers
  getActor,
  hasPermission,
  hasMinimumRole,
  checkSoD,
  tenantKey,
  
  // Permissions
  APPermissions,
  
  // Types
  type ActorContext,
  type UserRole,
} from './auth';

// ============================================================================
// COMPOSED HELPERS
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from './errors';
import { withRateLimit, type RateLimitConfig } from './rate-limiter';
import { requireAuth, type ActorContext } from './auth';

/**
 * Compose common middleware for API routes
 * Combines error handling, rate limiting, and authentication
 * 
 * @example
 * ```ts
 * export const POST = apiRoute(
 *   RateLimitPresets.MUTATION,
 *   async (request, actor) => {
 *     return NextResponse.json({ success: true });
 *   }
 * );
 * ```
 */
export function apiRoute<T>(
  rateLimit: RateLimitConfig,
  handler: (request: NextRequest, actor: ActorContext) => Promise<NextResponse<T>>
) {
  return withErrorHandler(
    withRateLimit(rateLimit, (request) => 
      requireAuth(handler)(request)
    )
  );
}

/**
 * Create an unauthenticated API route with error handling and rate limiting
 */
export function publicApiRoute<T>(
  rateLimit: RateLimitConfig,
  handler: (request: NextRequest) => Promise<NextResponse<T>>
) {
  return withErrorHandler(withRateLimit(rateLimit, handler));
}
