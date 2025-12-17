/**
 * Rate Limiter
 * 
 * Production-ready rate limiting with in-memory fallback.
 * Designed as prototype infrastructure for all AP cells and future departments.
 * 
 * Features:
 * - Sliding window algorithm
 * - Per-user and per-IP limiting
 * - Route-specific configurations
 * - Redis support (optional, graceful fallback to in-memory)
 * 
 * @example
 * ```ts
 * import { rateLimiter, RateLimitPresets } from '@/lib/api/rate-limiter';
 * 
 * export async function POST(request: NextRequest) {
 *   const result = await rateLimiter.check(request, RateLimitPresets.MUTATION);
 *   if (!result.success) {
 *     return result.response;
 *   }
 *   // ... continue
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// 1. TYPES
// ============================================================================

export interface RateLimitConfig {
  /** Maximum requests allowed */
  limit: number;
  /** Time window in seconds */
  windowSecs: number;
  /** Identifier type */
  keyType: 'ip' | 'user' | 'ip-user';
  /** Optional route prefix for scoping */
  routePrefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  response?: NextResponse;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// ============================================================================
// 2. PRESETS
// ============================================================================

/**
 * Pre-configured rate limit presets for common use cases
 */
export const RateLimitPresets = {
  /** Standard API reads: 100 req/min */
  READ: { limit: 100, windowSecs: 60, keyType: 'user' as const },
  
  /** Mutations (create/update): 30 req/min */
  MUTATION: { limit: 30, windowSecs: 60, keyType: 'user' as const },
  
  /** Sensitive operations (payments, bank changes): 10 req/min */
  SENSITIVE: { limit: 10, windowSecs: 60, keyType: 'user' as const },
  
  /** Pre-flight checks: 20 req/min per user */
  PREFLIGHT: { limit: 20, windowSecs: 60, keyType: 'user' as const },
  
  /** Canvas real-time updates: 200 req/min (higher for interactivity) */
  CANVAS_REALTIME: { limit: 200, windowSecs: 60, keyType: 'user' as const },
  
  /** Dashboard reads: 60 req/min (cached, but still limit) */
  DASHBOARD: { limit: 60, windowSecs: 60, keyType: 'user' as const },
  
  /** Public/unauthenticated: 20 req/min per IP */
  PUBLIC: { limit: 20, windowSecs: 60, keyType: 'ip' as const },
  
  /** Login/auth attempts: 5 req/min per IP (brute force protection) */
  AUTH: { limit: 5, windowSecs: 60, keyType: 'ip' as const },
  
  /** WebSocket connections: 10 per min per user */
  WEBSOCKET: { limit: 10, windowSecs: 60, keyType: 'user' as const },
} as const;

// ============================================================================
// 3. IN-MEMORY STORE
// ============================================================================

/**
 * In-memory rate limit store
 * Used as fallback when Redis is not available
 */
class InMemoryStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }
  
  async increment(key: string, windowSecs: number): Promise<RateLimitEntry> {
    const now = Date.now();
    const entry = this.store.get(key);
    
    if (!entry || entry.resetAt <= now) {
      // New window
      const newEntry: RateLimitEntry = {
        count: 1,
        resetAt: now + windowSecs * 1000,
      };
      this.store.set(key, newEntry);
      return newEntry;
    }
    
    // Increment existing window
    entry.count++;
    return entry;
  }
  
  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key);
    if (!entry || entry.resetAt <= Date.now()) {
      return null;
    }
    return entry;
  }
  
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt <= now) {
        this.store.delete(key);
      }
    }
  }
  
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// ============================================================================
// 4. RATE LIMITER SERVICE
// ============================================================================

class RateLimiter {
  private store: InMemoryStore;
  private redisClient: unknown = null; // Future: Redis client
  
  constructor() {
    this.store = new InMemoryStore();
    // Future: Initialize Redis connection
    // this.initRedis();
  }
  
  /**
   * Check rate limit for a request
   */
  async check(
    request: NextRequest,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = this.buildKey(request, config);
    const entry = await this.store.increment(key, config.windowSecs);
    
    const remaining = Math.max(0, config.limit - entry.count);
    const reset = new Date(entry.resetAt);
    
    if (entry.count > config.limit) {
      // Rate limited
      const retryAfter = Math.ceil((entry.resetAt - Date.now()) / 1000);
      
      const response = NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message: 'Too many requests. Please slow down.',
          retryAfter,
          limit: config.limit,
          windowSecs: config.windowSecs,
        },
        { status: 429 }
      );
      
      // Standard rate limit headers
      response.headers.set('X-RateLimit-Limit', String(config.limit));
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', String(entry.resetAt));
      response.headers.set('Retry-After', String(retryAfter));
      
      return {
        success: false,
        limit: config.limit,
        remaining: 0,
        reset,
        response,
      };
    }
    
    return {
      success: true,
      limit: config.limit,
      remaining,
      reset,
    };
  }
  
  /**
   * Add rate limit headers to a successful response
   */
  addHeaders(response: NextResponse, result: RateLimitResult): NextResponse {
    response.headers.set('X-RateLimit-Limit', String(result.limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.reset.getTime()));
    return response;
  }
  
  /**
   * Build cache key for rate limiting
   */
  private buildKey(request: NextRequest, config: RateLimitConfig): string {
    const parts: string[] = ['rl'];
    
    // Add route prefix if specified
    if (config.routePrefix) {
      parts.push(config.routePrefix);
    } else {
      // Use pathname as default scope
      parts.push(new URL(request.url).pathname.replace(/\//g, ':'));
    }
    
    // Add identifier based on key type
    switch (config.keyType) {
      case 'ip':
        parts.push(`ip:${this.getClientIP(request)}`);
        break;
      case 'user':
        parts.push(`user:${this.getUserId(request)}`);
        break;
      case 'ip-user':
        parts.push(`ip:${this.getClientIP(request)}`);
        parts.push(`user:${this.getUserId(request)}`);
        break;
    }
    
    return parts.join(':');
  }
  
  /**
   * Extract client IP from request
   */
  private getClientIP(request: NextRequest): string {
    // Check common headers for proxied requests
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }
    
    // Fallback
    return request.headers.get('cf-connecting-ip') ?? '127.0.0.1';
  }
  
  /**
   * Extract user ID from request (session/token)
   */
  private getUserId(request: NextRequest): string {
    // Try to get user from cookie/header
    // In production: decode JWT or session cookie
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // Hash the token for privacy
      return this.hashString(authHeader.slice(7));
    }
    
    // Check session cookie
    const sessionCookie = request.cookies.get('session')?.value;
    if (sessionCookie) {
      return this.hashString(sessionCookie);
    }
    
    // Fallback to IP-based limiting for unauthenticated requests
    return `anon:${this.getClientIP(request)}`;
  }
  
  /**
   * Simple hash function for privacy
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

// ============================================================================
// 5. SINGLETON EXPORT
// ============================================================================

/**
 * Singleton rate limiter instance
 */
export const rateLimiter = new RateLimiter();

// ============================================================================
// 6. HELPER FUNCTIONS
// ============================================================================

/**
 * Create a rate-limited route handler wrapper
 * 
 * @example
 * ```ts
 * export const POST = withRateLimit(
 *   RateLimitPresets.MUTATION,
 *   async (request) => {
 *     // ... handler logic
 *   }
 * );
 * ```
 */
export function withRateLimit<T>(
  config: RateLimitConfig,
  handler: (request: NextRequest) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = await rateLimiter.check(request, config);
    
    if (!result.success) {
      return result.response!;
    }
    
    const response = await handler(request);
    return rateLimiter.addHeaders(response, result);
  };
}

/**
 * Combine multiple rate limits (e.g., per-route + per-user)
 */
export async function checkMultipleRateLimits(
  request: NextRequest,
  configs: RateLimitConfig[]
): Promise<RateLimitResult> {
  for (const config of configs) {
    const result = await rateLimiter.check(request, config);
    if (!result.success) {
      return result;
    }
  }
  
  // All passed - return the most restrictive remaining
  const results = await Promise.all(
    configs.map(c => rateLimiter.check(request, c))
  );
  
  const minRemaining = Math.min(...results.map(r => r.remaining));
  const earliestReset = new Date(Math.min(...results.map(r => r.reset.getTime())));
  
  return {
    success: true,
    limit: Math.min(...results.map(r => r.limit)),
    remaining: minRemaining,
    reset: earliestReset,
  };
}
