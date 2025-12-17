# Lively Layer API Optimization Audit

> **Audit Date:** December 2025  
> **Auditor:** Next.js MCP + Code Review  
> **Scope:** Canvas API Routes, Dashboard Services, API Infrastructure
> **Status:** ✅ Production-Ready Infrastructure Complete

---

## 📊 Audit Summary

| Category | Before | After | Improvement |
|----------|--------|-------|-------------|
| **Input Validation** | ❌ None | ✅ Zod schemas | Security + DX |
| **Response Caching** | ❌ None | ✅ Cache-Control + SWR | Performance |
| **Error Handling** | ⚠️ Generic | ✅ Typed errors + handler | Debugging |
| **Pagination** | ❌ Missing | ✅ limit/offset | Scalability |
| **Optimistic Locking** | ✅ Implemented | ✅ + ETag headers | Better UX |
| **Rate Limiting** | ❌ None | ✅ Per-route presets | DoS Protection |
| **Authentication** | ⚠️ TODO comments | ✅ RBAC middleware | Security |
| **API Cache Layer** | ❌ None | ✅ In-memory + SWR | Performance |

---

## ✅ Optimizations Applied

### 1. Response Caching

**Dashboard Routes** (`/api/ap/*/dashboard`)
- Added `Cache-Control: private, max-age=30, stale-while-revalidate=60`
- Dashboard data is semi-static; 30-second cache reduces DB load

**Canvas Objects** (`/api/canvas/objects`)
- Added `Cache-Control: private, max-age=10, stale-while-revalidate=30`
- Canvas updates frequently but can tolerate 10s staleness

### 2. Input Validation (Zod)

Created shared validation schemas in `_schemas.ts`:

```typescript
// All inputs validated at edge
const parseResult = CreateObjectSchema.safeParse(body);
if (!parseResult.success) {
  return NextResponse.json(formatValidationError(parseResult.error), { status: 400 });
}
```

**Validated Schemas:**
- `CreateObjectSchema` — Canvas object creation
- `MoveObjectSchema` — Zone moves with version
- `ReactionSchema` — Emoji validation
- `AcknowledgeSchema` — Pre-flight acknowledgment
- `URNSchema` — Magic Link format

### 3. Structured Error Responses

**Before:**
```json
{ "error": "Failed to fetch dashboard" }
```

**After:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": { "fieldErrors": { "positionX": ["Required"] } }
}
```

**Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input |
| `INVALID_JSON` | 400 | Malformed JSON |
| `INVALID_ID` | 400 | Invalid UUID format |
| `CONFLICT` | 409 | Optimistic lock failure |
| `HARD_STOP_REQUIRES_INDIVIDUAL` | 400 | Batch acknowledge blocked |
| `INTERNAL_ERROR` | 500 | Server error |

### 4. Optimistic Locking Improvements

**Move API** now returns:
- `ETag` header with current version
- `X-Current-Version` header on conflict
- Proper 409 status with conflict details

```http
HTTP/1.1 409 Conflict
ETag: "v2"
X-Current-Version: 2
Content-Type: application/json

{
  "success": false,
  "error": "CONFLICT",
  "currentVersion": 2,
  "currentZoneId": "zone-inbox",
  "message": "Object was modified by another user. Please refresh and retry."
}
```

### 5. Pagination

**Before:**
```json
{ "objects": [...], "total": 500 }  // Returns all 500
```

**After:**
```json
{
  "objects": [...],
  "total": 500,
  "pagination": { "limit": 50, "offset": 0, "hasMore": true }
}
```

---

## ✅ Production Infrastructure Implemented

The following "future recommendations" have been **fully implemented** as prototype infrastructure for AP and all future departments:

### 1. Rate Limiting ✅

**Location:** `apps/web/lib/api/rate-limiter.ts`

```typescript
import { withRateLimit, RateLimitPresets } from '@/lib/api';

export const POST = withRateLimit(RateLimitPresets.MUTATION, handler);
```

**Presets Available:**
| Preset | Limit | Use Case |
|--------|-------|----------|
| `READ` | 100/min | Standard reads |
| `MUTATION` | 30/min | Create/Update |
| `SENSITIVE` | 10/min | Payments, bank changes |
| `CANVAS_REALTIME` | 200/min | Canvas drag/drop |
| `DASHBOARD` | 60/min | Dashboard reads |
| `AUTH` | 5/min | Login attempts |

### 2. API Cache Layer ✅

**Location:** `apps/web/lib/api/cache.ts`

```typescript
import { apiCache, CacheTTL, cacheKey, CachePrefix } from '@/lib/api';

const data = await apiCache.getOrSet(
  cacheKey(CachePrefix.DASHBOARD, tenantId),
  () => fetchData(),
  { ttl: CacheTTL.DASHBOARD, tags: ['dashboard'] }
);

// Invalidate on mutation
apiCache.invalidateByTag('dashboard');
```

**Features:**
- Stale-while-revalidate pattern
- Tag-based invalidation
- Automatic cleanup

### 3. Error Handling ✅

**Location:** `apps/web/lib/api/errors.ts`

```typescript
import { withErrorHandler, NotFoundError, VersionConflictError } from '@/lib/api';

export const GET = withErrorHandler(async (request) => {
  throw new NotFoundError('Invoice', id);
});
```

**Typed Errors:**
- `BadRequestError`, `ValidationError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError`, `SoDViolationError` (403)
- `NotFoundError` (404)
- `VersionConflictError` (409)
- `PeriodLockedError`, `InvalidStateError` (422)
- `RateLimitedError` (429)

### 4. Authentication & RBAC ✅

**Location:** `apps/web/lib/api/auth.ts`

```typescript
import { requireAuth, requirePermission, APPermissions } from '@/lib/api';

export const POST = requirePermission(
  APPermissions.PAYMENT_EXECUTE,
  async (request, actor) => { ... }
);
```

**Features:**
- Role hierarchy (viewer → super_admin)
- Permission-based access
- SoD violation checks
- Actor context with correlation ID

### 5. Composed Helpers ✅

**Location:** `apps/web/lib/api/index.ts`

```typescript
import { apiRoute, RateLimitPresets } from '@/lib/api';

// Combines: error handling + rate limiting + auth
export const GET = apiRoute(RateLimitPresets.READ, async (request, actor) => {
  return NextResponse.json({ data: 'success' });
});
```

---

## 📁 Files Created/Modified

### New Infrastructure (`apps/web/lib/api/`)

| File | Purpose |
|------|---------|
| `rate-limiter.ts` | Rate limiting with in-memory store |
| `cache.ts` | Caching with SWR pattern |
| `errors.ts` | Typed errors + handler |
| `auth.ts` | Authentication + RBAC |
| `index.ts` | Barrel export + composed helpers |
| `README.md` | Documentation |

### Updated Routes

| File | Change |
|------|--------|
| `api/ap/manager/dashboard/route.ts` | Full production pattern |
| `api/canvas/objects/route.ts` | Zod validation, pagination |
| `api/canvas/objects/[id]/move/route.ts` | Full production pattern |
| `api/canvas/preflight/acknowledge/route.ts` | Zod, hard stop validation |
| `api/canvas/_schemas.ts` | Shared validation schemas |

---

## 🔮 Remaining Future Optimizations

These can be added when needed:

1. **Redis Backend** — Replace in-memory stores for multi-instance
2. **Edge Runtime** — Move read-only APIs to Edge for lower latency
3. **Request Coalescing** — Deduplicate concurrent identical requests
4. **Circuit Breaker** — Protect against downstream service failures
5. **Metrics Export** — Prometheus/OpenTelemetry integration
6. **WebSocket Scaling** — Redis PubSub for horizontal scaling

---

## 🧪 Testing Recommendations

```bash
# Test rate limiting
for i in {1..65}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    http://localhost:3000/api/ap/manager/dashboard
done
# Should see 429 after 60 requests

# Test validation errors
curl -X POST http://localhost:3000/api/canvas/objects \
  -H "Content-Type: application/json" \
  -d '{"objectType": "invalid"}'

# Test conflict response
curl -X POST http://localhost:3000/api/canvas/objects/550e8400-e29b-41d4-a716-446655440001/move \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test" \
  -d '{"expectedVersion": 999, "zoneId": null}'

# Test caching headers
curl -I http://localhost:3000/api/ap/manager/dashboard \
  -H "Authorization: Bearer test"
# Should show: Cache-Control, X-RateLimit-* headers
```

---

**Last Updated:** December 2025  
**Reviewed By:** Finance Cell Team + Platform Team
