# Middleware to Proxy Migration (Next.js 16)

**Date:** 2025-12-13  
**Status:** ✅ **COMPLETE**

---

## What Changed

### File Renamed
- `middleware.ts` → `proxy.ts`

### Function Renamed
- `export function middleware()` → `export function proxy()`

### Runtime Change
- **Before:** Edge Runtime (used `globalThis.crypto.randomUUID()`)
- **After:** Node.js Runtime (uses `node:crypto` `randomUUID()`)

---

## Why This Change?

Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts` to provide:
- Clearer semantics for network boundary handling
- Better alignment with Next.js architecture
- Future-proofing (middleware will be removed in future versions)

---

## Migration Details

### Before (middleware.ts)
```ts
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const correlationId =
    req.headers.get("x-correlation-id") ?? globalThis.crypto.randomUUID();
  const res = NextResponse.next();
  res.headers.set("x-correlation-id", correlationId);
  return res;
}
```

### After (proxy.ts)
```ts
import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

export function proxy(req: NextRequest) {
  const correlationId =
    req.headers.get("x-correlation-id") ?? randomUUID();
  const res = NextResponse.next();
  res.headers.set("x-correlation-id", correlationId);
  return res;
}
```

---

## Key Differences

| Aspect | middleware.ts | proxy.ts |
|--------|---------------|----------|
| **Runtime** | Edge Runtime | Node.js Runtime |
| **Crypto** | `globalThis.crypto` | `node:crypto` |
| **Performance** | Faster (Edge) | Slightly slower (Node.js) |
| **Node.js APIs** | Limited | Full access |
| **Status** | Deprecated | Current standard |

---

## Verification

✅ **Health endpoint tested:**
```bash
curl http://localhost:3001/api/kernel/health
# Returns 200 OK with correlation_id header
```

✅ **No compilation errors**  
✅ **Correlation ID still working**  
✅ **All routes still functional**

---

## Impact

### No Breaking Changes
- Same functionality
- Same matcher pattern (`/api/:path*`)
- Same correlation ID behavior
- All API routes continue to work

### Benefits
- ✅ No deprecation warnings
- ✅ Future-proof (aligned with Next.js 16+)
- ✅ Full Node.js API access (if needed later)

### Considerations
- Slightly slower than Edge Runtime (negligible for correlation ID generation)
- Can now use any Node.js APIs in proxy (more flexibility)

---

## References

- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Middleware to Proxy Migration](https://nextjs.org/docs/messages/middleware-to-proxy)
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16)

---

## Status: ✅ Migration Complete

The Kernel service is now using the Next.js 16 standard `proxy.ts` instead of the deprecated `middleware.ts`. All functionality remains intact.
