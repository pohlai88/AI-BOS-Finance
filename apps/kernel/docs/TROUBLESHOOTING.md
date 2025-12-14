# Troubleshooting Guide

> Quick fixes for common AI-BOS Kernel issues.

---

## Quick Diagnostics

| Status | Error | Likely Cause | Quick Fix |
|--------|-------|--------------|-----------|
| **401** | `UNAUTHORIZED` | Missing or expired JWT | Re-run login, check token |
| **403** | `FORBIDDEN` | User lacks permission | Check `role_permissions` table |
| **404** | `ROUTE_NOT_FOUND` | Route not registered | Check `routes` table, ensure `active=true` |
| **503** | `SERVICE_UNAVAILABLE` | Cell health check failed | Check cell logs, hit `/health` directly |
| **504** | `GATEWAY_TIMEOUT` | Cell not responding | Verify cell is running |

---

## Common Issues

### 1. "Cannot connect to database"

**Symptoms:**
- Kernel returns `500 Internal Server Error`
- Logs show `ECONNREFUSED` or `Connection refused`

**Diagnosis:**
```bash
# Check if Postgres is running
docker ps | grep kernel_db

# Check Postgres logs
docker logs kernel_db
```

**Fixes:**
```bash
# Restart database
docker-compose restart db

# Verify connection
docker exec -it kernel_db psql -U kernel -d kernel_local -c "SELECT 1"

# Check .env.local has correct DATABASE_URL
# Expected: postgres://kernel:kernelpassword@localhost:5433/kernel_local
```

---

### 2. "401 Unauthorized" on all requests

**Symptoms:**
- Every request returns `401`
- Login works but subsequent calls fail

**Diagnosis:**
```bash
# Check if token is being sent
# Look for "Authorization: Bearer ..." in your request

# Decode token (paste at jwt.io)
# Check: exp (expiry), iss (issuer)
```

**Fixes:**
```bash
# Get fresh token
$login = Invoke-RestMethod -Method POST -Uri "http://localhost:3001/api/kernel/iam/login" `
  -Headers @{"x-tenant-id"="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"; "Content-Type"="application/json"} `
  -Body '{"email":"admin@demo.local","password":"password123"}'

# Use the new token
$login.data.access_token
```

**Common Causes:**
- Token expired (default: 1 hour)
- Missing `Bearer ` prefix
- Wrong tenant ID in header

---

### 3. "403 Forbidden" after successful login

**Symptoms:**
- Login succeeds (get token)
- Specific endpoints return `403 FORBIDDEN`

**Diagnosis:**
```sql
-- Check user's permissions
SELECT rp.permission_code 
FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
WHERE ur.user_id = 'your-user-id';
```

**Fixes:**
```sql
-- Add missing permission to role
INSERT INTO role_permissions (tenant_id, role_id, permission_code)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'finance.payment.execute'
);
```

---

### 4. "Cell not found in registry"

**Symptoms:**
- Gateway returns `404 ROUTE_NOT_FOUND`
- Direct cell call works, but via Gateway fails

**Diagnosis:**
```sql
-- Check if canon is registered
SELECT * FROM canons WHERE name = 'cell-payment-hub';

-- Check if route exists
SELECT * FROM routes WHERE path = '/payments/process';
```

**Fixes:**
```sql
-- Register canon
INSERT INTO canons (id, tenant_id, name, service_url, healthy)
VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'cell-payment-hub',
  'http://localhost:4000',
  true
);

-- Register route
INSERT INTO routes (tenant_id, canon_id, method, path, required_permissions, active)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'POST',
  '/payments/process',
  ARRAY['finance.payment.execute'],
  true
);
```

---

### 5. "503 Service Unavailable"

**Symptoms:**
- Gateway returns `503`
- Cell health endpoint shows `unhealthy`

**Diagnosis:**
```bash
# Check cell health directly
curl http://localhost:4000/health

# Check cell logs
docker logs cell_payment_hub
```

**Fixes:**
```bash
# If chaos endpoint was triggered, recover
curl -X POST http://localhost:4000/chaos/recover/ledger

# Restart cell
docker-compose restart cell-payment-hub

# Check internal dependencies (database, external APIs)
```

---

### 6. "Correlation ID not appearing in logs"

**Symptoms:**
- Cannot trace requests end-to-end
- Logs don't show correlation ID

**Diagnosis:**
```typescript
// Check if your cell is reading the header
console.log(req.header('x-correlation-id'));
```

**Fixes:**
```typescript
// Always extract and log correlation ID
const correlationId = req.header('x-correlation-id') || randomUUID();
console.log(`[${correlationId}] Processing request...`);
```

---

### 7. "Migration failed"

**Symptoms:**
- `pnpm db:migrate` fails
- Error about existing tables/triggers

**Diagnosis:**
```bash
# Check migration history
docker exec -it kernel_db psql -U kernel -d kernel_local \
  -c "SELECT * FROM schema_migrations ORDER BY version;"
```

**Fixes:**
```bash
# Reset database (WARNING: destroys data)
docker-compose down -v
docker-compose up -d
pnpm db:migrate
pnpm seed:happy-path
```

---

### 8. "Port already in use"

**Symptoms:**
- `docker-compose up` fails
- Error: `port is already allocated`

**Diagnosis:**
```bash
# Windows: Find what's using the port
netstat -ano | findstr :5433
netstat -ano | findstr :3001
netstat -ano | findstr :4000
```

**Fixes:**
```bash
# Stop conflicting service
# Or change port in docker-compose.yml

# Example: Change Postgres port
ports:
  - "5434:5432"  # Use 5434 instead of 5433
```

---

## Diagnostic Commands

### Check System Health

```bash
# Kernel health
curl http://localhost:3001/api/health

# Cell health
curl http://localhost:4000/health

# Database connection
docker exec -it kernel_db psql -U kernel -d kernel_local -c "SELECT 1"
```

### Inspect Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker logs -f kernel_db
docker logs -f cell_payment_hub

# Kernel (if running locally)
# Check terminal output
```

### Query Audit Trail

```sql
-- Recent audit events
SELECT action, resource, actor_id, correlation_id, created_at
FROM audit_events
ORDER BY created_at DESC
LIMIT 10;

-- Find by correlation ID
SELECT * FROM audit_events
WHERE correlation_id = 'your-correlation-id';
```

### Inspect Database State

```sql
-- List all tenants
SELECT * FROM tenants;

-- List all users
SELECT id, email, tenant_id FROM users;

-- List all roles
SELECT * FROM roles;

-- Check user permissions
SELECT u.email, rp.permission_code
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN role_permissions rp ON ur.role_id = rp.role_id
WHERE u.email = 'admin@demo.local';

-- List registered canons
SELECT * FROM canons;

-- List routes
SELECT method, path, required_permissions, active FROM routes;
```

---

## Reset Everything

Nuclear option when nothing else works:

```bash
# Stop everything
docker-compose down -v

# Remove node_modules (if needed)
rm -rf node_modules
rm -rf apps/kernel/node_modules
rm -rf apps/cell-payment-hub/node_modules

# Reinstall
pnpm install

# Start fresh
docker-compose up -d
pnpm db:migrate
pnpm seed:happy-path

# Verify
curl http://localhost:3001/api/health
curl http://localhost:4000/health
```

---

## Getting Help

### Information to Include

When reporting issues, include:

1. **Error message** (full text)
2. **HTTP status code**
3. **Correlation ID** (from response headers)
4. **Steps to reproduce**
5. **Environment** (OS, Docker version, Node version)
6. **Logs** (relevant sections)

### Where to Report

- **Internal issues:** File in project issue tracker
- **Architecture questions:** See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Integration help:** See [Cell Integration Guide](cell-integration-guide.md)

---

## Quick Reference: Error Codes

| Code | Name | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | No valid JWT |
| `FORBIDDEN` | 403 | JWT valid but lacks permission |
| `ROUTE_NOT_FOUND` | 404 | Path not in registry |
| `VALIDATION_ERROR` | 400 | Request body invalid |
| `TENANT_REQUIRED` | 400 | Missing `x-tenant-id` |
| `INVALID_UUID` | 400 | Malformed tenant/user ID |
| `GATEWAY_DOWN` | 503 | Payment gateway cell down |
| `PROCESSOR_DOWN` | 503 | Payment processor cell down |
| `LEDGER_DOWN` | 503 | Ledger cell down |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
