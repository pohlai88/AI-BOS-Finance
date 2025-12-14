# Kernel Quick Reference

**Version:** Build 2 (Complete)  
**Last Updated:** 2025-12-13

---

## 🚀 Quick Start

### Start Kernel Dev Server
```bash
cd apps/kernel
pnpm dev
# Server starts on http://localhost:3001
```

### Run Tests (Future)
```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

---

## 📡 API Endpoints

### Service Registry

#### Register Canon
```bash
POST /api/kernel/registry/canons
Headers:
  x-tenant-id: <uuid>
  x-correlation-id: <uuid> (optional)
Body:
{
  "canon_key": "hrm",
  "version": "1.0.0",
  "base_url": "http://localhost:4001",
  "status": "ACTIVE",
  "capabilities": ["employees.read", "employees.write"]
}
Response: 201
{
  "id": "<uuid>",
  "tenant_id": "<uuid>",
  "canon_key": "hrm",
  "version": "1.0.0",
  "base_url": "http://localhost:4001",
  "status": "ACTIVE",
  "capabilities": ["employees.read", "employees.write"],
  "created_at": "2025-12-13T10:00:00Z"
}
```

#### List Canons
```bash
GET /api/kernel/registry/canons
Headers:
  x-tenant-id: <uuid>
Response: 200
{
  "items": [...]
}
```

#### Create Route Mapping
```bash
POST /api/kernel/registry/routes
Headers:
  x-tenant-id: <uuid>
Body:
{
  "route_prefix": "/canon/hrm",
  "canon_id": "<uuid>"
}
Response: 201
{
  "id": "<uuid>",
  "tenant_id": "<uuid>",
  "route_prefix": "/canon/hrm",
  "canon_id": "<uuid>",
  "created_at": "2025-12-13T10:00:00Z"
}
```

#### List Routes
```bash
GET /api/kernel/registry/routes
Headers:
  x-tenant-id: <uuid>
Response: 200
{
  "items": [...]
}
```

---

### API Gateway

#### Proxy to Canon
```bash
# Any HTTP method supported
GET /api/gateway/canon/hrm/employees?limit=10
Headers:
  x-tenant-id: <uuid>
  x-correlation-id: <uuid> (optional, auto-generated)

# Gateway will:
# 1. Resolve route: /canon/hrm → Canon base_url
# 2. Forward to: http://localhost:4001/employees?limit=10
# 3. Propagate headers: x-correlation-id, x-tenant-id
# 4. Stream response back
```

**Timeout:** Configurable via `GATEWAY_TIMEOUT_MS` (default: 30000ms)

---

### Event Bus

#### Publish Event
```bash
POST /api/kernel/events/publish
Headers:
  x-tenant-id: <uuid>
Body:
{
  "event_name": "employee.created",
  "source": "canon",
  "tenant_id": "<uuid>",
  "actor_id": "<uuid>",
  "payload": {
    "employee_id": "E001",
    "name": "John Doe"
  }
}
Response: 201
{
  "ok": true,
  "data": {
    "event_id": "<uuid>",
    "correlation_id": "<uuid>",
    "timestamp": "2025-12-13T10:00:00Z"
  },
  "correlation_id": "<uuid>"
}
```

---

### Audit Query

#### Query Audit Events
```bash
GET /api/kernel/audit/events?action=kernel.registry.canon.register&limit=50
Headers:
  x-tenant-id: <uuid>
Query Params:
  correlation_id: <uuid> (optional)
  actor_id: <uuid> (optional)
  action: string (optional)
  resource: string (optional)
  result: OK|FAIL|ALLOW|DENY (optional)
  start_time: ISO 8601 (optional)
  end_time: ISO 8601 (optional)
  limit: 1-200 (default: 50)
  offset: number (default: 0)
Response: 200
{
  "ok": true,
  "data": {
    "events": [...],
    "total": 100,
    "limit": 50,
    "offset": 0
  },
  "correlation_id": "<uuid>"
}
```

---

## 🔧 Environment Variables

### Gateway Configuration
```bash
# Timeout for Canon requests (milliseconds)
GATEWAY_TIMEOUT_MS=30000  # default: 30s
```

### Database (Future - Build 3)
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/kernel
```

### Auth (Future - Build 3)
```bash
JWT_SECRET=your-secret-key
JWT_ISSUER=kernel
JWT_AUDIENCE=kernel-api
JWT_EXPIRY=3600  # seconds
```

---

## 📦 Package Structure

### Core Packages
```
@aibos/contracts        # Zod schemas, types (shared)
@aibos/kernel-core      # Pure business logic (no framework)
@aibos/kernel-adapters  # In-memory implementations (swap for prod)
```

### Import Examples
```typescript
// In apps/kernel/app/api/*/route.ts
import { CanonCreateRequest, CanonDTO } from "@aibos/contracts";
import { registerCanon } from "@aibos/kernel-core";
import { getKernelContainer } from "@/src/server/container";

// Never import adapters directly in core
// ❌ import { InMemoryCanonRegistry } from "@aibos/kernel-adapters";
// ✅ Use dependency injection via container
```

---

## 🏗️ Architecture Patterns

### Anti-Gravity (Hexagonal Architecture)

**Dependency Flow (downward only):**
```
apps/kernel (Next.js routes)
   ↓ imports
packages/kernel-core (pure logic)
   ↓ implemented by
packages/kernel-adapters (DB/EventBus/etc)
```

**Forbidden:**
- ❌ kernel-core importing Next.js
- ❌ kernel-core importing adapters
- ❌ kernel-core importing DB/ORM
- ❌ UI importing adapters directly

### Schema-First (Zod)

**Pattern:**
```typescript
// 1. Define contract in @aibos/contracts
export const CanonCreateRequest = z.object({
  canon_key: z.string(),
  version: z.string(),
  // ...
});

// 2. Use in route handler
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CanonCreateRequest.parse(body); // ✅ Validated
  // ...
}
```

### Dependency Injection

**Pattern:**
```typescript
// Container wiring (apps/kernel/src/server/container.ts)
export function getKernelContainer(): KernelContainer {
  return {
    canonRegistry: new InMemoryCanonRegistry(),
    routes: new InMemoryRouteRegistry(),
    eventBus: new InMemoryEventBus(),
    audit: new InMemoryAudit(),
  };
}

// Use-case invocation
const container = getKernelContainer();
const canon = await registerCanon(
  { canonRegistry: container.canonRegistry, audit: container.audit },
  input
);
```

---

## 🔍 Debugging

### Correlation ID Tracing
```bash
# All logs include correlation_id
# Search logs by correlation_id to trace full request

# Gateway logs:
[Kernel] Gateway request: /api/gateway/canon/hrm/employees
  correlation_id: abc-123
  tenant_id: tenant-1

# Use-case logs:
[Kernel] registerCanon: canon=hrm
  correlation_id: abc-123

# Audit logs:
[Kernel] Audit event written: action=kernel.registry.canon.register
  correlation_id: abc-123
```

### Query Audit Trail
```bash
# Find all events for a specific request
GET /api/kernel/audit/events?correlation_id=abc-123

# Find all events by a specific actor
GET /api/kernel/audit/events?actor_id=user-123

# Find all failures
GET /api/kernel/audit/events?result=FAIL
```

---

## 🧪 Testing Patterns (Future)

### Use-Case Testing
```typescript
import { registerCanon } from "@aibos/kernel-core";
import { InMemoryCanonRegistry, InMemoryAudit } from "@aibos/kernel-adapters";

describe("registerCanon", () => {
  it("should register canon and write audit event", async () => {
    const canonRegistry = new InMemoryCanonRegistry();
    const audit = new InMemoryAudit();

    const canon = await registerCanon(
      { canonRegistry, audit },
      {
        tenant_id: "tenant-1",
        correlation_id: "test-123",
        canon_key: "hrm",
        version: "1.0.0",
        base_url: "http://localhost:4001",
        status: "ACTIVE",
        capabilities: [],
      }
    );

    expect(canon.canon_key).toBe("hrm");
    expect(audit.list()).toHaveLength(1);
  });
});
```

### API Route Testing
```typescript
import { POST } from "@/app/api/kernel/registry/canons/route";
import { NextRequest } from "next/server";

describe("POST /api/kernel/registry/canons", () => {
  it("should register canon", async () => {
    const req = new NextRequest("http://localhost:3001/api/kernel/registry/canons", {
      method: "POST",
      headers: { "x-tenant-id": "tenant-1" },
      body: JSON.stringify({
        canon_key: "hrm",
        version: "1.0.0",
        base_url: "http://localhost:4001",
        status: "ACTIVE",
        capabilities: [],
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(201);
  });
});
```

---

## 📚 Documentation

### Build 2 Docs
- [PRD-KERNEL.md](./PRD-KERNEL.md) — Product requirements + status
- [BUILD_STATUS.md](./BUILD_STATUS.md) — Visual dashboard
- [BUILD_2_COMPLETE.md](./BUILD_2_COMPLETE.md) — Summary
- [BUILD_2_PLAN.md](./BUILD_2_PLAN.md) — Implementation plan
- Phase completion docs (PHASE1-4)

### Architecture
- Anti-Gravity enforcement (no framework in core)
- Schema-first contracts (Zod)
- Dependency injection (container)
- Multi-tenant isolation (header-enforced)

---

## 🚨 Common Issues

### 1. Missing x-tenant-id Header
```
Error: Missing x-tenant-id header
Solution: Add header to all requests
```

### 2. Canon Not Found
```
Error: No matching route for path: /canon/hrm/employees
Solution: Register Canon and create route mapping first
```

### 3. Gateway Timeout
```
Error: Canon request timed out after 30000ms
Solution: 
- Check Canon is running
- Increase GATEWAY_TIMEOUT_MS if needed
- Check Canon response time
```

### 4. Validation Error
```
Error: Invalid request body
Details: { expected: "string", received: "number", path: ["version"] }
Solution: Check request body matches schema (see contracts)
```

---

## 🎯 Next Steps

### For Developers
1. Read [PRD-KERNEL.md](./PRD-KERNEL.md) for context
2. Read [BUILD_STATUS.md](./BUILD_STATUS.md) for current state
3. Start dev server: `pnpm dev`
4. Test APIs with curl/Postman
5. Review code in `packages/kernel-core`

### For Testers
1. Review [BUILD_2_COMPLETE.md](./BUILD_2_COMPLETE.md)
2. Run integration tests (checklist in phase docs)
3. Report issues with correlation_id
4. Check audit trail for evidence

### For Product
1. Build 2 is 100% complete ✅
2. Next: Production testing (integration, load, security)
3. Build 3 planning: IAM + RBAC (Q1 2025)

---

**🎉 Build 2 Complete!**  
**Questions? Check [BUILD_STATUS.md](./BUILD_STATUS.md) or [PRD-KERNEL.md](./PRD-KERNEL.md)**
