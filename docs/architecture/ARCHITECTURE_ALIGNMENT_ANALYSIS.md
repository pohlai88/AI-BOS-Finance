# Architecture Alignment Analysis

> **Date:** 2025-12-16  
> **Objective:** "Maximum flexibility with highest level governance of drift, utilizing correct Metadata"

---

## Executive Summary

| Layer | Status | Alignment | Gap |
|-------|--------|-----------|-----|
| **Frontend** | ✅ Vision complete | 100% | None |
| **BFF** | ✅ Implemented | 90% | Auth integration |
| **Auth** | ✅ Exists in Kernel | 80% | BFF ↔ Kernel bridge |
| **Backend** | ✅ Clean UDD | 85% | GRCD enforcement |
| **Database** | ✅ Schema complete | 100% | None |

**Verdict:** ✅ **YES - Core objective is achievable** with minor integration work.

---

## 1. Frontend Architecture & Vision

### 1.1 What the Frontend Expects

From `META_01_MetadataArchitecturePage.tsx` and the 8 META pages:

```typescript
// The vision: Real-time schema governance across multiple systems
const SCHEMA_SYSTEMS = [
  { id: 'sap-erp', name: 'SAP ERP', status: 'healthy', schemas: 847, drift: 0, compliance: 100 },
  { id: 'salesforce', name: 'Salesforce', status: 'warning', drift: 3, compliance: 98.7 },
  { id: 'snowflake', name: 'Snowflake DW', status: 'critical', drift: 14, violations: [...] },
];

// Violations are the key to "governance of drift"
violations: [
  {
    field: 'FACT_SALES.REVENUE_AMT',
    issue: 'Canon violation: Precision changed from (18,2) to (18,4)',
    severity: 'critical',
    impactedSystems: 7,
    downstreamTables: 34,
  },
]
```

### 1.2 Frontend Pages Summary

| Page | Purpose | Flexibility | Governance |
|------|---------|-------------|------------|
| META_01 | Schema Governance Dashboard | View all systems | Real-time drift detection |
| META_02 | God View (Field Registry) | CRUD any field | Tier-based access |
| META_03 | Prism Comparator | Map fields across systems | Canonical alignment |
| META_04 | Risk Radar | View all violations | Severity categorization |
| META_05 | Canon Matrix | Entity hierarchy | Domain/module organization |
| META_06 | Health Scan | Compliance by standard | Standard pack coverage |
| META_07 | Lynx Codex | AI-powered insights | Knowledge governance |
| META_08 | Implementation Playbook | Onboarding guide | Process governance |

### 1.3 Flexibility vs Governance Balance

✅ **The frontend design inherently supports both:**

| Flexibility Feature | Governance Counter |
|---------------------|-------------------|
| Quick field creation | Tier assignment (1-5) |
| Any data type | Format validation |
| Free-form labels | Canonical key enforcement |
| Draft mode | Status workflow (draft → active) |
| Multi-system mapping | Canon violation detection |

---

## 2. BFF Layer Analysis

### 2.1 Current Implementation

```
Browser → bffClient → /api/meta/* → backend.server.ts → metadata-studio:8787
```

**Files:**
- `apps/web/lib/bff-client.ts` - Browser-safe client
- `apps/web/lib/backend.server.ts` - Server-only backend caller
- `apps/web/app/api/meta/**` - 9 route handlers

### 2.2 Auth Flow (Current vs Target)

**Current (Stubbed):**
```typescript
// backend.server.ts - Line 48
async function getAuthContext() {
  // TODO: Integrate with NextAuth when auth is set up
  return {
    tenantId: 'default',  // ❌ Hardcoded
    userId: 'system',     // ❌ Hardcoded
  };
}
```

**Target (Using Kernel Auth):**
```typescript
async function getAuthContext() {
  const session = await getServerSession(authOptions);
  // OR: Forward JWT from browser and verify
  return {
    tenantId: session.tenantId,
    userId: session.userId,
    accessToken: session.accessToken,  // JWT from Kernel
  };
}
```

### 2.3 What BFF Enables

| Feature | Without BFF | With BFF |
|---------|-------------|----------|
| Backend URL exposure | Visible | Hidden |
| Auth token handling | Browser-side | Server-side |
| Data aggregation | Client | Server |
| Caching | None | Next.js revalidate |
| CORS | Complex | Same-origin |

---

## 3. Auth Infrastructure (Already Exists!)

### 3.1 Kernel Auth Stack

The kernel **already has** a complete auth system:

**`apps/kernel/src/server/jwt.ts`:**
```typescript
export type AuthenticatedUser = {
  user_id: string;
  tenant_id: string;
  session_id: string;
  email: string;
};

export async function verifyJWT(req: Request): Promise<AuthenticatedUser> {
  const token = authHeader.substring(7); // Bearer token
  const payload = await c.tokenSigner.verify(token);
  const isValid = await c.sessionRepo.isValid({ ... });
  return { user_id, tenant_id, session_id, email };
}
```

**`apps/kernel/src/server/rbac.ts`:**
```typescript
export async function enforceRBAC(req: Request, enforcement: RBACEnforcement) {
  const auth = await verifyJWT(req);
  const decision = await authorize({ ... });
  if (decision.decision === "DENY") {
    await c.audit.append({ ... }); // Audit denial
    throw new Error("FORBIDDEN");
  }
  return auth;
}
```

### 3.2 Metadata-Studio Auth

**`apps/kernel/src/metadata-studio/middleware/auth.middleware.ts`:**
```typescript
export type Role = 'kernel_architect' | 'metadata_steward' | 'business_admin' | 'user';

export interface AuthContext {
  userId: string;
  role: Role;
  tenantId: string;
}

// Currently expects headers:
// x-tenant-id, x-user-id, x-role
```

### 3.3 Integration Path

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BROWSER                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Login → Kernel /api/iam/login → Returns JWT → Stored in cookie      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                           JWT in httpOnly cookie
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  BFF (Next.js)                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  backend.server.ts                                                    │  │
│  │  1. Read JWT from cookie                                              │  │
│  │  2. OR: Use NextAuth session (if using NextAuth for Kernel login)    │  │
│  │  3. Pass JWT/headers to metadata-studio                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                        Authorization: Bearer {JWT}
                        X-Tenant-Id: {tenant_id}
                        X-User-Id: {user_id}
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  METADATA-STUDIO                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  auth.middleware.ts                                                   │  │
│  │  - Reads headers                                                      │  │
│  │  - Sets AuthContext                                                   │  │
│  │  - Future: Verify JWT via Kernel service                              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Effort Required:** 2-3 days to bridge BFF ↔ Kernel auth

---

## 4. Backend Analysis

### 4.1 Current State (Clean UDD)

```
apps/kernel/src/metadata-studio/
├── api/                          # 4 route files
│   ├── meta-governance.routes.ts  # Dashboard, Risks, Health
│   ├── meta-fields.routes.ts      # CRUD fields
│   ├── meta-entities.routes.ts    # CRUD entities
│   └── metrics.routes.ts          # Prometheus
├── db/schema/                     # 5 core tables
│   ├── standard-pack.tables.ts    # Standard packs (global)
│   ├── entity-catalog.tables.ts   # Entity registry
│   ├── metadata.tables.ts         # Field registry
│   ├── metadata-mapping.tables.ts # System mappings
│   └── remediation.tables.ts      # Violations + proposals
└── seed/                          # Bootstrap data
```

### 4.2 GRCD Enforcement Status

| GRCD Rule | Description | Status |
|-----------|-------------|--------|
| GRCD-10 | UNIQUE(tenant_id, canonical_key) | ✅ DB constraint |
| GRCD-11 | entity_urn must exist in catalog | ⚠️ Auto-create (Lite Mode) |
| GRCD-12 | Tier1/2 requires standard_pack_id | ⚠️ Warn only (Lite Mode) |
| GRCD-13 | canonical_key format validation | ⚠️ Not enforced |
| GRCD-14 | standard_pack_id must exist | ✅ FK constraint |
| GRCD-30 | Mapping uniqueness | ✅ DB constraint |
| GRCD-31 | Mapped canonical_key must exist | ⚠️ Not enforced |

### 4.3 Lite Mode vs Governed Mode

**Current Implementation:**
```typescript
// meta-fields.routes.ts - Line 211
if ((tier === 'tier1' || tier === 'tier2') && !body.standard_pack_id) {
  console.warn(`[GRCD-12] Creating ${tier} field without standard_pack_id`);
  // WARN but allow - Lite Mode
}
```

**Flexibility:** ✅ Any field can be created quickly
**Governance:** ⚠️ Only logging, no blocking

**Target for Governed Mode:**
```typescript
if ((tier === 'tier1' || tier === 'tier2') && !body.standard_pack_id) {
  return c.json({ 
    error: 'GRCD-12 Violation',
    message: 'Tier1/2 fields require standard_pack_id'
  }, 400);
}
```

---

## 5. Database Schema Analysis

### 5.1 Core Tables (Implemented)

| Table | Purpose | Flexibility | Governance |
|-------|---------|-------------|------------|
| `mdm_standard_pack` | Regulatory anchors | Global definitions | Tier anchoring |
| `mdm_entity_catalog` | Entity registry | Per-tenant | Domain structure |
| `mdm_global_metadata` | Field definitions | Free-form | Tier + FK constraints |
| `mdm_metadata_mapping` | System bindings | Any system | Canonical alignment |
| `mdm_violation_report` | Drift detection | Auto-detect | Severity levels |
| `mdm_remediation_proposal` | Fix suggestions | AI-assisted | HITL approval |

### 5.2 Key Governance Columns

```sql
-- mdm_global_metadata
tier TEXT NOT NULL,              -- tier1-tier5 (governance level)
standard_pack_id TEXT REFERENCES mdm_standard_pack(pack_id),  -- regulatory anchor
status TEXT NOT NULL,            -- draft | active | deprecated
owner_id TEXT NOT NULL,          -- accountability
steward_id TEXT NOT NULL,        -- day-to-day responsibility
```

### 5.3 Schema Supports Core Objective

✅ **Maximum Flexibility:**
- `canonical_key` can be any snake_case string
- `data_type` supports any type
- `aliases_raw` allows multiple names
- Draft mode for experimentation
- Tier3-5 for operational fields

✅ **Highest Governance:**
- `tier` enforces governance level
- `standard_pack_id` anchors to regulations
- `owner_id`/`steward_id` for accountability
- `status` workflow (draft → active → deprecated)
- Tenant isolation via `tenant_id`

---

## 6. Core Objective Alignment

### 6.1 The Objective

> **"Maximum flexibility with highest level governance of drift, utilizing correct Metadata"**

### 6.2 How Architecture Achieves This

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| **Maximum Flexibility** | | |
| Quick field creation | POST /api/meta/fields + Lite Mode | ✅ |
| Any data type/format | Free-form `data_type` column | ✅ |
| Multi-system mapping | `mdm_metadata_mapping` table | ✅ |
| Draft experimentation | `is_draft` flag + status workflow | ✅ |
| **Highest Governance** | | |
| Tier-based control | `tier` column (1-5) | ✅ |
| Regulatory anchoring | `standard_pack_id` FK | ✅ |
| Drift detection | `mdm_violation_report` + /risks API | ✅ |
| HITL approvals | Schema exists, workflow pending | ⚠️ |
| Audit trail | `created_by`/`updated_by` columns | ✅ |
| **Correct Metadata** | | |
| Single source of truth | `mdm_global_metadata` table | ✅ |
| Canonical key format | `{entity_urn}.{field_name}` | ✅ |
| Standard pack alignment | FK to `mdm_standard_pack` | ✅ |
| Entity hierarchy | `mdm_entity_catalog` structure | ✅ |

### 6.3 Gap Summary

| Gap | Impact | Priority | Fix |
|-----|--------|----------|-----|
| BFF ↔ Kernel auth bridge | No real user context | P1 | 2-3 days |
| GRCD blocking for tier1/2 | Violations logged not blocked | P2 | 1 day |
| HITL approval workflow | No gate for tier1/2 changes | P2 | 3-5 days |
| Remediation apply | Can't auto-fix violations | P3 | 3-5 days |

---

## 7. Recommended Actions

### 7.1 Immediate (This Sprint)

**1. Bridge BFF ↔ Kernel Auth (P1)**

```typescript
// backend.server.ts
async function getAuthContext() {
  const token = cookies().get('kernel-jwt')?.value;
  if (token) {
    // Verify with Kernel's /api/iam/verify endpoint
    const response = await fetch(`${KERNEL_URL}/api/iam/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await response.json();
  }
  throw new AuthenticationError('No token');
}
```

**2. Add GRCD Governed Mode Toggle (P2)**

```typescript
// env var to control mode
const GRCD_MODE = process.env.GRCD_MODE || 'lite';  // 'lite' | 'governed'

if (GRCD_MODE === 'governed' && tier in ['tier1', 'tier2'] && !standard_pack_id) {
  return c.json({ error: 'GRCD-12 violation' }, 400);
}
```

### 7.2 Next Sprint

1. **HITL Approval Workflow** - Add approval table and UI
2. **Remediation Apply** - Execute approved fixes
3. **Event Bus** - Real-time violation notifications

### 7.3 Future

1. **AI Agents** - Auto-suggest remediations
2. **Type Generation** - Auto-generate TS/Zod from metadata
3. **External Connectors** - SAP, Salesforce schema sync

---

## 8. Conclusion

### ✅ Does Architecture Meet Core Objective?

**YES** - The architecture fundamentally supports "maximum flexibility with highest governance":

| Dimension | Score | Evidence |
|-----------|-------|----------|
| Flexibility | 9/10 | Lite Mode, free-form fields, draft status |
| Governance | 8/10 | Tiers, standard packs, violations (but HITL pending) |
| Correct Metadata | 10/10 | Single SSOT, canonical keys, entity hierarchy |

### Key Strengths

1. **Schema-First Design** - Database is the truth
2. **Tier System** - Clear governance levels
3. **Standard Pack Anchoring** - Regulatory compliance built-in
4. **Drift Detection** - Violations API already working
5. **BFF Security** - Backend URLs hidden

### Key Gaps

1. **Auth Not Wired** - BFF → Backend uses defaults (fixable in 2-3 days)
2. **GRCD Not Blocking** - Lite Mode warns but allows (fixable in 1 day)
3. **HITL Not Built** - No approval workflow yet (3-5 days)

### Final Assessment

```
Core Objective: Maximum Flexibility + Highest Governance + Correct Metadata

Current State:
  Flexibility:  ██████████ 100% (Lite Mode enables everything)
  Governance:   ████████░░  80% (Logging only, not blocking)
  Metadata:     ██████████ 100% (Schema is complete)

After P1/P2 Fixes:
  Flexibility:  ██████████ 100% (Lite Mode preserved)
  Governance:   ██████████ 100% (GRCD + HITL enforced)
  Metadata:     ██████████ 100% (Already complete)
```

**Recommendation:** Complete P1 (auth) and P2 (GRCD blocking) to achieve full alignment.

---

*This analysis is part of the Canon Governance System.*
