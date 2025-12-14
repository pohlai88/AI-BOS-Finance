# AI-BOS Canon — Business Logic Layer

> **The Heart of AI-BOS Business Operations**  
> Domain-driven microservices organized into Canons, Molecules, and Cells.

---

## 🏗️ Architecture Hierarchy

```
apps/canon/
├── finance/                    # Finance Domain (Canon)
│   ├── accounts-payable/       # AP Molecule/Cluster
│   │   ├── payment-hub/        # Payment Hub Cell
│   │   ├── vendor-master/      # Vendor Master Cell (future)
│   │   └── invoice-matching/   # Invoice Matching Cell (future)
│   ├── accounts-receivable/    # AR Molecule/Cluster (future)
│   ├── treasury/               # Treasury Molecule/Cluster (future)
│   └── general-ledger/         # GL Molecule/Cluster (future)
│
├── hrm/                        # HRM Domain (future)
├── crm/                        # CRM Domain (future)
└── README.md
```

---

## 📐 Naming Conventions

| Level | Name | Example | Description |
|-------|------|---------|-------------|
| **Domain** | Canon | `finance/` | Bounded context (ERP domain) |
| **Cluster** | Molecule | `accounts-payable/` | Functional group of related cells |
| **Unit** | Cell | `payment-hub/` | Atomic transaction ledger |

---

## 🔗 Integration Pattern

All Canon cells are accessed via the **Kernel Gateway**:

```
Frontend (Next.js) 
    ↓ (Route Handler / BFF)
Kernel Gateway
    ↓ (Authenticated + Authorized)
Canon Cell (e.g., payment-hub)
    ↓ (Business Logic)
DB (via apps/db)
```

---

## 📋 Available Domains

| Domain | Status | Description |
|--------|--------|-------------|
| `finance/` | 🟡 Active | Financial operations (AP, AR, GL, Treasury) |
| `hrm/` | ⬜ Planned | Human Resource Management |
| `crm/` | ⬜ Planned | Customer Relationship Management |

---

## 🚀 Quick Start

```bash
# Start a specific cell (from repo root)
cd apps/canon/finance/accounts-payable/payment-hub
pnpm dev

# Or via Docker Compose (from kernel)
cd apps/kernel
docker-compose up cell-payment-hub
```

---

**End of Canon README**
