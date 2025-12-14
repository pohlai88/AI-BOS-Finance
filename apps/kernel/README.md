# AI-BOS Kernel (v1.0.0-mvp)

> **The Identity-to-Evidence Control Plane for AI-BOS Finance.**  
> Governs access to Canons, produces evidence, makes integrations deterministic.

![Status](https://img.shields.io/badge/status-MVP%20Complete-green)
![Architecture](https://img.shields.io/badge/arch-Cell--Based-purple)
![Tests](https://img.shields.io/badge/tests-11%2F11%20pass-brightgreen)
![Postgres](https://img.shields.io/badge/persistence-Postgres%2015-blue)

---

## 🎯 What This Solves

| Problem | How Kernel Solves It |
|---------|---------------------|
| **Authorization Fragmentation** | Centralized RBAC across all Cells |
| **Audit Evidence Gaps** | Every request logged with correlation ID |
| **Cell Health Blindness** | Gateway checks Cell health before routing |
| **Integration Fatigue** | Deterministic Cell onboarding via Registry |

**Core Philosophy:** *"Bring Your Own Identity, We Provide the Trust."*

---

## ⚡️ Zero to Hero (5 Minutes)

Spin up the entire **Finance Payment Stack** (Kernel + Postgres + Payment Hub) in 3 commands.

### Prerequisites
- Docker Desktop (running)
- Node.js 18+
- pnpm

### 1. Start the Stack

```bash
# Starts Kernel (:3001), Postgres (:5433), Payment Hub Cell (:4000)
cd apps/kernel
docker-compose up -d
```

**Expected Output:**
```
✔ Container kernel_db        Started
✔ Container cell_payment_hub Started
```

### 2. Seed the Environment

```bash
pnpm seed:happy-path
```

**You'll see:**
```
🌱 Seeding Happy Path Environment...
   📦 Creating tenant: Demo Corp
   👤 Creating user: admin@demo.local
   🎭 Creating role: Super Admin
   🔐 Granting permissions...
   📡 Registering cell: cell-payment-hub
✅ Seed Complete!
```

### 3. Process a Payment (The "Hello World")

**PowerShell:**
```powershell
# Login and get token
$login = Invoke-RestMethod -Method POST -Uri "http://localhost:3001/api/kernel/iam/login" `
  -Headers @{"x-tenant-id"="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"; "Content-Type"="application/json"} `
  -Body '{"email":"admin@demo.local","password":"password123"}'

# Process payment via Kernel Gateway
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/payments/process" `
  -Headers @{"x-tenant-id"="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"; "Content-Type"="application/json"} `
  -Body '{"amount": 500, "currency": "USD", "beneficiary": "Acme Corp"}'
```

**Bash/curl:**
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/kernel/iam/login \
  -H "x-tenant-id: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.local","password":"password123"}' | jq -r '.data.access_token')

# Process Payment
curl -X POST http://localhost:4000/payments/process \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 500, "currency": "USD", "beneficiary": "Acme Corp"}'
```

**Success Response:**
```json
{
  "ok": true,
  "data": {
    "transaction_id": "c6942f43-e0da-444a-a1f1-2f7a3c24e35e",
    "status": "PROCESSED",
    "amount": 500,
    "currency": "USD",
    "beneficiary": "Acme Corp"
  },
  "trace": {
    "tenant_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "correlation_id": "b8fbd438-dfc0-4d9c-909b-d40d86bede72"
  }
}
```

### 4. Break Something (Chaos Engineering)

```bash
# Break the ledger cell
curl -X POST http://localhost:4000/chaos/fail/ledger

# Try payment again
curl -X POST http://localhost:4000/payments/process \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "USD", "beneficiary": "Test"}'
# → 503 LEDGER_DOWN

# Recover
curl -X POST http://localhost:4000/chaos/recover/ledger
```

---

## 🏗 Architecture at a Glance

```
┌────────────────────────────────────────────────────────────────┐
│                      CONTROL PLANE                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      Kernel (:3001)                       │  │
│  │   [Auth] [RBAC] [Gateway] [Registry] [Audit] [Events]    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                      JWT + Headers                              │
│                              ▼                                  │
└────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│                       DATA PLANE                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │  Payment Hub    │  │ Invoice Matcher │  │   (Future)    │  │
│  │  Cell (:4000)   │  │   Cell (:4001)  │  │     Cell      │  │
│  │  ┌───────────┐  │  │                 │  │               │  │
│  │  │ gateway   │  │  │                 │  │               │  │
│  │  │ processor │  │  │                 │  │               │  │
│  │  │ ledger    │  │  │                 │  │               │  │
│  │  └───────────┘  │  │                 │  │               │  │
│  └─────────────────┘  └─────────────────┘  └───────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

| Component | Port | Purpose |
|-----------|------|---------|
| **Kernel** | 3001 | The Guard. No request reaches a Cell without valid JWT + RBAC |
| **Payment Hub** | 4000 | The Logic. Domain cell with gateway/processor/ledger |
| **Postgres** | 5433 | The Memory. Users, Roles, Routes, Audit Trail |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [🏗 Architecture](docs/ARCHITECTURE.md) | Mental model: Cells, Molecules, Canons |
| [🔌 Cell Integration Guide](docs/cell-integration-guide.md) | Build your own Finance Cell |
| [🔧 Troubleshooting](docs/TROUBLESHOOTING.md) | Fix 401/403/503 errors |
| [📋 API Specification](docs/openapi.yaml) | Full OpenAPI 3.0 Reference |

---

## 🛠 Operational Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Kernel locally (connects to Docker DB) |
| `pnpm db:migrate` | Apply SQL schema updates |
| `pnpm seed:happy-path` | Seed demo data (tenant, user, cell, routes) |
| `pnpm test:e2e` | Run full Integration Suite |
| `docker-compose logs -f` | Tail logs for all services |

---

## ⚠️ MVP Limitations

| Limitation | Impact | Future Fix |
|------------|--------|------------|
| Single Process | No horizontal scaling | Add Redis session store |
| Manual Tenants | Tenant creation via seed/SQL | Add `/api/kernel/tenants` CRUD |
| No Rate Limiting | DoS risk on public endpoints | Add rate limiting middleware |

---

## 📁 Project Structure

```
apps/kernel/
├── app/api/              # Next.js API routes
│   ├── gateway/          # Reverse proxy to Cells
│   ├── health/           # Liveness check
│   └── kernel/           # IAM, Registry, Events, Audit
├── db/migrations/        # SQL schema files
├── docs/                 # Documentation
├── scripts/              # Utility scripts (migrate, seed)
└── docker-compose.yml    # Stack orchestration

apps/cell-payment-hub/    # Reference Cell implementation
├── src/index.ts          # Express + Cell architecture
└── Dockerfile            # Container definition
```

---

**Built with ❤️ by AI-BOS Team**
