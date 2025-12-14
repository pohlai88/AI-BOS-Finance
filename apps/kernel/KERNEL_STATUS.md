# Kernel MVP Status Report

**Last Updated:** 2025-12-14  
**Version:** Build 3.3 (MVP Complete)  
**Status:** ✅ Ready for Integration Testing

---

## Executive Summary

The AI-BOS Kernel MVP is **feature-complete** with all core control plane capabilities implemented and tested. The Kernel provides multi-tenant IAM, RBAC, service registry, API gateway, event bus, and audit trail with deterministic bootstrap and comprehensive security enforcement.

### Core Capabilities

| Capability | Status | Description |
|-----------|--------|-------------|
| **Multi-tenant IAM** | ✅ Complete | User/Role management with tenant isolation |
| **RBAC Enforcement** | ✅ Complete | Permission-based access control at Kernel + Gateway |
| **Service Registry** | ✅ Complete | Canon registration + route mappings |
| **API Gateway** | ✅ Complete | Tenant-aware proxy with RBAC enforcement |
| **Event Bus** | ✅ Complete | Standard event envelope + in-memory publish |
| **Audit Trail** | ✅ Complete | Comprehensive logging including DENY events |
| **Bootstrap Security** | ✅ Complete | Deterministic first-user setup with key protection |

---

## Architecture Overview

### Hexagonal Architecture (Ports & Adapters)

```
┌─────────────────────────────────────────────────────────────┐
│ API Layer (Next.js App Router)                              │
│ - /api/kernel/iam/*        (User/Role/Login)               │
│ - /api/kernel/registry/*   (Canon/Route Registration)      │
│ - /api/kernel/events/*     (Event Publish)                 │
│ - /api/kernel/audit/*      (Audit Query)                   │
│ - /api/gateway/*           (Proxies to Canons)             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Application Layer (Use Cases)                               │
│ - createUser, createRole, assignRole, grantPermission      │
│ - authorize (RBAC policy engine)                           │
│ - registerCanon, createRoute, resolveRoute                 │
│ - publishEvent, queryAudit                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Domain Layer                                                │
│ - User, Role, Permission, RolePermission                   │
│ - Canon, Route                                             │
│ - Event, AuditEvent                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Ports (Interfaces)                                          │
│ - UserRepo, RoleRepo, PermissionRepo, RolePermissionRepo  │
│ - CanonRepo, RouteRepo                                     │
│ - EventBus, AuditRepo                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Adapters (In-Memory MVP)                                    │
│ - Memory implementations for all repos                      │
│ - State lost on restart (documented MVP limitation)        │
└─────────────────────────────────────────────────────────────┘
```

---

## API Surface (MVP)

### IAM Endpoints

| Endpoint | Method | RBAC Required | Bootstrap Allowed |
|----------|--------|---------------|-------------------|
| `/api/kernel/iam/users` | POST | `kernel.iam.user.create` | ✅ (0 users) |
| `/api/kernel/iam/users` | GET | `kernel.iam.user.list` | ❌ |
| `/api/kernel/iam/users/:id/set-password` | POST | `kernel.iam.credential.set_password` | ✅ (1 user) |
| `/api/kernel/iam/login` | POST | Public | ✅ |
| `/api/kernel/iam/logout` | POST | Authenticated | ❌ |
| `/api/kernel/iam/me` | GET | Authenticated | ❌ |
| `/api/kernel/iam/roles` | POST | `kernel.iam.role.create` | ❌ |
| `/api/kernel/iam/roles` | GET | `kernel.iam.role.list` | ❌ |
| `/api/kernel/iam/roles/:id/assign` | POST | `kernel.iam.role.assign` | ❌ |
| `/api/kernel/iam/roles/:id/permissions` | POST | `kernel.iam.role.create` | ❌ |

### Registry Endpoints

| Endpoint | Method | RBAC Required |
|----------|--------|---------------|
| `/api/kernel/registry/canons` | POST | `kernel.registry.canon.register` |
| `/api/kernel/registry/canons` | GET | Authenticated |
| `/api/kernel/registry/routes` | POST | `kernel.registry.route.create` |
| `/api/kernel/registry/routes` | GET | Authenticated |

### Event & Audit Endpoints

| Endpoint | Method | RBAC Required | Notes |
|----------|--------|---------------|-------|
| `/api/kernel/events/publish` | POST | ⚠️ **Not Enforced** | Permission defined but not implemented |
| `/api/kernel/audit/events` | GET | `kernel.audit.read` | Query params: `correlation_id`, `actor_id`, `action`, `limit`, `offset` |

### Gateway Endpoint

| Endpoint | Method | RBAC Required | Notes |
|----------|--------|---------------|-------|
| `/api/gateway/{path}` | GET/POST/PUT/DELETE | Defined in route registry | `required_permissions` array per route |

### Health Endpoints

| Endpoint | Method | RBAC Required |
|----------|--------|---------------|
| `/api/health` | GET | Public |
| `/api/kernel/health` | GET | Public |

---

## RBAC Permission Model

### Permission Naming Convention

`kernel.<domain>.<resource>.<action>`

### All Defined Permissions

```typescript
// IAM Domain
kernel.iam.user.create
kernel.iam.user.list
kernel.iam.role.create
kernel.iam.role.list
kernel.iam.role.assign
kernel.iam.credential.set_password

// Registry Domain
kernel.registry.canon.register
kernel.registry.route.create
kernel.registry.route.list

// Gateway Domain
kernel.gateway.proxy.invoke

// Event Domain
kernel.event.publish        // ⚠️ Defined but not enforced

// Audit Domain
kernel.audit.read
```

---

## Security Model

### Bootstrap Security (Deterministic)

**Requirements:**
- Environment variable: `KERNEL_BOOTSTRAP_KEY` (must be set)
- Header: `x-kernel-bootstrap-key` (must match env var)
- Tenant state: must be empty (0 users) or exactly 1 user for `set_password`

**Allowlist:**
1. `POST /api/kernel/iam/users` — Only when `existingUsers.total === 0`
2. `POST /api/kernel/iam/users/:id/set-password` — Only when `existingUsers.total === 1` and `:id` matches existing user
3. `POST /api/kernel/iam/login` — Always allowed

**Security Properties:**
- Bootstrap key must be explicit (no default)
- Bootstrap fails closed (returns 403 BOOTSTRAP_DENIED)
- Tenant isolation enforced (bootstrap cannot cross tenant boundaries)
- After bootstrap, all endpoints require RBAC

### Tenant Authority Model

| Phase | Tenant Source | Authority |
|-------|--------------|-----------|
| Bootstrap | `x-tenant-id` header | Required |
| Login | `x-tenant-id` header | Required to select tenant |
| Protected Calls | JWT `tid` claim | **Authoritative** (header ignored) |

**Security Properties:**
- JWT embeds `tenant_id`, `user_id` (sub), `session_id` (sid)
- JWT verified on all protected endpoints
- RBAC scoped to JWT `tenant_id` only
- Cross-tenant access denied at authorization layer

### RBAC Enforcement

**Two Enforcement Points:**

1. **Kernel Admin Endpoints** — Direct permission checks via `enforceRBAC()`
   - Extracts JWT claims
   - Calls `authorize()` use-case
   - Returns 403 with `missing_permissions` on DENY
   - Writes `authz.deny` audit event

2. **Gateway** — Route-level permission checks via registry
   - Route records include `required_permissions: string[]`
   - Empty array = public route
   - Gateway checks permissions before proxying
   - Returns 403 + audit on DENY

---

## MVP Limitations (Known Constraints)

### 1. In-Memory Adapters Only

**Impact:**
- All state (users, roles, routes, events, audit) stored in-memory
- Data lost on server restart
- No persistence layer

**Mitigation:**
- Documented in `docs/canon-integration-guide.md`
- Explicitly noted in OpenAPI description
- Production requires DB adapters (Supabase planned)

### 2. Single-Process Only

**Impact:**
- No horizontal scaling
- All state in single Node.js process
- No load balancing

**Mitigation:**
- Documented as MVP limitation
- Hexagonal architecture allows easy adapter swap
- Production requires distributed state (Redis/Postgres)

### 3. Event Publish RBAC Not Enforced

**Impact:**
- `/api/kernel/events/publish` does NOT check `kernel.event.publish` permission
- Permission is defined and can be granted, but enforcement is missing

**Evidence:**
- `apps/kernel/app/api/kernel/events/publish/route.ts` — No JWT verification or RBAC check

**Mitigation:**
- Documented in integration guide + OpenAPI
- Permission included in role grants for forward compatibility
- Next build should add RBAC enforcement

### 4. No Tenant CRUD API

**Impact:**
- Tenants are implicit (created on first user bootstrap)
- No explicit tenant management endpoints
- Tenant lifecycle not managed

**Mitigation:**
- Acceptable for MVP (tenant = namespace)
- Production may require explicit tenant provisioning

### 5. No Tenant ID UUID Enforcement (String Accepted)

**Impact:**
- Contracts schema requires UUID format for `tenant_id`
- Runtime accepts arbitrary strings
- Bootstrap examples use "demo-tenant" (not UUID)

**Evidence:**
- `packages/contracts/src/kernel/events.schema.ts` — `tenant_id: z.string().uuid()`
- Integration guide examples use string literals

**Mitigation:**
- Documented as accepted deviation
- Validation not strictly enforced for MVP flexibility

---

## Test Coverage

### Acceptance Tests

| Test Suite | Location | Status | Purpose |
|------------|----------|--------|---------|
| Build 3.1 | `__tests__/build-3.1-acceptance.js` | ✅ Passing | IAM + Tenancy |
| Build 3.2 | `__tests__/build-3.2-acceptance.js` | ✅ Passing | JWT Authentication |
| Build 3.3 | `__tests__/build-3.3-acceptance.js` | ✅ Passing | RBAC Enforcement |

### Integration Tests

| Test Suite | Location | Status | Coverage |
|------------|----------|--------|----------|
| E2E Test | `__tests__/integration/e2e.test.ts` | ✅ Passing | Full workflow (bootstrap → audit) |

### Load Tests

| Test Suite | Location | Status | Notes |
|------------|----------|--------|-------|
| Gateway Load | `__tests__/load/gateway.k6.js` | ⚠️ Exists | Baseline not recorded |

---

## Documentation

### Developer Docs

| Document | Location | Purpose | Status |
|----------|----------|---------|--------|
| **Canon Integration Guide** | `docs/canon-integration-guide.md` | Step-by-step onboarding for Canon developers | ✅ Complete |
| **OpenAPI Spec** | `docs/openapi.yaml` | Full API reference with schemas + examples | ✅ Complete |
| **README** | `README.md` | Quick start + architecture overview | ✅ Complete |
| **PRD** | `PRD-KERNEL.md` | Product requirements + build history | ✅ Complete |

### Key Documentation Features

**Canon Integration Guide:**
- Bootstrap security model with examples
- Full 8-step workflow (bootstrap → audit)
- Error troubleshooting with response examples
- Complete bash script for automation
- MVP limitations explicitly documented

**OpenAPI Spec:**
- All endpoints with request/response schemas
- Security schemes (JWT Bearer + Bootstrap key)
- Custom headers (`x-tenant-id`, `x-correlation-id`, `x-kernel-bootstrap-key`)
- Comprehensive error responses (401/403/404/400/500)
- MVP limitations in description

---

## Known Gaps & Next Steps

### P0 — Blocking MVP Ship

**None.** All P0 requirements are met.

### P1 — Strongly Recommended Before Production

1. **Event Publish RBAC Enforcement**
   - **Gap:** `/api/kernel/events/publish` does not check `kernel.event.publish`
   - **File:** `apps/kernel/app/api/kernel/events/publish/route.ts`
   - **Fix:** Add JWT verification + `enforceRBAC()` call
   - **Effort:** 15-30 minutes

2. **Database Adapters (Supabase)**
   - **Gap:** All repos are in-memory
   - **Impact:** Data loss on restart, no multi-instance support
   - **Fix:** Implement Supabase adapters for all repos
   - **Effort:** 4-6 hours
   - **Dependencies:** Supabase setup, migrations, connection pooling

3. **Load Test Baselines**
   - **Gap:** `gateway.k6.js` exists but no recorded baseline
   - **Fix:** Run k6 test, record p95/p99 targets, document in README
   - **Effort:** 1 hour

4. **Correlation ID Strict Validation**
   - **Gap:** Server accepts any string as correlation ID
   - **Impact:** Log/audit injection possible
   - **Fix:** Validate UUID format, generate if invalid
   - **Effort:** 30 minutes

### P2 — Nice to Have

1. **Tenant CRUD API**
   - **Gap:** No explicit tenant management
   - **Impact:** Tenants are implicit
   - **Fix:** Add `/api/kernel/tenants` (POST/GET/PATCH/DELETE)
   - **Effort:** 2-3 hours

2. **Gateway Header Allowlist**
   - **Gap:** No explicit hop-by-hop header filtering
   - **Impact:** Potential header pollution
   - **Fix:** Strip `Connection`, `Keep-Alive`, etc. before proxying
   - **Effort:** 1 hour

3. **Performance Metrics**
   - **Gap:** No structured metrics (only logs)
   - **Impact:** No p95/p99 visibility
   - **Fix:** Add Prometheus client or structured JSON metrics
   - **Effort:** 2-3 hours

---

## Evidence Pointers

### Core Use Cases

| Use Case | Domain File | Application File | Route File | Test File |
|----------|-------------|------------------|------------|-----------|
| Create User | `domain/user.ts` | `application/createUser.ts` | `api/kernel/iam/users/route.ts` | `build-3.1-acceptance.js` |
| Create Role | `domain/role.ts` | `application/createRole.ts` | `api/kernel/iam/roles/route.ts` | `build-3.1-acceptance.js` |
| Authorize | `domain/permission.ts` | `application/authorize.ts` | `server/rbac.ts` | `build-3.3-acceptance.js` |
| Register Canon | `domain/canon.ts` | `application/registerCanon.ts` | `api/kernel/registry/canons/route.ts` | `e2e.test.ts` |
| Gateway Proxy | `domain/registry.ts` | `application/resolveRoute.ts` | `api/gateway/[...path]/route.ts` | `e2e.test.ts` |
| Publish Event | `domain/event.ts` | `application/publishEvent.ts` | `api/kernel/events/publish/route.ts` | `e2e.test.ts` |

### Security Enforcement

| Feature | Implementation File | Test File | Evidence |
|---------|---------------------|-----------|----------|
| Bootstrap Gate | `src/server/bootstrap.ts` | `build-3.3-acceptance.js` | Lines 1-92 |
| JWT Verification | `src/server/jwt.ts` | `build-3.2-acceptance.js` | Lines 1-89 |
| RBAC Enforcement (Kernel) | `src/server/rbac.ts` | `build-3.3-acceptance.js` | Lines 1-92 |
| RBAC Enforcement (Gateway) | `api/gateway/[...path]/route.ts` | `build-3.3-acceptance.js` | Lines 180-210 |
| Audit DENY Events | `src/server/rbac.ts` | `build-3.3-acceptance.js` | Lines 60-75 |

---

## How to Run

### Prerequisites

```bash
# Install dependencies (from monorepo root)
pnpm install

# Set environment variables
cp apps/kernel/.env.local.example apps/kernel/.env.local
# Edit .env.local and set:
# - KERNEL_BOOTSTRAP_KEY=<your-secret-key>
# - JWT_SECRET=<your-jwt-secret>
```

### Development Server

```bash
# Start Kernel dev server
pnpm -C apps/kernel dev
# Server runs at http://localhost:3001
```

### Run Tests

```bash
# Acceptance tests (require running server)
node apps/kernel/__tests__/build-3.3-acceptance.js

# Integration tests
pnpm -C apps/kernel test

# Load tests
k6 run apps/kernel/__tests__/load/gateway.k6.js
```

### Integration Workflow

See `docs/canon-integration-guide.md` for complete step-by-step workflow.

**Quick Start:**
```bash
# 1. Bootstrap admin user
curl -X POST http://localhost:3001/api/kernel/iam/users \
  -H "x-tenant-id: demo-tenant" \
  -H "x-kernel-bootstrap-key: ${KERNEL_BOOTSTRAP_KEY}" \
  -d '{"email":"admin@demo.local","name":"Admin"}'

# 2. Set password
curl -X POST http://localhost:3001/api/kernel/iam/users/{userId}/set-password \
  -H "x-tenant-id: demo-tenant" \
  -H "x-kernel-bootstrap-key: ${KERNEL_BOOTSTRAP_KEY}" \
  -d '{"password":"ChangeMe123!"}'

# 3. Login to get JWT
curl -X POST http://localhost:3001/api/kernel/iam/login \
  -H "x-tenant-id: demo-tenant" \
  -d '{"email":"admin@demo.local","password":"ChangeMe123!"}'

# 4. Use JWT for all subsequent calls
# See canon-integration-guide.md for complete workflow
```

---

## Ship Checklist

### ✅ MVP Requirements Met

- [x] Multi-tenant IAM with user/role management
- [x] RBAC with permission-based authorization
- [x] Service registry (Canon + Route management)
- [x] API Gateway with tenant isolation + RBAC
- [x] Event Bus with standard envelope
- [x] Audit Trail with DENY logging
- [x] Bootstrap security (deterministic, key-protected)
- [x] JWT authentication with session management
- [x] Acceptance tests for all builds
- [x] Integration test for full workflow
- [x] Developer documentation (integration guide + OpenAPI)

### ⚠️ Known Limitations Documented

- [x] In-memory adapters (data loss on restart)
- [x] Single-process only (no horizontal scaling)
- [x] Event Publish RBAC not enforced
- [x] No explicit tenant CRUD

### 📋 Production Checklist (P1)

- [ ] Implement Event Publish RBAC enforcement
- [ ] Add Supabase adapters for persistence
- [ ] Record load test baselines (p95/p99)
- [ ] Add correlation ID strict validation

---

## Conclusion

The Kernel MVP is **feature-complete and ready for integration testing** with Canon services. All core control plane capabilities are implemented, tested, and documented. Known limitations are explicitly tracked and non-blocking for MVP ship.

**Next Phase:** Integrate with first Canon (e.g., HRM or CRM) and validate the full control plane → Canon → Gateway workflow under realistic load.

---

**Document Version:** 1.0.0  
**Last Build:** Build 3.3 (RBAC Enforcement)  
**Last Test Run:** 2025-12-14 (All acceptance tests passing)
