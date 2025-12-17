/**
 * API Caching Utilities
 * 
 * Production-ready caching layer for dashboard and API responses.
 * Designed as prototype infrastructure for all AP cells and future departments.
 * 
 * Features:
 * - In-memory cache with TTL
 * - Stale-while-revalidate pattern
 * - Cache tags for selective invalidation
 * - Redis-ready interface (graceful fallback)
 * 
 * @example
 * ```ts
 * import { apiCache, CacheTTL } from '@/lib/api/cache';
 * 
 * const data = await apiCache.getOrSet(
 *   'dashboard:ap-manager',
 *   () => apManagerService.getDashboard(actor),
 *   { ttl: CacheTTL.DASHBOARD, tags: ['dashboard', 'ap-manager'] }
 * );
 * ```
 */

// ============================================================================
// 1. TYPES
// ============================================================================

export interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
  staleAt: number;
  tags: string[];
}

export interface CacheOptions {
  /** Time-to-live in seconds */
  ttl: number;
  /** Stale-while-revalidate window in seconds (default: ttl) */
  swr?: number;
  /** Tags for cache invalidation */
  tags?: string[];
  /** Skip cache and fetch fresh (still stores result) */
  skipCache?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  staleHits: number;
  size: number;
}

// ============================================================================
// 2. TTL PRESETS
// ============================================================================

/**
 * Pre-configured TTL values in seconds
 */
export const CacheTTL = {
  /** Very short: 10 seconds (canvas objects) */
  REALTIME: 10,
  
  /** Short: 30 seconds (dashboards, metrics) */
  DASHBOARD: 30,
  
  /** Medium: 5 minutes (lists, aggregates) */
  LIST: 300,
  
  /** Long: 15 minutes (reference data) */
  REFERENCE: 900,
  
  /** Very long: 1 hour (static configuration) */
  CONFIG: 3600,
  
  /** Extended: 24 hours (rarely changing data) */
  STATIC: 86400,
} as const;

/**
 * Cache key prefixes by domain
 */
export const CachePrefix = {
  DASHBOARD: 'dash',
  CANVAS: 'canvas',
  VENDOR: 'ap01',
  INVOICE: 'ap02',
  MATCH: 'ap03',
  APPROVAL: 'ap04',
  PAYMENT: 'ap05',
  PREFLIGHT: 'preflight',
  USER: 'user',
} as const;

// ============================================================================
// 3. IN-MEMORY CACHE STORE
// ============================================================================

class InMemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private tagIndex = new Map<string, Set<string>>(); // tag -> keys
  private stats: CacheStats = { hits: 0, misses: 0, staleHits: 0, size: 0 };
  private cleanupInterval: NodeJS.Timeout | null = null;
  private revalidating = new Set<string>(); // Keys currently being revalidated
  
  constructor() {
    // Cleanup expired entries every 30 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 30_000);
  }
  
  /**
   * Get value from cache
   */
  get<T>(key: string): { value: T; stale: boolean } | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    const now = Date.now();
    
    // Expired (beyond stale window)
    if (now > entry.expiresAt) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Fresh
    if (now < entry.staleAt) {
      this.stats.hits++;
      return { value: entry.value, stale: false };
    }
    
    // Stale but usable
    this.stats.staleHits++;
    return { value: entry.value, stale: true };
  }
  
  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, options: CacheOptions): void {
    const now = Date.now();
    const ttlMs = options.ttl * 1000;
    const swrMs = (options.swr ?? options.ttl) * 1000;
    
    const entry: CacheEntry<T> = {
      value,
      createdAt: now,
      staleAt: now + ttlMs,
      expiresAt: now + ttlMs + swrMs,
      tags: options.tags ?? [],
    };
    
    // Update tag index
    for (const tag of entry.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
    
    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
  }
  
  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      // Remove from tag index
      for (const tag of entry.tags) {
        this.tagIndex.get(tag)?.delete(key);
      }
    }
    const deleted = this.cache.delete(key);
    this.stats.size = this.cache.size;
    return deleted;
  }
  
  /**
   * Invalidate all keys with a specific tag
   */
  invalidateByTag(tag: string): number {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;
    
    let count = 0;
    for (const key of keys) {
      if (this.delete(key)) count++;
    }
    
    this.tagIndex.delete(tag);
    return count;
  }
  
  /**
   * Invalidate all keys matching a prefix
   */
  invalidateByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        if (this.delete(key)) count++;
      }
    }
    return count;
  }
  
  /**
   * Check if a key is currently being revalidated
   */
  isRevalidating(key: string): boolean {
    return this.revalidating.has(key);
  }
  
  /**
   * Mark a key as being revalidated
   */
  markRevalidating(key: string): void {
    this.revalidating.add(key);
  }
  
  /**
   * Mark a key as done revalidating
   */
  doneRevalidating(key: string): void {
    this.revalidating.delete(key);
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
    this.revalidating.clear();
    this.stats.size = 0;
  }
  
  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.delete(key);
      }
    }
  }
  
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// ============================================================================
// 4. API CACHE SERVICE
// ============================================================================

class ApiCache {
  private store: InMemoryCache;
  
  constructor() {
    this.store = new InMemoryCache();
  }
  
  /**
   * Get cached value or compute and cache it
   * Implements stale-while-revalidate pattern
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
  ): Promise<T> {
    // Skip cache if requested
    if (options.skipCache) {
      const value = await fetcher();
      this.store.set(key, value, options);
      return value;
    }
    
    const cached = this.store.get<T>(key);
    
    // Cache miss - fetch and store
    if (!cached) {
      const value = await fetcher();
      this.store.set(key, value, options);
      return value;
    }
    
    // Cache hit (fresh) - return immediately
    if (!cached.stale) {
      return cached.value;
    }
    
    // Cache hit (stale) - return stale and revalidate in background
    if (!this.store.isRevalidating(key)) {
      this.store.markRevalidating(key);
      
      // Background revalidation
      fetcher()
        .then(value => {
          this.store.set(key, value, options);
        })
        .catch(error => {
          console.error(`Cache revalidation failed for ${key}:`, error);
        })
        .finally(() => {
          this.store.doneRevalidating(key);
        });
    }
    
    return cached.value;
  }
  
  /**
   * Get cached value (no fetcher)
   */
  get<T>(key: string): T | null {
    const cached = this.store.get<T>(key);
    return cached?.value ?? null;
  }
  
  /**
   * Set cache value directly
   */
  set<T>(key: string, value: T, options: CacheOptions): void {
    this.store.set(key, value, options);
  }
  
  /**
   * Delete a specific cache key
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }
  
  /**
   * Invalidate cache by tag
   * 
   * @example
   * ```ts
   * // After payment update
   * apiCache.invalidateByTag('ap05');
   * apiCache.invalidateByTag('dashboard');
   * ```
   */
  invalidateByTag(tag: string): number {
    return this.store.invalidateByTag(tag);
  }
  
  /**
   * Invalidate cache by key prefix
   * 
   * @example
   * ```ts
   * // Invalidate all vendor cache
   * apiCache.invalidateByPrefix('ap01:');
   * ```
   */
  invalidateByPrefix(prefix: string): number {
    return this.store.invalidateByPrefix(prefix);
  }
  
  /**
   * Clear entire cache
   */
  clear(): void {
    this.store.clear();
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return this.store.getStats();
  }
}

// ============================================================================
// 5. SINGLETON EXPORT
// ============================================================================

/**
 * Singleton cache instance
 */
export const apiCache = new ApiCache();

// ============================================================================
// 6. HELPER FUNCTIONS
// ============================================================================

/**
 * Build a cache key from parts
 * 
 * @example
 * ```ts
 * const key = cacheKey(CachePrefix.DASHBOARD, 'ap-manager', tenantId);
 * // 'dash:ap-manager:tenant-123'
 * ```
 */
export function cacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(p => p !== undefined).join(':');
}

/**
 * Wrap a service method with caching
 * 
 * @example
 * ```ts
 * const getCachedDashboard = withCache(
 *   (tenantId: string) => cacheKey(CachePrefix.DASHBOARD, tenantId),
 *   { ttl: CacheTTL.DASHBOARD, tags: ['dashboard'] },
 *   (tenantId) => dashboardService.getDashboard(tenantId)
 * );
 * 
 * const data = await getCachedDashboard('tenant-123');
 * ```
 */
export function withCache<TArgs extends unknown[], TResult>(
  keyBuilder: (...args: TArgs) => string,
  options: CacheOptions,
  fetcher: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => {
    const key = keyBuilder(...args);
    return apiCache.getOrSet(key, () => fetcher(...args), options);
  };
}

/**
 * Decorator-style cache invalidation
 * 
 * @example
 * ```ts
 * const updatePayment = invalidatesCache(
 *   ['ap05', 'dashboard'],
 *   paymentService.update.bind(paymentService)
 * );
 * 
 * await updatePayment(paymentId, data); // Automatically invalidates cache
 * ```
 */
export function invalidatesCache<TArgs extends unknown[], TResult>(
  tags: string[],
  fn: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    const result = await fn(...args);
    
    // Invalidate all specified tags
    for (const tag of tags) {
      apiCache.invalidateByTag(tag);
    }
    
    return result;
  };
}
