# Build 2 Phase 2 — API Gateway Audit & Evaluation

**Date:** 2025-12-13  
**Status:** ⚠️ **Incomplete** — Foundation Ready, Gateway Route Missing  
**Auditor:** Next.js MCP Analysis

---

## 📊 Executive Summary

### Planning vs Actual

| Aspect | Planned | Actual | Status |
|--------|---------|--------|--------|
| **Gateway Route** | `app/api/gateway/[...path]/route.ts` | ❌ Not implemented | 🔴 Missing |
| **Route Resolution** | Use `resolveRoute()` | ✅ Implemented (Phase 1) | 🟢 Complete |
| **Request Forwarding** | HTTP proxy to Canon | ❌ Not implemented | 🔴 Missing |
| **Correlation ID** | Propagate to Canon | ⚠️ Partial (proxy.ts only) | 🟡 Partial |
| **Response Streaming** | Stream back to client | ❌ Not implemented | 🔴 Missing |

**Overall Phase 2 Status:** 🔴 **0% Complete** (0/5 tasks)

---

## 📋 Detailed Task Analysis

### Phase 2: API Gateway (Planned: 1-2 hours)

#### ✅ Task 1: Foundation — Route Resolution
**Status:** ✅ **Complete** (from Phase 1)

**Location:** `packages/kernel-core/src/application/resolveRoute.ts`

**Implementation Quality:**
- ✅ Longest prefix matching algorithm implemented
- ✅ Path normalization (leading `/`, trailing slash removal)
- ✅ Returns `ResolvedRoute` with `canon_base_url` and `forward_path`
- ✅ Handles edge cases (root path `/`, exact matches, prefix matches)
- ✅ Anti-Gravity compliant (no framework imports)

**Code Review:**
```typescript
// ✅ Well-structured use-case
export async function resolveRoute(
  deps: ResolveRouteDeps,
  input: ResolveRouteInput
): Promise<ResolvedRoute | null>
```

**Dependencies Ready:**
- ✅ `InMemoryRouteRegistry` in container
- ✅ `InMemoryCanonRegistry` in container
- ✅ Container exports `canonRegistry` and `routes`

---

#### ❌ Task 2: Gateway Route Handler
**Status:** ❌ **Not Implemented**

**Expected Location:** `apps/kernel/app/api/gateway/[...path]/route.ts`

**Planned Functionality:**
1. Extract route prefix from path (e.g., `/api/gateway/canon/hrm/users` → `canon/hrm`)
2. Resolve route → canon via Registry using `resolveRoute()`
3. Forward HTTP request to Canon (`${base_url}${forward_path}`)
4. Propagate `x-correlation-id` and `x-tenant-id` headers
5. Stream response back to client

**Current State:**
- ❌ File does not exist
- ❌ No gateway route handler
- ⚠️ `proxy.ts` exists but only handles correlation ID for `/api/*` routes (not gateway forwarding)

**Gap Analysis:**
```
Planned:  /api/gateway/canon/hrm/users → http://hrm:3002/users
Actual:   Route does not exist

Next.js 16 Route Pattern:
- File: apps/kernel/app/api/gateway/[...path]/route.ts
- Catch-all segment [...path] captures: "canon/hrm/users"
- Must extract path segments and resolve via registry
- Must use Node.js runtime for fetch() and streaming
```

---

#### ⚠️ Task 3: Correlation ID Propagation
**Status:** ⚠️ **Partial**

**Current Implementation:**
- ✅ `proxy.ts` generates/reads `x-correlation-id` for all `/api/*` routes
- ❌ No propagation to upstream Canon services
- ❌ Gateway route doesn't exist to forward headers

**Planned Behavior:**
```typescript
// Gateway should forward:
headers: {
  'x-correlation-id': correlationId,
  'x-tenant-id': tenantId,
  // ... other headers
}
```

**Current Behavior:**
```typescript
// proxy.ts only adds to response, not forwarded requests
res.headers.set("x-correlation-id", correlationId);
```

---

#### ❌ Task 4: HTTP Request Forwarding
**Status:** ❌ **Not Implemented**

**Required Functionality:**
- Forward GET/POST/PUT/DELETE/PATCH requests
- Preserve request body for POST/PUT/PATCH
- Preserve query parameters
- Handle HTTP status codes
- Handle errors (timeout, connection refused, etc.)

**Missing Implementation:**
- No HTTP client logic (fetch/axios)
- No request body forwarding
- No error handling for Canon failures
- No timeout configuration

---

#### ❌ Task 5: Response Streaming
**Status:** ❌ **Not Implemented**

**Required Functionality:**
- Stream response body from Canon to client
- Preserve response headers (Content-Type, etc.)
- Handle streaming responses (chunked transfer)
- Handle binary data

**Missing Implementation:**
- No response streaming logic
- No header forwarding from Canon response
- No Next.js 16 streaming API usage

**Next.js 16 Best Practice:**
```typescript
// ✅ Use Response.body stream directly
const responseBody = canonResponse.body;
return new NextResponse(responseBody, {
  status: canonResponse.status,
  headers: responseHeaders,
});
```

**Benefits:**
- ✅ Efficient memory usage (no buffering)
- ✅ Supports large responses
- ✅ Handles binary data automatically
- ✅ Preserves chunked transfer encoding

---

## 🔍 Code Structure Analysis

### ✅ What Exists (Foundation)

1. **Route Resolution Use-Case** (`resolveRoute.ts`)
   - ✅ Complete implementation
   - ✅ Tested algorithm (longest prefix match)
   - ✅ Ready for integration

2. **Container Wiring** (`container.ts`)
   ```typescript
   export interface KernelContainer {
     canonRegistry: InMemoryCanonRegistry;  // ✅ Ready
     routes: InMemoryRouteRegistry;         // ✅ Ready
     // ...
   }
   ```

3. **Correlation ID Infrastructure** (`proxy.ts`)
   - ✅ Generates/reads correlation IDs
   - ⚠️ Only for response headers (not forwarding)

### ❌ What's Missing (Gateway)

1. **Gateway Route Handler**
   - File: `apps/kernel/app/api/gateway/[...path]/route.ts`
   - Status: ❌ Does not exist

2. **Request Forwarding Logic**
   - HTTP client integration
   - Request body handling
   - Query parameter forwarding

3. **Error Handling**
   - Canon not found (404)
   - Canon timeout (504)
   - Canon connection error (502)
   - Invalid route (400)

4. **Response Handling**
   - Header forwarding
   - Status code forwarding
   - Streaming support

---

## 📐 Architecture Compliance

### ✅ Anti-Gravity Compliance
- ✅ `resolveRoute()` has no framework imports
- ✅ Core logic is framework-agnostic
- ✅ Container properly separates concerns

### ✅ Next.js 16 Route Handler Pattern (Validated)
- ✅ Gateway route should follow Next.js 16 App Router pattern (consistent with existing routes):
  ```typescript
  export const runtime = "nodejs";  // ✅ Required for Node.js runtime
  
  export async function GET(request: NextRequest) { }
  export async function POST(request: NextRequest) { }
  export async function PUT(request: NextRequest) { }
  export async function DELETE(request: NextRequest) { }
  export async function PATCH(request: NextRequest) { }
  ```
  
- ✅ **Route Segment Config:** Must include `export const runtime = "nodejs"` (matches existing pattern)
- ✅ **Error Handling:** Follow existing pattern with `getCorrelationId()` and `createResponseHeaders()`
- ✅ **Response Format:** Use `NextResponse.json()` with standardized error format

### ✅ Schema-First Approach
- ⚠️ Gateway route should validate incoming requests (if needed)
- ✅ No new schemas required (uses existing registry)

---

## 🧪 Testing Status

### Planned Acceptance Tests

1. ✅ **Route Resolution** (from Phase 1)
   - `resolveRoute()` returns longest prefix match
   - ✅ Tested in Phase 1

2. ❌ **Gateway Forwarding**
   - `GET /api/gateway/canon/hrm/health` forwards to `http://localhost:3002/health`
   - ❌ Cannot test (route doesn't exist)

3. ❌ **Correlation ID Propagation**
   - Response includes `x-correlation-id` header
   - ❌ Cannot test (route doesn't exist)

### Missing Test Coverage
- Gateway route handler tests
- Request forwarding integration tests
- Error handling tests
- Response streaming tests

---

## 📊 Effort Analysis

### Planned vs Actual

| Task | Planned Time | Actual Time | Status |
|------|--------------|-------------|--------|
| Gateway Route Creation | 30 min | 0 min | ❌ Not started |
| Route Resolution Integration | 15 min | 0 min | ❌ Not started |
| HTTP Forwarding | 20 min | 0 min | ❌ Not started |
| Correlation ID Propagation | 10 min | 0 min | ❌ Not started |
| Response Streaming | 15 min | 0 min | ❌ Not started |
| **Total** | **1-2 hours** | **0 hours** | **0%** |

### Foundation Work (Phase 1)
- ✅ `resolveRoute()` use-case: **Complete** (included in Phase 1)
- ✅ Container wiring: **Complete** (included in Phase 1)
- ✅ Correlation ID infrastructure: **Partial** (proxy.ts exists)

---

## 🎯 Phase 2 Completion Criteria

### Required for Completion

- [ ] **Gateway Route Handler** (Next.js 16 Best Practices)
  - [ ] Create `apps/kernel/app/api/gateway/[...path]/route.ts`
  - [ ] Add `export const runtime = "nodejs"` (required for fetch())
  - [ ] Support all HTTP methods (GET, POST, PUT, DELETE, PATCH)
  - [ ] Extract path from `[...path]` catch-all segment
  - [ ] Call `resolveRoute()` to get Canon base URL
  - [ ] Use `getCorrelationId()` and `createResponseHeaders()` (match existing pattern)
  - [ ] Forward request to Canon with proper headers
  - [ ] Stream response back using `Response.body`
  - [ ] Handle errors with standardized format (match existing routes)

- [ ] **Request Forwarding** (Next.js 16 Best Practices)
  - [ ] Preserve request body for POST/PUT/PATCH (use `req.text()`)
  - [ ] Preserve query parameters (use `URL.searchParams`)
  - [ ] Forward headers (x-correlation-id, x-tenant-id, etc.)
  - [ ] Filter sensitive headers (host, connection, content-length)
  - [ ] Handle all HTTP methods (GET, POST, PUT, DELETE, PATCH)
  - [ ] Use `AbortController` for timeout handling (30s default)

- [ ] **Error Handling**
  - [ ] Handle route not found (404)
  - [ ] Handle Canon not found (502)
  - [ ] Handle timeout (504)
  - [ ] Handle connection errors (502)

- [ ] **Response Handling** (Next.js 16 Best Practices)
  - [ ] Forward response headers (filter sensitive ones)
  - [ ] Forward status codes and status text
  - [ ] Stream response body using `Response.body` (Next.js 16)
  - [ ] Handle binary data (automatic with streaming)
  - [ ] Preserve Content-Type and other relevant headers
  - [ ] Filter out transfer-encoding, content-encoding, connection headers

- [ ] **Testing**
  - [ ] Integration test: Register Canon → Create Route → Gateway Forward
  - [ ] Test correlation ID propagation
  - [ ] Test error cases

---

## 🔄 Dependencies & Blockers

### ✅ Ready (No Blockers)
- ✅ `resolveRoute()` use-case implemented
- ✅ Container has registry dependencies
- ✅ Registry endpoints working (Phase 1)

### ⚠️ Partial
- ⚠️ Correlation ID infrastructure exists but needs forwarding logic

### ❌ Missing
- ❌ Gateway route handler
- ❌ HTTP client integration
- ❌ Error handling patterns

---

## 💡 Recommendations

### Immediate Actions

1. **Create Gateway Route Handler** (Next.js 16 Best Practices)
   ```typescript
   // apps/kernel/app/api/gateway/[...path]/route.ts
   import { NextResponse, type NextRequest } from "next/server";
   import { getCorrelationId, createResponseHeaders } from "@/src/server/http";
   import { getKernelContainer } from "@/src/server/container";
   import { resolveRoute } from "@aibos/kernel-core";
   
   export const runtime = "nodejs";  // ✅ Required: Node.js runtime for fetch()
   
   // ✅ Next.js 16: Use dynamic route segment for catch-all
   export async function GET(req: NextRequest) {
     return handleGatewayRequest(req, "GET");
   }
   
   export async function POST(req: NextRequest) {
     return handleGatewayRequest(req, "POST");
   }
   
   export async function PUT(req: NextRequest) {
     return handleGatewayRequest(req, "PUT");
   }
   
   export async function DELETE(req: NextRequest) {
     return handleGatewayRequest(req, "DELETE");
   }
   
   export async function PATCH(req: NextRequest) {
     return handleGatewayRequest(req, "PATCH");
   }
   
   async function handleGatewayRequest(
     req: NextRequest,
     method: string
   ): Promise<NextResponse> {
     const correlationId = getCorrelationId(req);
     const container = getKernelContainer();
     
     try {
       // Extract path from [...path] segment
       // Example: /api/gateway/canon/hrm/users → /canon/hrm/users
       const pathSegments = req.nextUrl.pathname.split("/").slice(3); // Skip ["", "api", "gateway"]
       const gatewayPath = pathSegments.length > 0 ? "/" + pathSegments.join("/") : "/";
       
       // Get tenant_id (required)
       const tenantId = req.headers.get("x-tenant-id");
       if (!tenantId) {
         return NextResponse.json(
           { ok: false, error: { code: "MISSING_TENANT_ID", message: "Missing x-tenant-id header" } },
           { status: 400, headers: createResponseHeaders(correlationId) }
         );
       }
       
       // Resolve route to Canon
       const resolved = await resolveRoute(
         { routes: container.routes, canonRegistry: container.canonRegistry },
         { tenant_id: tenantId, path: gatewayPath }
       );
       
       if (!resolved) {
         return NextResponse.json(
           { ok: false, error: { code: "ROUTE_NOT_FOUND", message: "No route found for path" } },
           { status: 404, headers: createResponseHeaders(correlationId) }
         );
       }
       
       // Build Canon URL
       const canonUrl = new URL(resolved.forward_path, resolved.canon_base_url);
       // Preserve query parameters
       req.nextUrl.searchParams.forEach((value, key) => {
         canonUrl.searchParams.set(key, value);
       });
       
       // Forward request with correlation ID
       const forwardHeaders = new Headers();
       forwardHeaders.set("x-correlation-id", correlationId);
       forwardHeaders.set("x-tenant-id", tenantId);
       // Forward other headers (optional, filter sensitive ones)
       req.headers.forEach((value, key) => {
         const lowerKey = key.toLowerCase();
         // Skip sensitive headers
         if (["host", "connection", "content-length", "x-tenant-id", "x-correlation-id"].includes(lowerKey)) {
           return; // Skip (already set or sensitive)
         }
         // Forward other headers (preserve original case)
         forwardHeaders.set(key, value);
       });
       
       // Forward request body for POST/PUT/PATCH
       const body = ["POST", "PUT", "PATCH"].includes(method)
         ? await req.text()
         : undefined;
       
       // ✅ Next.js 16: Use fetch() with AbortController for timeout
       const controller = new AbortController();
       const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
       
       try {
         const canonResponse = await fetch(canonUrl.toString(), {
           method,
           headers: forwardHeaders,
           body,
           signal: controller.signal,
         });
         
         clearTimeout(timeoutId);
         
         // ✅ Next.js 16: Stream response body
         const responseBody = canonResponse.body;
         
         // Forward response headers (filter sensitive ones)
         const responseHeaders = new Headers(createResponseHeaders(correlationId));
         canonResponse.headers.forEach((value, key) => {
           if (!["content-encoding", "transfer-encoding", "connection"].includes(key.toLowerCase())) {
             responseHeaders.set(key, value);
           }
         });
         
         // ✅ Next.js 16: Use Response with streaming
         return new NextResponse(responseBody, {
           status: canonResponse.status,
           statusText: canonResponse.statusText,
           headers: responseHeaders,
         });
       } catch (fetchError: unknown) {
         clearTimeout(timeoutId);
         
         if (fetchError instanceof Error && fetchError.name === "AbortError") {
           return NextResponse.json(
             { ok: false, error: { code: "GATEWAY_TIMEOUT", message: "Request to Canon timed out" } },
             { status: 504, headers: createResponseHeaders(correlationId) }
           );
         }
         
         // Connection error
         return NextResponse.json(
           { ok: false, error: { code: "GATEWAY_ERROR", message: "Failed to connect to Canon" } },
           { status: 502, headers: createResponseHeaders(correlationId) }
         );
       }
     } catch (error) {
       console.error("[Kernel] Gateway error:", error);
       return NextResponse.json(
         { ok: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
         { status: 500, headers: createResponseHeaders(correlationId) }
       );
     }
   }
   ```

2. **Implement Request Forwarding** (Next.js 16 Best Practices)
   - ✅ Use `fetch()` API (Node.js 18+, available in Next.js 16)
   - ✅ Use `AbortController` for timeout handling (30s default)
   - ✅ Forward correlation ID and tenant ID headers
   - ✅ Preserve query parameters from original request
   - ✅ Preserve request body for POST/PUT/PATCH
   - ✅ Filter sensitive headers (host, connection, content-length)
   - ✅ Handle AbortError for timeouts (504)
   - ✅ Handle connection errors (502)

3. **Add Error Handling** (Match Existing Pattern)
   - ✅ Route not found → 404 (ROUTE_NOT_FOUND)
   - ✅ Canon not found → 502 (GATEWAY_ERROR)
   - ✅ Timeout → 504 (GATEWAY_TIMEOUT)
   - ✅ Connection error → 502 (GATEWAY_ERROR)
   - ✅ Missing tenant ID → 400 (MISSING_TENANT_ID)
   - ✅ Internal error → 500 (INTERNAL_ERROR)
   - ✅ Use standardized error format: `{ ok: false, error: { code, message }, correlation_id }`
   - ✅ Log errors with correlation ID for tracing

4. **Test Integration**
   - Register test Canon
   - Create test route
   - Test gateway forwarding
   - Verify correlation ID propagation

### Code Quality (Next.js 16 Best Practices)

- ✅ **Route Segment Config:** Always include `export const runtime = "nodejs"` (required for fetch())
- ✅ **Type Safety:** Use TypeScript strict mode (already enabled)
- ✅ **Error Handling:** Follow existing pattern with `getCorrelationId()` and `createResponseHeaders()`
- ✅ **Response Format:** Use standardized error format matching existing routes
- ✅ **Streaming:** Use `Response` with `body` stream for efficient forwarding
- ✅ **Header Filtering:** Filter sensitive headers (host, connection, content-encoding)
- ✅ **Timeout Handling:** Use `AbortController` with 30s default timeout
- ✅ **Logging:** Log errors with correlation ID for distributed tracing
- ✅ **Query Parameters:** Preserve query string from original request

### Performance (Next.js 16 Optimizations)

- ✅ **Timeout Configuration:** 30s default (configurable via environment variable)
- ✅ **Streaming Responses:** Use `Response.body` stream for efficient data transfer
- ✅ **Connection Reuse:** Node.js fetch() automatically handles connection pooling
- ✅ **Route Resolution Caching:** Optional optimization (can cache resolved routes per tenant)
- ⚠️ **Edge Runtime:** Not recommended (gateway needs Node.js runtime for fetch() and streaming)
- ✅ **Memory Efficiency:** Stream large responses instead of buffering

---

## 📈 Progress Tracking

### Phase 2 Completion: 0% (0/5 tasks)

- [ ] Gateway route handler created
- [ ] Route resolution integrated
- [ ] HTTP forwarding implemented
- [ ] Correlation ID propagation working
- [ ] Response streaming implemented

### Overall Build 2 Status

- ✅ Phase 1: Service Registry — **100% Complete**
- ❌ Phase 2: API Gateway — **0% Complete**
- ❌ Phase 3: Event Bus — **Not Started**
- ❌ Phase 4: Audit Query — **Not Started**

**Build 2 Overall:** **25% Complete** (1/4 phases)

---

## 🎓 Lessons Learned

### What Went Well
- ✅ Phase 1 foundation is solid
- ✅ `resolveRoute()` is well-designed and ready
- ✅ Container architecture supports gateway needs

### What's Missing
- ❌ Gateway route handler not created
- ❌ No HTTP forwarding implementation
- ❌ Correlation ID forwarding not implemented

### Next Steps
1. Implement gateway route handler (highest priority)
2. Add HTTP forwarding logic
3. Test end-to-end flow
4. Document gateway usage

---

**Status:** ⚠️ **Phase 2 Incomplete** — Foundation ready, gateway route missing  
**Recommendation:** Implement gateway route handler to complete Phase 2  
**Estimated Remaining Effort:** 1-2 hours (as originally planned)

---

## ✅ Next.js 16 Validation Summary

### Code Patterns Validated
- ✅ Route handler pattern matches existing codebase (`export const runtime = "nodejs"`)
- ✅ Error handling pattern matches existing routes (`getCorrelationId`, `createResponseHeaders`)
- ✅ Response format matches existing standardized error format
- ✅ HTTP utilities already exist and are reusable

### Next.js 16 Best Practices Applied
- ✅ Node.js runtime required for fetch() and streaming
- ✅ Catch-all segment `[...path]` correctly documented
- ✅ Path extraction logic validated
- ✅ Streaming response pattern using `Response.body`
- ✅ Timeout handling with `AbortController`
- ✅ Header filtering for security

### Gaps Identified & Fixed
- ✅ Updated recommendations to match existing codebase patterns
- ✅ Added Next.js 16 specific route segment config requirements
- ✅ Corrected path extraction logic for catch-all segments
- ✅ Added streaming response best practices
- ✅ Updated error handling to match existing format
- ✅ Added timeout handling with AbortController

### Ready for Implementation
- ✅ All patterns validated against existing codebase
- ✅ Recommendations align with Next.js 16 best practices
- ✅ Code examples match actual implementation patterns
- ✅ No architectural conflicts identified
