# Canon Integration Guide (Kernel MVP)

## Prerequisites

- Kernel dev server running (default: http://localhost:3001)
- Environment:
  - `KERNEL_BOOTSTRAP_KEY` set in the server process

## Concepts

- **Tenant**: isolated control plane namespace (UUID format required for all API calls)
- **Canon**: a registered target service (control plane record)
- **Route**: mapping from gateway path → canon target + permissions
- **RBAC**: requests require a JWT + permissions, unless the route is explicitly public (no `required_permissions`)

## MVP Limitations

> These are known constraints of the MVP Kernel:

1. **In-Memory Adapters Only** — All state (users, roles, events, routes) is stored in-memory. Data is lost on server restart.
2. **Single-Process Only** — No horizontal scaling. All state is in the single Node.js process.
3. **Event Publish RBAC** — The `kernel.event.publish` permission is defined but not enforced at `/api/kernel/events/publish`. Enforcement is planned.
4. **No Tenant CRUD** — Tenants are implicit (created on first user bootstrap). No explicit tenant management API.

## Required Headers

- `x-tenant-id`: required for control-plane calls (registry/IAM) and public gateway calls
- `Authorization: Bearer <token>`: required for protected calls
- `x-correlation-id` (optional): if provided and valid UUID, it is propagated; otherwise Kernel generates one
- `x-kernel-bootstrap-key`: required for bootstrap operations (create first user, set password)

### Tenant Authority Rule (Critical)

| Phase | Tenant Source | Notes |
|-------|--------------|-------|
| **Bootstrap** (`create_user`, `set_password`) | `x-tenant-id` header | Required, must match `x-kernel-bootstrap-key` |
| **Login** | `x-tenant-id` header | Required to select tenant context |
| **Protected Endpoints** (after login) | **JWT `tid` claim** | Authoritative. `x-tenant-id` header is ignored; cross-tenant access is denied |

> ⚠️ **Security:** After login, the JWT's embedded `tenant_id` is the only trusted source. Any `x-tenant-id` header on protected endpoints is **non-authoritative** and must not be used to cross tenant boundaries.

---

## Step 1 — Bootstrap first admin (one-time per tenant)

> Bootstrap is only allowed for an empty tenant and requires `x-kernel-bootstrap-key`.

### 1A) Create user (bootstrap)

```bash
curl -s -X POST http://localhost:3001/api/kernel/iam/users \
  -H "content-type: application/json" \
  -H "x-tenant-id: demo-tenant" \
  -H "x-kernel-bootstrap-key: ${KERNEL_BOOTSTRAP_KEY}" \
  -d '{"email":"admin@demo.local","name":"Admin"}'
```

**Response (201 Created):**
```json
{
  "id": "110e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "demo-tenant",
  "email": "admin@demo.local",
  "name": "Admin",
  "status": "ACTIVE",
  "created_at": "2025-12-14T10:00:00.000Z"
}
```

**Extract User ID:**
```bash
export USER_ID="110e8400-e29b-41d4-a716-446655440000"
```

### 1B) Set password (bootstrap)

```bash
curl -s -X POST http://localhost:3001/api/kernel/iam/users/${USER_ID}/set-password \
  -H "content-type: application/json" \
  -H "x-tenant-id: demo-tenant" \
  -H "x-kernel-bootstrap-key: ${KERNEL_BOOTSTRAP_KEY}" \
  -d '{"password":"ChangeMe123!"}'
```

**Response (200 OK):**
```json
{
  "ok": true,
  "data": {
    "user_id": "110e8400-e29b-41d4-a716-446655440000"
  },
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Step 2 — Login and obtain JWT

```bash
curl -s -X POST http://localhost:3001/api/kernel/iam/login \
  -H "content-type: application/json" \
  -H "x-tenant-id: demo-tenant" \
  -d '{"email":"admin@demo.local","password":"ChangeMe123!"}'
```

**Response (200 OK):**
```json
{
  "ok": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600
  },
  "correlation_id": "660e8400-e29b-41d4-a716-446655440000"
}
```

**Store the token:**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Step 3 — Create role and grant permissions

### 3A) Create role

```bash
curl -s -X POST http://localhost:3001/api/kernel/iam/roles \
  -H "content-type: application/json" \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"name":"canon-admin"}'
```

**Response (201 Created):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "demo-tenant",
  "name": "canon-admin",
  "created_at": "2025-12-14T10:01:00.000Z"
}
```

**Extract Role ID:**
```bash
export ROLE_ID="770e8400-e29b-41d4-a716-446655440000"
```

### 3B) Grant permissions to role

Grant only what you need. Typical minimum for onboarding a canon:

- `kernel.registry.canon.register` - Register a new Canon
- `kernel.registry.route.create` - Create route mappings
- `kernel.gateway.proxy.invoke` - Invoke gateway routes
- `kernel.event.publish` - Publish events to Event Bus
- `kernel.audit.read` (optional) - Query audit trail

```bash
curl -s -X POST http://localhost:3001/api/kernel/iam/roles/${ROLE_ID}/permissions \
  -H "content-type: application/json" \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "permissions": [
      "kernel.registry.canon.register",
      "kernel.registry.route.create",
      "kernel.gateway.proxy.invoke",
      "kernel.event.publish"
    ]
  }'
```

**Response (200 OK):**
```json
{
  "ok": true,
  "data": {
    "role_id": "770e8400-e29b-41d4-a716-446655440000",
    "permissions": [
      "kernel.registry.canon.register",
      "kernel.registry.route.create",
      "kernel.gateway.proxy.invoke",
      "kernel.event.publish"
    ]
  },
  "correlation_id": "880e8400-e29b-41d4-a716-446655440000"
}
```

### 3C) Assign role to user

```bash
curl -s -X POST http://localhost:3001/api/kernel/iam/roles/${ROLE_ID}/assign \
  -H "content-type: application/json" \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"user_id\":\"${USER_ID}\"}"
```

**Response (200 OK):**
```json
{
  "ok": true,
  "data": {
    "user_id": "110e8400-e29b-41d4-a716-446655440000",
    "role_id": "770e8400-e29b-41d4-a716-446655440000"
  },
  "correlation_id": "990e8400-e29b-41d4-a716-446655440000"
}
```

---

## Step 4 — Register Canon

```bash
curl -s -X POST http://localhost:3001/api/kernel/registry/canons \
  -H "content-type: application/json" \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "canon_key": "canon.demo",
    "version": "1.0.0",
    "base_url": "http://localhost:4000",
    "status": "ACTIVE",
    "capabilities": ["ping", "health"]
  }'
```

**Response (201 Created):**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "demo-tenant",
  "canon_key": "canon.demo",
  "version": "1.0.0",
  "base_url": "http://localhost:4000",
  "status": "ACTIVE",
  "capabilities": ["ping", "health"],
  "created_at": "2025-12-14T10:02:00.000Z"
}
```

**Extract Canon ID:**
```bash
export CANON_ID="aa0e8400-e29b-41d4-a716-446655440000"
```

---

## Step 5 — Create route mapping (with required_permissions)

```bash
curl -s -X POST http://localhost:3001/api/kernel/registry/routes \
  -H "content-type: application/json" \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"route_prefix\": \"/demo/ping\",
    \"canon_id\": \"${CANON_ID}\",
    \"required_permissions\": [\"kernel.gateway.proxy.invoke\"]
  }"
```

**Response (201 Created):**
```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "demo-tenant",
  "route_prefix": "/demo/ping",
  "canon_id": "aa0e8400-e29b-41d4-a716-446655440000",
  "required_permissions": ["kernel.gateway.proxy.invoke"],
  "created_at": "2025-12-14T10:03:00.000Z"
}
```

**Note:** Gateway path = `/api/gateway` + `route_prefix` = `/api/gateway/demo/ping`

---

## Step 6 — Invoke via Gateway

```bash
curl -s -X GET http://localhost:3001/api/gateway/demo/ping \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "message": "pong"
}
```

**Note:** The Gateway forwards the request to the Canon's `base_url` + the remaining path after `route_prefix`. In this case, it forwards to `http://localhost:4000/ping` (since `route_prefix` is `/demo/ping` and the gateway path is `/api/gateway/demo/ping`, the remaining path is `/ping`).

---

## Step 7 — Publish Event

> ⚠️ **Current Status:** This endpoint currently does NOT enforce RBAC (`kernel.event.publish` permission). This is a known implementation gap. The permission is defined in PRD but enforcement is pending. Always include it in role grants for forward compatibility.

```bash
curl -s -X POST http://localhost:3001/api/kernel/events/publish \
  -H "content-type: application/json" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"event_name\": \"canon.demo.ping\",
    \"source\": \"canon\",
    \"tenant_id\": \"${TENANT_ID}\",
    \"payload\": {
      \"message\": \"Ping successful\",
      \"timestamp\": \"2025-12-14T10:04:00.000Z\"
    }
  }"
```

**Response (201 Created):**
```json
{
  "ok": true,
  "event_id": "cc0e8400-e29b-41d4-a716-446655440000",
  "correlation_id": "dd0e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-12-14T10:04:00.000Z"
}
```

**Notes:**
- The `tenant_id` in the request body **must be a valid UUID** and match the JWT's tenant_id
- For forward compatibility, grant `kernel.event.publish` permission to roles that will publish events

---

## Step 8 — Query Audit Trail

```bash
curl -s -X GET "http://localhost:3001/api/kernel/audit/events?limit=10" \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Response (200 OK):**
```json
{
  "ok": true,
  "data": {
    "events": [
      {
        "id": "ee0e8400-e29b-41d4-a716-446655440000",
        "tenant_id": "demo-tenant",
        "actor_id": "110e8400-e29b-41d4-a716-446655440000",
        "action": "kernel.registry.canon.register",
        "resource": "canon:aa0e8400-e29b-41d4-a716-446655440000",
        "result": "OK",
        "correlation_id": "ff0e8400-e29b-41d4-a716-446655440000",
        "created_at": "2025-12-14T10:02:00.000Z"
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
  },
  "correlation_id": "000e8400-e29b-41d4-a716-446655440000"
}
```

**Note:** Requires `kernel.audit.read` permission (optional, add to Step 3B if needed).

---

## Troubleshooting

### Common Error Responses

#### 401 UNAUTHORIZED
```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid Authorization header"
  },
  "correlation_id": "..."
}
```

**Causes:**
- Missing `Authorization: Bearer <token>` header
- Invalid or expired token
- Bootstrap denied and request fell into RBAC (tenant has users but bootstrap key missing/wrong)

#### 403 FORBIDDEN
```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions",
    "details": {
      "required_permissions": ["kernel.gateway.proxy.invoke"],
      "missing_permissions": ["kernel.gateway.proxy.invoke"]
    }
  },
  "correlation_id": "..."
}
```

**Causes:**
- JWT is valid but user's role lacks required permissions
- Check role permissions in Step 3B

#### 404 ROUTE_NOT_FOUND
```json
{
  "ok": false,
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "No route mapping found for path"
  },
  "correlation_id": "..."
}
```

**Causes:**
- Route mapping not created (Step 5)
- Path mismatch (gateway path must match `/api/gateway` + `route_prefix`)

#### 400 VALIDATION_ERROR
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "path": ["canon_key"],
        "message": "Required"
      }
    ]
  },
  "correlation_id": "..."
}
```

**Causes:**
- Missing required fields in request body
- Invalid field values (e.g., `canon_id` instead of `canon_key`)

### Bootstrap Denied

**Error:**
```json
{
  "ok": false,
  "error": {
    "code": "BOOTSTRAP_DENIED",
    "message": "Bootstrap key not configured"
  },
  "correlation_id": "..."
}
```

**Causes:**
- Missing `KERNEL_BOOTSTRAP_KEY` in server environment
- Wrong `x-kernel-bootstrap-key` header value
- Tenant already has users (bootstrap only works for empty tenants)

**Solution:**
1. Set `KERNEL_BOOTSTRAP_KEY` in server `.env.local` or environment
2. Restart server
3. Use correct bootstrap key in `x-kernel-bootstrap-key` header
4. Ensure tenant has 0 users (for `create_user`) or exactly 1 user (for `set_password`)

---

## Complete Example Script

```bash
#!/bin/bash

# Configuration
KERNEL_URL="http://localhost:3001"
# Generate a UUID-format tenant ID (required by contracts schema)
TENANT_ID=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "550e8400-e29b-41d4-a716-$(date +%s | tail -c 13)")
BOOTSTRAP_KEY="${KERNEL_BOOTSTRAP_KEY}"  # Set this in your environment

echo "Using Tenant ID: ${TENANT_ID}"

# Step 1: Bootstrap
echo "Step 1: Creating admin user..."
USER_RESPONSE=$(curl -s -X POST ${KERNEL_URL}/api/kernel/iam/users \
  -H "content-type: application/json" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-kernel-bootstrap-key: ${BOOTSTRAP_KEY}" \
  -d '{"email":"admin@demo.local","name":"Admin"}')
USER_ID=$(echo $USER_RESPONSE | jq -r '.id')
echo "User ID: ${USER_ID}"

echo "Setting password..."
curl -s -X POST ${KERNEL_URL}/api/kernel/iam/users/${USER_ID}/set-password \
  -H "content-type: application/json" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-kernel-bootstrap-key: ${BOOTSTRAP_KEY}" \
  -d '{"password":"ChangeMe123!"}' > /dev/null

# Step 2: Login
echo "Step 2: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST ${KERNEL_URL}/api/kernel/iam/login \
  -H "content-type: application/json" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -d '{"email":"admin@demo.local","password":"ChangeMe123!"}')
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.access_token')
echo "Token obtained"

# Step 3: Create role and grant permissions
echo "Step 3: Creating role..."
ROLE_RESPONSE=$(curl -s -X POST ${KERNEL_URL}/api/kernel/iam/roles \
  -H "content-type: application/json" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"name":"canon-admin"}')
ROLE_ID=$(echo $ROLE_RESPONSE | jq -r '.id')
echo "Role ID: ${ROLE_ID}"

echo "Granting permissions..."
curl -s -X POST ${KERNEL_URL}/api/kernel/iam/roles/${ROLE_ID}/permissions \
  -H "content-type: application/json" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "permissions": [
      "kernel.registry.canon.register",
      "kernel.registry.route.create",
      "kernel.gateway.proxy.invoke",
      "kernel.event.publish"
    ]
  }' > /dev/null

echo "Assigning role to user..."
curl -s -X POST ${KERNEL_URL}/api/kernel/iam/roles/${ROLE_ID}/assign \
  -H "content-type: application/json" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"user_id\":\"${USER_ID}\"}" > /dev/null

# Step 4: Register Canon
echo "Step 4: Registering Canon..."
CANON_RESPONSE=$(curl -s -X POST ${KERNEL_URL}/api/kernel/registry/canons \
  -H "content-type: application/json" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "canon_key": "canon.demo",
    "version": "1.0.0",
    "base_url": "http://localhost:4000",
    "status": "ACTIVE",
    "capabilities": ["ping"]
  }')
CANON_ID=$(echo $CANON_RESPONSE | jq -r '.id')
echo "Canon ID: ${CANON_ID}"

# Step 5: Create route
echo "Step 5: Creating route..."
curl -s -X POST ${KERNEL_URL}/api/kernel/registry/routes \
  -H "content-type: application/json" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"route_prefix\": \"/demo/ping\",
    \"canon_id\": \"${CANON_ID}\",
    \"required_permissions\": [\"kernel.gateway.proxy.invoke\"]
  }" > /dev/null
echo "Route created"

# Step 6: Invoke Gateway
echo "Step 6: Invoking Gateway..."
curl -s -X GET ${KERNEL_URL}/api/gateway/demo/ping \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}"

# Step 7: Publish Event
echo "Step 7: Publishing event..."
curl -s -X POST ${KERNEL_URL}/api/kernel/events/publish \
  -H "content-type: application/json" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"event_name\": \"canon.demo.ping\",
    \"source\": \"canon\",
    \"tenant_id\": \"${TENANT_ID}\",
    \"payload\": {\"message\": \"Ping successful\"}
  }"

echo ""
echo "✅ Integration complete!"
```

---

## Next Steps

1. **Test your Canon** - Ensure your Canon service responds to the paths you've registered
2. **Monitor Audit Trail** - Query audit events to verify all operations were logged
3. **Set up Production** - Replace `localhost` URLs with production endpoints
4. **Configure Permissions** - Grant only the minimum permissions needed for each role

---

**Last Updated:** 2025-12-14  
**Kernel Version:** MVP (Build 3.3)
