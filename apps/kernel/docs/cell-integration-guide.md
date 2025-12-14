# Cell Integration Guide

> Build and integrate a Finance Cell into the AI-BOS ecosystem.

**Target Audience:** Developers building Cells for AI-BOS Finance  
**Time to Integration:** ~30 minutes  
**Prerequisites:** Node.js 18+, Docker, Basic Express knowledge

---

## 1. What is a Cell?

A **Cell** is the atomic unit of functionality in AI-BOS. Think of it as a single-purpose microservice that:

- Does ONE thing well (e.g., process payments, match invoices)
- Has its own internal health model (can partially fail)
- Trusts the Kernel for auth (never validates JWTs)
- Is isolated by tenant (uses `x-tenant-id`)

### Where Cells Fit

```
Canon: Accounting
  └── Molecule: Accounts Payable
        ├── Cell: Payment Hub       ← You are here
        ├── Cell: Invoice Matcher
        └── Cell: Vendor Ledger
```

---

## 2. The Cell Contract

### MUST Implement

| Requirement | Why |
|-------------|-----|
| `GET /ping` | Liveness probe (always returns 200) |
| `GET /health` | Readiness probe with cell-level status |
| Trust `x-tenant-id` | Multi-tenant data isolation |
| Trust `x-user-sub` | User identity from Kernel |
| Log `x-correlation-id` | End-to-end request tracing |
| Return `503` on failure | Let Kernel detect issues |

### MAY Implement

| Optional | Purpose |
|----------|---------|
| `POST /chaos/fail/:cell` | Simulate failure for testing |
| `POST /chaos/recover/:cell` | Recover from simulated failure |
| Degraded status | Partial functionality mode |

---

## 3. Step-by-Step: Build a Cell

### Step 1: Project Setup

```bash
mkdir apps/cell-my-service
cd apps/cell-my-service

# Initialize
pnpm init

# Install dependencies
pnpm add express cors
pnpm add -D typescript @types/express @types/cors @types/node tsx
```

**package.json:**
```json
{
  "name": "@aibos/cell-my-service",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js"
  }
}
```

### Step 2: Implement the Skeleton

**src/index.ts:**
```typescript
import express, { Request, Response } from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

// ============================================================
// 1. CELL STATE (Internal Dependencies)
// ============================================================
type CellStatus = 'healthy' | 'degraded' | 'unhealthy';

interface Cell {
  status: CellStatus;
  lastChecked: string;
}

const cells: Record<string, Cell> = {
  database: { status: 'healthy', lastChecked: new Date().toISOString() },
  external_api: { status: 'healthy', lastChecked: new Date().toISOString() },
};

// ============================================================
// 2. INFRASTRUCTURE ENDPOINTS (Required)
// ============================================================

// Liveness: Is the process running?
app.get('/ping', (_req, res) => {
  res.json({ message: 'pong' });
});

// Readiness: Are my dependencies working?
app.get('/health', (_req, res) => {
  const hasUnhealthy = Object.values(cells).some(c => c.status === 'unhealthy');
  const hasDegraded = Object.values(cells).some(c => c.status === 'degraded');
  
  const status = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';
  
  res.json({
    service: 'cell-my-service',
    status,
    cells: Object.fromEntries(
      Object.entries(cells).map(([name, cell]) => [
        name, 
        { status: cell.status, lastChecked: cell.lastChecked }
      ])
    ),
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// 3. BUSINESS ENDPOINTS (Your Domain Logic)
// ============================================================

app.post('/my-action', (req: Request, res: Response) => {
  // 1. Extract Context (Injected by Kernel)
  const tenantId = req.header('x-tenant-id');
  const userId = req.header('x-user-sub');
  const correlationId = req.header('x-correlation-id') || randomUUID();
  
  // 2. Log with Correlation ID
  console.log(`[${correlationId}] Processing for tenant ${tenantId} by user ${userId}`);
  
  // 3. Check Cell Health
  if (cells.database.status === 'unhealthy') {
    return res.status(503).json({
      error: { code: 'DATABASE_DOWN', message: 'Database unavailable' },
      correlation_id: correlationId,
    });
  }
  
  // 4. Your Business Logic
  const result = {
    id: randomUUID(),
    tenant_id: tenantId,
    created_by: userId,
    // ... your data
  };
  
  // 5. Return with Trace
  res.status(201).json({
    ok: true,
    data: result,
    correlation_id: correlationId,
  });
});

// ============================================================
// 4. CHAOS ENDPOINTS (Optional but Recommended)
// ============================================================

app.post('/chaos/fail/:cell', (req, res) => {
  const { cell } = req.params;
  if (cells[cell]) {
    cells[cell].status = 'unhealthy';
    cells[cell].lastChecked = new Date().toISOString();
    console.log(`[Chaos] 🔥 Broke cell: ${cell}`);
    res.json({ message: `Cell '${cell}' is now unhealthy` });
  } else {
    res.status(404).json({ error: 'Cell not found' });
  }
});

app.post('/chaos/recover/:cell', (req, res) => {
  const { cell } = req.params;
  if (cells[cell]) {
    cells[cell].status = 'healthy';
    cells[cell].lastChecked = new Date().toISOString();
    console.log(`[Chaos] ✅ Recovered cell: ${cell}`);
    res.json({ message: `Cell '${cell}' is now healthy` });
  } else {
    res.status(404).json({ error: 'Cell not found' });
  }
});

// ============================================================
// 5. START
// ============================================================

app.listen(PORT, () => {
  console.log(`🚀 Cell running on port ${PORT}`);
});
```

### Step 3: Create Dockerfile

**Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

CMD ["npx", "tsx", "src/index.ts"]
EXPOSE 4001
```

### Step 4: Add to Docker Compose

Add your Cell to `apps/kernel/docker-compose.yml`:

```yaml
services:
  # ... existing services ...
  
  cell-my-service:
    build:
      context: ../cell-my-service
      dockerfile: Dockerfile
    container_name: cell_my_service
    restart: always
    ports:
      - "4001:4001"
    environment:
      PORT: 4001
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:4001/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - kernel_net
```

---

## 4. Register with Kernel

### Option A: Via Seed Script

Add to `apps/kernel/scripts/seed-happy-path.ts`:

```typescript
// Register Cell
await client.query(`
  INSERT INTO canons (id, tenant_id, name, service_url, healthy)
  VALUES ($1, $2, 'cell-my-service', 'http://localhost:4001', true)
  ON CONFLICT (id) DO UPDATE SET service_url = 'http://localhost:4001'
`, [MY_CELL_ID, DEMO_TENANT_ID]);

// Register Route
await client.query(`
  INSERT INTO routes (tenant_id, canon_id, method, path, required_permissions, active)
  VALUES ($1, $2, 'POST', '/my-action', ARRAY['myservice.action.execute'], true)
  ON CONFLICT (tenant_id, path, method) DO UPDATE SET active = true
`, [DEMO_TENANT_ID, MY_CELL_ID]);
```

### Option B: Via API

```bash
# 1. Register Canon
curl -X POST http://localhost:3001/api/kernel/registry/canons \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cell-my-service",
    "service_url": "http://localhost:4001"
  }'

# 2. Register Route
curl -X POST http://localhost:3001/api/kernel/registry/routes \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "POST",
    "path": "/my-action",
    "target_canon": "cell-my-service",
    "required_permissions": ["myservice.action.execute"]
  }'
```

---

## 5. Header Reference

Headers injected by the Kernel:

| Header | Source | Purpose |
|--------|--------|---------|
| `x-tenant-id` | JWT `tid` claim | **CRITICAL:** Scope all data queries |
| `x-user-sub` | JWT `sub` claim | Actor identity for audit |
| `x-correlation-id` | Generated or propagated | Request tracing |
| `Authorization` | Passed through | Original JWT (if needed) |

### Example: Scoping Database Queries

```typescript
app.get('/my-data', async (req, res) => {
  const tenantId = req.header('x-tenant-id');
  
  // ALWAYS scope by tenant_id
  const data = await db.query(
    'SELECT * FROM my_table WHERE tenant_id = $1',
    [tenantId]
  );
  
  res.json({ data });
});
```

**⚠️ Never query without tenant_id. This is a security requirement.**

---

## 6. Reference: Payment Hub Cell

The `cell-payment-hub` is the reference implementation. Key patterns:

### Finance-Specific Cells

```typescript
const cells = {
  gateway: { status: 'healthy', ... },   // Payment network connectivity
  processor: { status: 'healthy', ... }, // Business logic engine
  ledger: { status: 'healthy', ... },    // Transaction recording
};
```

### Graceful Degradation

```typescript
app.post('/payments/process', (req, res) => {
  // Check dependencies in order
  if (cells.gateway.status === 'unhealthy') {
    return res.status(503).json({ error: { code: 'GATEWAY_DOWN' } });
  }
  if (cells.processor.status === 'unhealthy') {
    return res.status(503).json({ error: { code: 'PROCESSOR_DOWN' } });
  }
  if (cells.ledger.status === 'unhealthy') {
    return res.status(503).json({ error: { code: 'LEDGER_DOWN' } });
  }
  
  // All healthy - proceed
  // ...
});
```

### Full Source

See `apps/cell-payment-hub/src/index.ts` for the complete implementation (~280 lines).

---

## 7. Common Mistakes

| Mistake | Why It's Wrong | Fix |
|---------|----------------|-----|
| Validating JWT in Cell | Double validation, drift risk | Trust `x-user-sub` from Kernel |
| Ignoring `x-tenant-id` | Data leak between tenants | Always scope queries |
| Returning `200` on failure | Gateway can't detect issues | Return `503` for cell failure |
| Hardcoding tenant IDs | Breaks multi-tenancy | Use header value |
| Not logging correlation ID | Breaks request tracing | Log `[correlationId]` prefix |
| Blocking on startup | Health check fails | Start fast, check deps lazily |

---

## 8. Testing Your Cell

### Local Test (Without Kernel)

```bash
# Start your cell
pnpm dev

# Test ping
curl http://localhost:4001/ping

# Test health
curl http://localhost:4001/health

# Test action (simulate headers)
curl -X POST http://localhost:4001/my-action \
  -H "x-tenant-id: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" \
  -H "x-user-sub: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" \
  -H "x-correlation-id: test-123" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

### Chaos Test

```bash
# Break a cell
curl -X POST http://localhost:4001/chaos/fail/database

# Verify health shows unhealthy
curl http://localhost:4001/health
# → status: "unhealthy"

# Try action - should fail
curl -X POST http://localhost:4001/my-action ...
# → 503 DATABASE_DOWN

# Recover
curl -X POST http://localhost:4001/chaos/recover/database
```

### Integration Test (With Kernel)

1. Start full stack: `docker-compose up -d`
2. Seed data: `pnpm seed:happy-path`
3. Login and get token
4. Call via Gateway: `POST http://localhost:3001/api/gateway/my-action`

---

## 9. Checklist

Before deploying your Cell:

- [ ] `/ping` returns `200 OK`
- [ ] `/health` returns correct aggregate status
- [ ] All endpoints respect `x-tenant-id`
- [ ] All logs include `x-correlation-id`
- [ ] Returns `503` when dependencies fail
- [ ] Dockerfile builds successfully
- [ ] Health check passes in Docker
- [ ] Registered in Kernel Registry
- [ ] Routes defined with correct permissions
- [ ] Chaos endpoints work (if implemented)

---

**Next:** [Troubleshooting](TROUBLESHOOTING.md) — Fix common errors
