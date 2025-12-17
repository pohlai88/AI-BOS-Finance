# API Infrastructure

> **Production-Ready Patterns for AP and All Future Departments**
> 
> This module provides the foundational infrastructure for all Next.js API routes.
> AP (Accounts Payable) is the prototype molecule — patterns established here
> will be replicated across all finance domains.

---

## 📦 Quick Start

```typescript
import {
  // Composed helper (recommended for most routes)
  apiRoute,
  
  // Rate limiting
  RateLimitPresets,
  
  // Caching
  apiCache,
  CacheTTL,
  cacheKey,
  
  // Auth
  APPermissions,
  
  // Errors
  NotFoundError,
} from '@/lib/api';

// Simple authenticated route with rate limiting + error handling
export const GET = apiRoute(
  RateLimitPresets.READ,
  async (request, actor) => {
    const data = await service.getData(actor.tenantId);
    return NextResponse.json(data);
  }
);
```

---

## 🏗️ Architecture

```
lib/api/
├── index.ts           # Barrel export + composed helpers
├── rate-limiter.ts    # Rate limiting with in-memory store
├── cache.ts           # Caching with SWR pattern
├── errors.ts          # Typed errors + handler
├── auth.ts            # Authentication + RBAC
└── README.md          # This file
```

---

## 🚦 Rate Limiting

### Presets

| Preset | Limit | Window | Use Case |
|--------|-------|--------|----------|
| `READ` | 100/min | 60s | Standard API reads |
| `MUTATION` | 30/min | 60s | Create/Update operations |
| `SENSITIVE` | 10/min | 60s | Payments, bank changes |
| `PREFLIGHT` | 20/min | 60s | Pre-flight checks |
| `CANVAS_REALTIME` | 200/min | 60s | Canvas drag/drop |
| `DASHBOARD` | 60/min | 60s | Dashboard reads |
| `PUBLIC` | 20/min | 60s | Unauthenticated routes |
| `AUTH` | 5/min | 60s | Login attempts |

### Usage

```typescript
import { withRateLimit, RateLimitPresets } from '@/lib/api';

// Use preset
export const POST = withRateLimit(
  RateLimitPresets.MUTATION,
  async (request) => { ... }
);

// Custom config
export const POST = withRateLimit(
  { limit: 5, windowSecs: 60, keyType: 'user' },
  async (request) => { ... }
);
```

### Response Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702848000000
```

When rate limited:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
```

---

## 💾 Caching

### TTL Presets

| Preset | TTL | Use Case |
|--------|-----|----------|
| `REALTIME` | 10s | Canvas objects |
| `DASHBOARD` | 30s | Dashboard metrics |
| `LIST` | 5min | Lists, aggregates |
| `REFERENCE` | 15min | Reference data |
| `CONFIG` | 1hr | Configuration |
| `STATIC` | 24hr | Rarely changing |

### Basic Usage

```typescript
import { apiCache, CacheTTL, cacheKey, CachePrefix } from '@/lib/api';

// Get or set with SWR
const data = await apiCache.getOrSet(
  cacheKey(CachePrefix.DASHBOARD, tenantId),
  () => fetchFromDB(),
  { ttl: CacheTTL.DASHBOARD, tags: ['dashboard'] }
);

// Invalidate on mutation
apiCache.invalidateByTag('dashboard');
apiCache.invalidateByPrefix('ap01:');
```

### Stale-While-Revalidate

```typescript
// Returns stale data immediately, revalidates in background
const data = await apiCache.getOrSet(key, fetcher, {
  ttl: 30,    // Fresh for 30s
  swr: 60,    // Serve stale for another 60s while revalidating
  tags: ['dashboard'],
});
```

### Cache Tags

Use tags for targeted invalidation:

```typescript
// Set with tags
apiCache.set(key, value, {
  ttl: CacheTTL.DASHBOARD,
  tags: ['dashboard', 'ap-manager', `tenant:${tenantId}`],
});

// Invalidate all dashboard cache
apiCache.invalidateByTag('dashboard');

// Invalidate specific tenant
apiCache.invalidateByTag(`tenant:${tenantId}`);
```

---

## ❌ Error Handling

### Error Classes

| Error | Status | Code | Use Case |
|-------|--------|------|----------|
| `BadRequestError` | 400 | `BAD_REQUEST` | Invalid input |
| `ValidationError` | 400 | `VALIDATION_ERROR` | Zod validation failed |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` | Not logged in |
| `ForbiddenError` | 403 | `FORBIDDEN` | Not allowed |
| `PermissionDeniedError` | 403 | `INSUFFICIENT_PERMISSIONS` | Missing permission |
| `SoDViolationError` | 403 | `SOD_VIOLATION` | Segregation of duties |
| `NotFoundError` | 404 | `NOT_FOUND` | Resource missing |
| `ConflictError` | 409 | `CONFLICT` | Duplicate, etc. |
| `VersionConflictError` | 409 | `VERSION_CONFLICT` | Optimistic lock |
| `PeriodLockedError` | 422 | `PERIOD_LOCKED` | Fiscal period closed |
| `InvalidStateError` | 422 | `INVALID_STATE` | Bad state transition |
| `RateLimitedError` | 429 | `RATE_LIMITED` | Too many requests |

### Usage

```typescript
import { 
  withErrorHandler, 
  NotFoundError, 
  ValidationError,
  assertExists,
} from '@/lib/api';

export const GET = withErrorHandler(async (request) => {
  const data = await db.find(id);
  
  // Option 1: Throw error
  if (!data) throw new NotFoundError('Invoice', id);
  
  // Option 2: Use assertion helper
  assertExists(data, 'Invoice', id);
  
  return NextResponse.json(data);
});
```

### Response Format

```json
{
  "error": "NOT_FOUND",
  "message": "Invoice not found: inv-123",
  "details": { "resource": "Invoice", "id": "inv-123" },
  "requestId": "req_abc123",
  "timestamp": "2025-12-17T10:00:00.000Z"
}
```

---

## 🔐 Authentication & Authorization

### Middleware

```typescript
import { 
  requireAuth, 
  requirePermission, 
  requireRole,
  APPermissions,
} from '@/lib/api';

// Basic auth
export const GET = requireAuth(async (request, actor) => {
  console.log(actor.userId, actor.tenantId);
  return NextResponse.json({ user: actor.userName });
});

// Require specific permission
export const POST = requirePermission(
  APPermissions.PAYMENT_EXECUTE,
  async (request, actor) => { ... }
);

// Require minimum role
export const DELETE = requireRole('manager', async (request, actor) => { ... });
```

### Actor Context

```typescript
interface ActorContext {
  userId: string;
  userName?: string;
  email?: string;
  tenantId: string;
  companyId?: string;
  role: UserRole;
  permissions: string[];
  sessionId: string;
  correlationId: string;
}
```

### Permissions

All AP permissions are defined in `APPermissions`:

```typescript
APPermissions.VENDOR_VIEW      // ap01:vendor:view
APPermissions.INVOICE_CREATE   // ap02:invoice:create
APPermissions.MATCH_OVERRIDE   // ap03:match:override
APPermissions.APPROVAL_APPROVE // ap04:approval:approve
APPermissions.PAYMENT_EXECUTE  // ap05:payment:execute
APPermissions.CANVAS_EDIT_TEAM // canvas:edit:team
```

---

## 🎯 Composed Helpers

### `apiRoute` — The Standard Pattern

For most authenticated routes:

```typescript
import { apiRoute, RateLimitPresets } from '@/lib/api';

export const GET = apiRoute(
  RateLimitPresets.READ,
  async (request, actor) => {
    return NextResponse.json({ data: 'success' });
  }
);
```

This composes: `withErrorHandler` → `withRateLimit` → `requireAuth`

### `publicApiRoute` — Unauthenticated

For public endpoints (still rate limited):

```typescript
import { publicApiRoute, RateLimitPresets } from '@/lib/api';

export const GET = publicApiRoute(
  RateLimitPresets.PUBLIC,
  async (request) => {
    return NextResponse.json({ status: 'ok' });
  }
);
```

---

## 📋 Full Example: Dashboard Route

```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandler,
  withRateLimit,
  RateLimitPresets,
  requirePermission,
  APPermissions,
  apiCache,
  CacheTTL,
  CachePrefix,
  cacheKey,
  type ActorContext,
} from '@/lib/api';

export const GET = withErrorHandler(
  withRateLimit(RateLimitPresets.DASHBOARD,
    requirePermission(APPermissions.DASHBOARD_VIEW,
      async (request: NextRequest, actor: ActorContext) => {
        // Tenant-scoped cache key
        const key = cacheKey(CachePrefix.DASHBOARD, 'ap-manager', actor.tenantId);
        
        // Get from cache or fetch (with SWR)
        const dashboard = await apiCache.getOrSet(
          key,
          () => dashboardService.getDashboard(actor),
          {
            ttl: CacheTTL.DASHBOARD,
            swr: CacheTTL.DASHBOARD * 2,
            tags: ['dashboard', `tenant:${actor.tenantId}`],
          }
        );
        
        const response = NextResponse.json(dashboard);
        response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
        
        return response;
      }
    )
  )
);
```

---

## 📋 Full Example: Mutation Route

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  withErrorHandler,
  withRateLimit,
  RateLimitPresets,
  requirePermission,
  APPermissions,
  apiCache,
  ValidationError,
  VersionConflictError,
  type ActorContext,
} from '@/lib/api';

const UpdateSchema = z.object({
  name: z.string().min(1).max(200),
  expectedVersion: z.number().int().positive(),
});

export const PATCH = withErrorHandler(
  withRateLimit(RateLimitPresets.MUTATION,
    requirePermission(APPermissions.VENDOR_UPDATE,
      async (request: NextRequest, actor: ActorContext) => {
        const body = await request.json();
        
        // Validate
        const parsed = UpdateSchema.safeParse(body);
        if (!parsed.success) {
          throw ValidationError.fromZod(parsed.error);
        }
        
        // Check version
        const current = await db.findById(id);
        if (current.version !== parsed.data.expectedVersion) {
          throw new VersionConflictError(id, parsed.data.expectedVersion, current.version);
        }
        
        // Update
        const updated = await db.update(id, parsed.data, actor);
        
        // Invalidate cache
        apiCache.invalidateByTag(`vendor:${id}`);
        apiCache.invalidateByTag('dashboard');
        
        return NextResponse.json(updated);
      }
    )
  )
);
```

---

## 🔮 Future Enhancements

When ready, these can be added:

1. **Redis Backend** — Replace in-memory stores with Redis for multi-instance
2. **Edge Runtime** — Move read-only routes to Edge for lower latency
3. **Request Coalescing** — Deduplicate concurrent identical requests
4. **Circuit Breaker** — Protect against downstream service failures
5. **Metrics Export** — Prometheus/OpenTelemetry integration

---

**Last Updated:** December 2025  
**Maintainer:** Platform Team
