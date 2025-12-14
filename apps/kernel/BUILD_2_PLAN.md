# Build 2 Development Plan — Service Registry + Gateway + Event Bus

**Based on:** PRD-KERNEL.md  
**Status:** 📋 Ready for Implementation  
**Estimated Scope:** 3-4 development sessions

---

## 🎯 Build 2 Goals

Based on PRD Section 4 (MVP Scope), Build 2 implements:

1. **Service Registry** — Canon discovery and routing (Section D)
2. **API Gateway** — Single ingress with routing (Section C)
3. **Event Bus** — Minimal pub/sub (Section E)
4. **Audit Query** — Query audit trail (Section F)

---

## 📦 Build 2 Deliverables

### ✅ Must Have (Core Functionality)

- [ ] **Service Registry Endpoints**
  - `POST /api/kernel/registry/canons` — Register a Canon
  - `GET /api/kernel/registry/canons` — List registered Canons
  - `POST /api/kernel/registry/routes` — Create route mapping
  - `GET /api/kernel/registry/routes` — List route mappings

- [ ] **API Gateway Route**
  - `GET/POST/PUT/DELETE /api/gateway/[...path]` — Proxy to Canons
  - Registry-driven routing (`route_prefix → canon_base_url`)
  - Correlation ID propagation
  - Basic request forwarding

- [ ] **Event Bus (Minimal)**
  - `POST /api/kernel/events/publish` — Publish event with envelope
  - In-memory event storage (adapter pattern)
  - Standard event envelope enforced

- [ ] **Audit Query**
  - `GET /api/kernel/audit/events` — Query audit trail
  - Filter by: `tenant_id`, `actor_id`, `correlation_id`, `time_range`

### 🔄 Nice to Have (Can Defer)

- [ ] Health check tracking for Canons
- [ ] Event subscription interface (for Build 3)
- [ ] RBAC gate at Gateway (minimal — defer to Build 3)

---

## 🏗️ Implementation Structure

### 1. Contracts (Schema-First)

**New Files:**
```
packages/contracts/src/
  kernel/
    registry.schema.ts      ← Canon + Route schemas
    events.schema.ts        ← Event envelope + publish schemas
    audit-query.schema.ts   ← Audit query filters + response
```

**Key Schemas:**
- `CanonRegistryRequest` — Register Canon (name, version, base_url, capabilities)
- `CanonRegistryResponse` — Canon DTO
- `RouteRegistryRequest` — Create route (route_prefix, canon_id, tenant_id)
- `EventPublishRequest` — Event envelope
- `AuditQueryRequest` — Query filters
- `AuditQueryResponse` — Paginated audit events

### 2. Kernel Core (Domain + Use-Cases)

**New Files:**
```
packages/kernel-core/src/
  domain/
    canon.ts               ← Canon entity
    route.ts               ← Route mapping entity
    event.ts               ← Event envelope domain type
  
  ports/
    canonRegistryPort.ts   ← Canon registry interface
    routeRegistryPort.ts   ← Route registry interface
    eventBusPort.ts        ← Event bus interface (publish)
    auditQueryPort.ts      ← Audit query interface
  
  application/
    registerCanon.ts        ← Register Canon use-case
    listCanons.ts          ← List Canons use-case
    createRoute.ts         ← Create route mapping use-case
    listRoutes.ts          ← List routes use-case
    resolveRoute.ts        ← Resolve route → canon (for Gateway)
    publishEvent.ts        ← Publish event use-case
    queryAudit.ts          ← Query audit events use-case
```

### 3. Kernel Adapters (In-Memory)

**New Files:**
```
packages/kernel-adapters/src/
  memory/
    canonRegistry.memory.ts  ← In-memory Canon storage
    routeRegistry.memory.ts  ← In-memory Route storage
    eventBus.memory.ts        ← In-memory Event Bus
    auditQuery.memory.ts      ← In-memory Audit query
```

### 4. API Routes (Next.js)

**New Files:**
```
apps/kernel/app/api/kernel/
  registry/
    canons/route.ts        ← POST/GET canons
    routes/route.ts        ← POST/GET routes
  
  events/
    publish/route.ts       ← POST publish event
  
  audit/
    events/route.ts        ← GET query audit
  
  gateway/
    [...path]/route.ts     ← Gateway proxy (all methods)
```

---

## 🔑 Key Implementation Details

### Service Registry

**Canon Entity:**
```typescript
type Canon = {
  id: string;
  tenant_id: string;
  canon_key: string;      // e.g., "HRM", "CRM"
  version: string;        // e.g., "1.0.0"
  base_url: string;       // e.g., "http://hrm:3002"
  status: "ACTIVE" | "SUSPENDED";
  capabilities?: string[]; // Optional
  created_at: string;
};
```

**Route Mapping:**
```typescript
type Route = {
  id: string;
  tenant_id: string;
  route_prefix: string;   // e.g., "/canon/hrm"
  canon_id: string;
  created_at: string;
};
```

### API Gateway

**Gateway Logic:**
1. Extract `route_prefix` from path (e.g., `/api/gateway/canon/hrm/users` → `canon/hrm`)
2. Lookup route in Registry → get `canon_id`
3. Lookup canon → get `base_url`
4. Forward request to `${base_url}${remaining_path}`
5. Propagate `x-correlation-id` and `x-tenant-id` headers
6. Stream response back

**Example:**
```
Request: GET /api/gateway/canon/hrm/users
→ Resolve: route_prefix="canon/hrm" → canon_id → base_url="http://hrm:3002"
→ Forward: GET http://hrm:3002/users
→ Response: Stream back to client
```

### Event Bus

**Event Envelope (from PRD):**
```typescript
type KernelEventEnvelope<TPayload = unknown> = {
  version: "1.0";
  event_name: string;        // e.g., "invoice.created"
  source: "kernel" | "canon" | "molecule" | "cell";
  tenant_id: string;
  actor_id?: string;
  correlation_id: string;
  timestamp: string;          // ISO 8601
  payload: TPayload;
};
```

**In-Memory Implementation:**
- Store events in array (for MVP)
- Later swap to Redis/NATS without changing core

### Audit Query

**Query Filters:**
```typescript
type AuditQueryFilters = {
  tenant_id?: string;
  actor_id?: string;
  correlation_id?: string;
  action?: string;
  resource?: string;
  result?: "OK" | "FAIL" | "ALLOW" | "DENY";
  start_time?: string;        // ISO 8601
  end_time?: string;          // ISO 8601
  limit?: number;             // Default: 50
  offset?: number;            // Default: 0
};
```

---

## 📋 Implementation Checklist

### Phase 1: Service Registry (2-3 hours)

- [ ] Create `packages/contracts/src/kernel/registry.schema.ts`
  - [ ] `CanonRegistryRequest` schema
  - [ ] `CanonRegistryResponse` schema
  - [ ] `RouteRegistryRequest` schema
  - [ ] `RouteRegistryResponse` schema

- [ ] Create `packages/kernel-core/src/domain/canon.ts`
- [ ] Create `packages/kernel-core/src/domain/route.ts`
- [ ] Create `packages/kernel-core/src/ports/canonRegistryPort.ts`
- [ ] Create `packages/kernel-core/src/ports/routeRegistryPort.ts`
- [ ] Create `packages/kernel-core/src/application/registerCanon.ts`
- [ ] Create `packages/kernel-core/src/application/listCanons.ts`
- [ ] Create `packages/kernel-core/src/application/createRoute.ts`
- [ ] Create `packages/kernel-core/src/application/listRoutes.ts`
- [ ] Create `packages/kernel-core/src/application/resolveRoute.ts`

- [ ] Create `packages/kernel-adapters/src/memory/canonRegistry.memory.ts`
- [ ] Create `packages/kernel-adapters/src/memory/routeRegistry.memory.ts`

- [ ] Update `apps/kernel/src/server/container.ts` (add registry adapters)
- [ ] Create `apps/kernel/app/api/kernel/registry/canons/route.ts`
- [ ] Create `apps/kernel/app/api/kernel/registry/routes/route.ts`

### Phase 2: API Gateway (1-2 hours)

- [ ] Create `apps/kernel/app/api/gateway/[...path]/route.ts`
  - [ ] Extract route prefix from path
  - [ ] Resolve route → canon via Registry
  - [ ] Forward HTTP request to Canon
  - [ ] Propagate correlation ID
  - [ ] Stream response

### Phase 3: Event Bus (1-2 hours)

- [ ] Create `packages/contracts/src/kernel/events.schema.ts`
  - [ ] `EventEnvelope` schema
  - [ ] `EventPublishRequest` schema

- [ ] Create `packages/kernel-core/src/domain/event.ts`
- [ ] Create `packages/kernel-core/src/ports/eventBusPort.ts`
- [ ] Create `packages/kernel-core/src/application/publishEvent.ts`

- [ ] Create `packages/kernel-adapters/src/memory/eventBus.memory.ts`

- [ ] Update `apps/kernel/src/server/container.ts` (add event bus)
- [ ] Create `apps/kernel/app/api/kernel/events/publish/route.ts`

### Phase 4: Audit Query (1 hour)

- [ ] Create `packages/contracts/src/kernel/audit-query.schema.ts`
  - [ ] `AuditQueryFilters` schema
  - [ ] `AuditQueryResponse` schema

- [ ] Create `packages/kernel-core/src/ports/auditQueryPort.ts`
- [ ] Create `packages/kernel-core/src/application/queryAudit.ts`

- [ ] Update `packages/kernel-adapters/src/memory/audit.memory.ts` (add query method)
- [ ] Create `apps/kernel/app/api/kernel/audit/events/route.ts`

---

## 🧪 Acceptance Tests

### Service Registry
1. `POST /api/kernel/registry/canons` with `{canon_key: "HRM", version: "1.0.0", base_url: "http://hrm:3002"}` returns Canon DTO
2. `GET /api/kernel/registry/canons` returns list containing HRM
3. `POST /api/kernel/registry/routes` with `{route_prefix: "/canon/hrm", canon_id: "..."}` returns Route DTO
4. `GET /api/kernel/registry/routes` returns route mapping

### API Gateway
1. Register Canon HRM at `http://localhost:3002`
2. Create route mapping `/canon/hrm` → HRM Canon
3. `GET /api/gateway/canon/hrm/health` forwards to `http://localhost:3002/health`
4. Response includes `x-correlation-id` header

### Event Bus
1. `POST /api/kernel/events/publish` with event envelope returns 200 OK
2. Event stored with all envelope fields
3. Event includes correlation_id from request

### Audit Query
1. `GET /api/kernel/audit/events?tenant_id=...` returns filtered audit events
2. `GET /api/kernel/audit/events?correlation_id=...` returns events for correlation
3. Pagination works (limit/offset)

---

## 🚀 Build 2 Success Criteria

Build 2 is complete when:

- ✅ Canon can be registered via Registry API
- ✅ Route mapping can be created
- ✅ Gateway successfully routes request to Canon
- ✅ Event can be published with standard envelope
- ✅ Audit events can be queried by filters
- ✅ All requests validated by contracts schemas
- ✅ All mutations write audit events
- ✅ Anti-Gravity architecture maintained

---

## 📊 Estimated Effort

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Registry | 15 tasks | 2-3 hours |
| Phase 2: Gateway | 5 tasks | 1-2 hours |
| Phase 3: Event Bus | 8 tasks | 1-2 hours |
| Phase 4: Audit Query | 6 tasks | 1 hour |
| **Total** | **34 tasks** | **5-8 hours** |

---

## 🔄 After Build 2 (Build 3 Preview)

- Users & Roles (IAM)
- JWT authentication
- RBAC enforcement at Gateway
- Health check tracking for Canons
- Event subscription (if needed)

---

## 📝 Notes

- **Keep it simple:** In-memory adapters are fine for MVP
- **Schema-first:** All APIs must have Zod schemas
- **Anti-Gravity:** Maintain clean separation (core → adapters)
- **Audit everything:** All mutations write audit events
- **Correlation IDs:** Propagate through Gateway to Canons

---

**Ready to start Build 2?** Begin with Phase 1 (Service Registry) — it's the foundation for the Gateway.
