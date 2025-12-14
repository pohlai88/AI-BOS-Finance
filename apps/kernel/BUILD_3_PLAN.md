# Build 3: Identity & Access Management (IAM)

**Goal:** Transform the Kernel from an open relay to a secured, multi-tenant platform with RBAC.  
**Status:** 📅 Planning  
**Target Duration:** 6-8 Weeks  
**Prerequisites:** Build 2 Complete ✅

---

## 🎯 Objectives

### Primary Goals
1. **User Management:** Create/invite users, manage profiles
2. **Authentication:** JWT-based login/logout with refresh tokens
3. **Authorization:** Role-Based Access Control (RBAC) at Gateway level
4. **Tenant Management:** Tenant creation, settings, admin assignment
5. **Security Audit:** Enhanced audit trail with access denied events

### Success Criteria
- [ ] Users can authenticate with email/password
- [ ] JWT tokens are issued and verified at Gateway
- [ ] RBAC policies are enforced for all protected endpoints
- [ ] Audit trail captures all access denied events
- [ ] Multi-tenant isolation is maintained (no cross-tenant leaks)

---

## 🏗 Phase 3.1: IAM Foundation (Database & CRUD)

**Duration:** 2 weeks  
**Objective:** Replace in-memory storage with Postgres (Drizzle ORM) and establish User/Tenant entities.

### 1. Database Setup

**Technology Stack:**
- **Database:** PostgreSQL 16
- **ORM:** Drizzle ORM (type-safe, lightweight)
- **Migrations:** Drizzle Kit
- **Local Dev:** Docker Compose

**Docker Compose Setup:**
```yaml
# docker-compose.yml (in apps/kernel/)
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: kernel_dev
      POSTGRES_USER: kernel
      POSTGRES_PASSWORD: kernel_dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 2. Database Schema

**Location:** `packages/db/schema/iam.ts`

```typescript
import { pgTable, uuid, varchar, timestamp, text, boolean, jsonb } from 'drizzle-orm/pg-core';

// Tenants
export const tenants = pgTable('kernel_tenant', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
  config: jsonb('config'), // Tenant-specific settings
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Users
export const users = pgTable('kernel_user', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').references(() => tenants.id).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Roles
export const roles = pgTable('kernel_role', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  permissions: jsonb('permissions'), // Array of permission codes
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// User Roles (many-to-many)
export const userRoles = pgTable('kernel_user_role', {
  user_id: uuid('user_id').references(() => users.id).notNull(),
  role_id: uuid('role_id').references(() => roles.id).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Permissions (system-defined)
export const permissions = pgTable('kernel_permission', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 255 }).notNull().unique(),
  description: text('description'),
  category: varchar('category', { length: 100 }), // e.g., "registry", "audit", "gateway"
  created_at: timestamp('created_at').defaultNow().notNull(),
});
```

### 3. Core Use-Cases (Anti-Gravity)

**Location:** `packages/kernel-core/src/application/iam/`

```typescript
// createTenant.ts (already exists, extend)
export async function createTenant(
  deps: { tenantRepo: TenantRepoPort; audit: AuditPort },
  input: { name: string; correlation_id: string; actor_id?: string }
): Promise<Tenant> {
  // ... existing implementation ...
}

// createUser.ts (new)
export async function createUser(
  deps: { userRepo: UserRepoPort; audit: AuditPort },
  input: {
    tenant_id: string;
    email: string;
    name: string;
    password: string;
    correlation_id: string;
  }
): Promise<User> {
  // 1. Hash password (bcrypt)
  // 2. Create user
  // 3. Append audit event
  // 4. Return user
}

// inviteUser.ts (new)
export async function inviteUser(
  deps: { userRepo: UserRepoPort; audit: AuditPort },
  input: {
    tenant_id: string;
    email: string;
    name: string;
    role_ids: string[];
    correlation_id: string;
  }
): Promise<{ user_id: string; invite_token: string }> {
  // 1. Create user with temporary password
  // 2. Generate invite token
  // 3. Assign roles
  // 4. Append audit event
  // 5. Return invite details
}

// assignRole.ts (new)
export async function assignRole(
  deps: { roleRepo: RoleRepoPort; audit: AuditPort },
  input: {
    user_id: string;
    role_id: string;
    tenant_id: string;
    correlation_id: string;
  }
): Promise<void> {
  // 1. Verify role exists for tenant
  // 2. Assign role to user
  // 3. Append audit event
}
```

### 4. API Endpoints

**Location:** `apps/kernel/app/api/kernel/iam/`

- `POST /api/kernel/iam/tenants` — Create tenant (platform admin only)
- `GET /api/kernel/iam/tenants` — List tenants (platform admin only)
- `POST /api/kernel/iam/users` — Create user
- `POST /api/kernel/iam/users/invite` — Invite user (email)
- `GET /api/kernel/iam/users` — List users for tenant
- `GET /api/kernel/iam/users/{id}` — Get user details
- `POST /api/kernel/iam/roles` — Create role
- `GET /api/kernel/iam/roles` — List roles for tenant
- `POST /api/kernel/iam/roles/{id}/assign` — Assign role to user

### 5. Contracts

**Location:** `packages/contracts/src/kernel/iam.schema.ts`

```typescript
export const TenantCreateRequest = z.object({
  name: z.string().min(1).max(255),
});

export const UserCreateRequest = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  password: z.string().min(8).max(255),
});

export const UserInviteRequest = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  role_ids: z.array(z.string().uuid()),
});

export const RoleCreateRequest = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  permissions: z.array(z.string()),
});

export const RoleAssignRequest = z.object({
  user_id: z.string().uuid(),
  role_id: z.string().uuid(),
});
```

---

## 🔐 Phase 3.2: Authentication (JWT)

**Duration:** 2 weeks  
**Objective:** Secure the API Gateway with stateless JWT authentication.

### 1. JWT Strategy

**Technology:**
- **Library:** `jose` (Edge Runtime compatible, modern)
- **Algorithm:** HS256 (symmetric signing)
- **Storage:** HttpOnly cookies for refresh tokens, Authorization header for access tokens

**Token Structure:**
```json
{
  "sub": "user_123",           // User ID
  "tid": "tenant_456",         // Tenant ID
  "email": "user@example.com",
  "roles": ["admin", "editor"],
  "iat": 1735689600,          // Issued at
  "exp": 1735693200           // Expires at (1 hour)
}
```

**Token Lifecycle:**
- **Access Token:** 1 hour (Authorization header)
- **Refresh Token:** 7 days (HttpOnly cookie)

### 2. Authentication Use-Cases

**Location:** `packages/kernel-core/src/application/auth/`

```typescript
// login.ts
export async function login(
  deps: { userRepo: UserRepoPort; audit: AuditPort },
  input: { email: string; password: string; correlation_id: string }
): Promise<{ user: User; access_token: string; refresh_token: string }> {
  // 1. Find user by email
  // 2. Verify password (bcrypt)
  // 3. Generate access token (1h)
  // 4. Generate refresh token (7d)
  // 5. Append audit event (LOGIN_SUCCESS)
  // 6. Return tokens
}

// logout.ts
export async function logout(
  deps: { audit: AuditPort },
  input: { user_id: string; correlation_id: string }
): Promise<void> {
  // 1. Append audit event (LOGOUT)
  // 2. (Optional) Add token to blacklist
}

// refreshToken.ts
export async function refreshToken(
  deps: { userRepo: UserRepoPort },
  input: { refresh_token: string }
): Promise<{ access_token: string; refresh_token: string }> {
  // 1. Verify refresh token
  // 2. Generate new access token
  // 3. Optionally rotate refresh token
  // 4. Return new tokens
}

// verifyToken.ts
export async function verifyToken(
  token: string,
  secret: string
): Promise<TokenPayload | null> {
  // 1. Verify JWT signature
  // 2. Check expiry
  // 3. Return decoded payload
}
```

### 3. Auth Endpoints

**Location:** `apps/kernel/app/api/kernel/auth/`

- `POST /api/kernel/auth/login` — Login (returns access + refresh tokens)
- `POST /api/kernel/auth/logout` — Logout (invalidates session)
- `POST /api/kernel/auth/refresh` — Refresh access token
- `POST /api/kernel/auth/verify` — Verify token validity
- `POST /api/kernel/auth/reset-password` — Reset password (email flow)

### 4. Gateway JWT Middleware

**Location:** `apps/kernel/middleware.ts` (update)

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/src/server/auth";

const PUBLIC_ROUTES = ["/api/health", "/api/kernel/auth/login"];

export async function middleware(req: NextRequest) {
  // Skip auth for public routes
  if (PUBLIC_ROUTES.some((route) => req.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Extract token from Authorization header
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing authorization token",
        },
      },
      { status: 401 }
    );
  }

  // Verify JWT
  const decoded = await verifyToken(token, process.env.JWT_SECRET!);
  if (!decoded) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Token verification failed",
        },
      },
      { status: 401 }
    );
  }

  // Inject user context into headers (for downstream handlers)
  const res = NextResponse.next();
  res.headers.set("x-tenant-id", decoded.tid);
  res.headers.set("x-user-id", decoded.sub);
  res.headers.set("x-user-roles", JSON.stringify(decoded.roles));

  return res;
}

export const config = {
  matcher: ["/api/kernel/:path*", "/api/gateway/:path*"],
};
```

---

## 🛡 Phase 3.3: Authorization (RBAC)

**Duration:** 2 weeks  
**Objective:** Implement fine-grained permission checks at the Gateway level.

### 1. Permission Model

**Permission Codes:**
```
# Identity & Access
iam.tenants.read
iam.tenants.write
iam.users.read
iam.users.write
iam.roles.read
iam.roles.write

# Registry
registry.canons.read
registry.canons.write
registry.routes.read
registry.routes.write

# Audit
audit.events.read

# Gateway
gateway.proxy.*              # Can use API Gateway for any Canon
gateway.proxy.{canon_key}    # Can proxy specific Canon
```

### 2. RBAC Use-Cases

**Location:** `packages/kernel-core/src/application/rbac/`

```typescript
// checkPermission.ts
export async function checkPermission(
  deps: { roleRepo: RoleRepoPort },
  input: { user_id: string; permission_code: string }
): Promise<boolean> {
  // 1. Get user roles
  // 2. Get permissions for roles
  // 3. Check if permission exists
  // 4. Return boolean
}

// evaluatePolicy.ts
export async function evaluatePolicy(
  deps: { roleRepo: RoleRepoPort },
  input: {
    user_id: string;
    resource: string; // e.g., "/api/kernel/registry/canons"
    action: string;   // e.g., "POST"
  }
): Promise<{ allowed: boolean; reason?: string }> {
  // 1. Map resource + action to permission code
  // 2. Check permission
  // 3. Return decision
}
```

### 3. Gateway RBAC Middleware

**Location:** `apps/kernel/src/server/policy.ts` (new)

```typescript
import { NextRequest } from "next/server";
import { checkPermission } from "@aibos/kernel-core";
import { getKernelContainer } from "./container";

/**
 * Enforce permission check
 * 
 * @returns true if allowed, false if denied
 */
export async function enforcePermission(
  req: NextRequest,
  requiredPermission: string
): Promise<boolean> {
  const userId = req.headers.get("x-user-id");
  if (!userId) return false;

  const container = getKernelContainer();

  const hasPermission = await checkPermission(
    { roleRepo: container.roles },
    { user_id: userId, permission_code: requiredPermission }
  );

  // Append audit event for denials
  if (!hasPermission) {
    await container.audit.append({
      tenant_id: req.headers.get("x-tenant-id") || undefined,
      actor_id: userId,
      action: "ACCESS_DENIED",
      resource: req.nextUrl.pathname,
      result: "DENY",
      correlation_id: req.headers.get("x-correlation-id") || crypto.randomUUID(),
      http_method: req.method,
      http_path: req.nextUrl.pathname,
    });
  }

  return hasPermission;
}
```

### 4. Protected Route Example

**Location:** `apps/kernel/app/api/kernel/registry/canons/route.ts` (update)

```typescript
import { enforcePermission } from "@/src/server/policy";

export async function POST(req: NextRequest) {
  // Check permission BEFORE processing
  const hasPermission = await enforcePermission(req, "registry.canons.write");
  if (!hasPermission) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions",
        },
      },
      { status: 403 }
    );
  }

  // ... existing canon registration logic ...
}
```

---

## 📋 Prerequisites for Build 3 Kickoff

### Infrastructure
- [ ] Docker Compose for PostgreSQL 16
- [ ] Drizzle ORM setup in `packages/db`
- [ ] Environment variables configured (`.env.local`)

### Dependencies
- [ ] Install Drizzle ORM: `pnpm add drizzle-orm`
- [ ] Install Drizzle Kit: `pnpm add -D drizzle-kit`
- [ ] Install postgres driver: `pnpm add postgres`
- [ ] Install jose (JWT): `pnpm add jose`
- [ ] Install bcrypt: `pnpm add bcrypt @types/bcrypt`

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://kernel:kernel_dev_password@localhost:5432/kernel_dev

# JWT
JWT_SECRET=your-256-bit-secret-key-here
JWT_ISSUER=kernel
JWT_AUDIENCE=kernel-api
JWT_ACCESS_EXPIRY=3600    # 1 hour
JWT_REFRESH_EXPIRY=604800 # 7 days

# Email (for invites, optional for Phase 3.1)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=
```

---

## 🧪 Testing Strategy

### Phase 3.1 Tests
- [ ] Tenant CRUD
- [ ] User CRUD
- [ ] Role CRUD
- [ ] Multi-tenant isolation (Postgres-backed)

### Phase 3.2 Tests
- [ ] Login flow
- [ ] Token refresh
- [ ] Token expiry
- [ ] Invalid credentials

### Phase 3.3 Tests
- [ ] Permission checks
- [ ] Access denied audit events
- [ ] RBAC enforcement at Gateway

---

## 📊 Success Metrics

### Performance Targets
- Login latency: < 200ms (p95)
- Permission check: < 50ms (p95)
- Database query: < 100ms (p95)

### Security Targets
- Zero cross-tenant data leaks
- 100% audit coverage for access denied events
- JWT secret rotation strategy documented

---

## 🚀 Rollout Plan

### Week 1-2: Phase 3.1 (IAM Foundation)
- Day 1-2: Database schema + migrations
- Day 3-4: Tenant/User CRUD use-cases
- Day 5-7: API endpoints + contracts
- Day 8-10: Testing + validation

### Week 3-4: Phase 3.2 (Authentication)
- Day 1-3: JWT implementation + use-cases
- Day 4-5: Auth endpoints
- Day 6-7: Gateway middleware integration
- Day 8-10: Testing + security audit

### Week 5-6: Phase 3.3 (Authorization)
- Day 1-3: Permission model + RBAC use-cases
- Day 4-5: Policy enforcement at Gateway
- Day 6-7: Audit trail for denials
- Day 8-10: End-to-end testing

### Week 7-8: Validation & Documentation
- Integration testing
- Load testing (with JWT overhead)
- Security audit
- API documentation (OpenAPI)
- Deployment guide

---

## ⚠️ Known Risks & Mitigations

### Risk 1: JWT Secret Compromise
**Mitigation:** Implement secret rotation strategy, use environment-specific secrets

### Risk 2: Password Storage
**Mitigation:** Use bcrypt with cost factor 12, salt rounds

### Risk 3: Performance Impact
**Mitigation:** Cache permission checks (5-minute TTL), optimize role queries

### Risk 4: Multi-tenant Leakage
**Mitigation:** Row-level security in Postgres, extensive testing

---

## 📚 References

- **Drizzle ORM Docs:** https://orm.drizzle.team/
- **jose (JWT):** https://github.com/panva/jose
- **NIST Password Guidelines:** https://pages.nist.gov/800-63-3/
- **OWASP Auth Cheat Sheet:** https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

---

**Status:** Ready for Build 3 kickoff after Phase 2.5 validation ✅
