# Metadata Studio: Lite Mode vs Governed Mode

> **A Developer's Guide to Adding Fields Quickly Without Breaking Governance**  
> **Version:** 1.0.0  
> **Last Updated:** 2025-12-16

---

## 🎯 Overview

Metadata Studio has **two modes of operation** designed to balance governance rigor with developer velocity:

| Mode | Target Users | Tier Focus | Approval | Standard Pack |
|------|--------------|------------|----------|---------------|
| **Lite Mode** | Developers, AI Orchestras | Tier3–5 | Auto-approve | Optional |
| **Governed Mode** | Architects, Stewards | Tier1–2 | HITL required | Required |

---

## ⚡ Lite Mode

### When to Use

- Adding operational or local fields for your app/module
- Quick prototyping and iteration
- Fields that don't touch regulatory reporting
- AI Orchestra suggestions (Tier 0-1 autonomy)

### What You Get

- **Fast registration:** No approval workflow
- **Simple API:** Minimal required fields
- **Flat view:** `vw_mdm_lite_metadata` for easy queries
- **Defaults:** Entity auto-created if needed, tier defaults to `tier3`

### Quick Start

#### Option 1: CLI (Recommended for Developers)

```bash
# Add a new entity + field in one command
pnpm metadata:upsert-lite \
  --entity "sales.orders" \
  --field "order_total" \
  --type "decimal" \
  --label "Order Total Amount"
```

#### Option 2: REST API

```bash
POST /api/metadata-studio/lite/fields
Content-Type: application/json

{
  "entity_urn": "sales.orders",
  "entity_name": "Sales Orders",  # Optional, derived from URN if omitted
  "field_name": "order_total",
  "label": "Order Total Amount",
  "data_type": "decimal",
  "format": "18,2",
  "description": "Total order value including tax",
  "tier": "tier3"  # Optional, defaults to tier3
}
```

**Response:**
```json
{
  "canonical_key": "sales.orders.order_total",
  "status": "created",
  "mode": "lite",
  "governance": {
    "tier": "tier3",
    "standard_pack_id": null,
    "requires_approval": false
  }
}
```

#### Option 3: Direct SQL (Admin Only)

```sql
-- 1. Ensure entity exists
INSERT INTO mdm_entity_catalog (
  tenant_id, entity_urn, entity_name, entity_type, domain, module, created_by
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'sales.orders',
  'Sales Orders',
  'table',
  'sales',
  'orders',
  'admin'
) ON CONFLICT (tenant_id, entity_urn) DO NOTHING;

-- 2. Add field
INSERT INTO mdm_global_metadata (
  tenant_id, canonical_key, entity_urn, label, data_type, domain, module,
  tier, owner_id, steward_id, created_by, updated_by
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'sales.orders.order_total',
  'sales.orders',
  'Order Total Amount',
  'decimal',
  'sales',
  'orders',
  'tier3',
  'sales-team',
  'data-steward',
  'admin',
  'admin'
);
```

### Lite View for Queries

```sql
-- Find all fields in sales domain
SELECT * FROM vw_mdm_lite_metadata
WHERE domain = 'sales'
ORDER BY entity_urn, field_name;

-- Find fields by label (full-text search)
SELECT canonical_key, label, data_type, tier
FROM vw_mdm_lite_metadata
WHERE label ILIKE '%total%';
```

### Lite Mode Constraints

| Constraint | Value |
|------------|-------|
| Allowed tiers | `tier3`, `tier4`, `tier5` |
| Standard pack | Optional (ignored if provided) |
| Approval | None required |
| Audit | Logged but no workflow |

---

## 🏛️ Governed Mode

### When to Use

- Core identity fields (tenant_id, user_id)
- Financial reporting fields (revenue, cost, GL accounts)
- Compliance-sensitive fields (PII, audit logs)
- Any field that touches MFRS/IFRS/SOC2/GDPR

### What You Get

- **HITL approval:** Changes reviewed before applying
- **Standard pack anchoring:** Regulatory traceability
- **Change diff:** Full before/after comparison
- **Audit trail:** Who, when, why, what

### Quick Start

#### Via REST API (Creates Approval Request)

```bash
POST /api/metadata-studio/fields
Content-Type: application/json

{
  "canonical_key": "finance.journal_entries.revenue_gross",
  "entity_urn": "finance.journal_entries",
  "label": "Gross Revenue",
  "data_type": "decimal",
  "format": "18,2",
  "tier": "tier1",
  "standard_pack_id": "MFRS_15",
  "description": "Total revenue before adjustments per MFRS 15",
  "owner_id": "cfo",
  "steward_id": "finance-steward"
}
```

**Response:**
```json
{
  "canonical_key": "finance.journal_entries.revenue_gross",
  "status": "pending_approval",
  "approval_id": "apr_123456",
  "required_approver": "kernel_architect",
  "governance": {
    "tier": "tier1",
    "standard_pack_id": "MFRS_15",
    "standard_pack_name": "Revenue from Contracts with Customers"
  }
}
```

#### Approval Workflow

1. **Request Created:** Field definition submitted, stored as pending
2. **Notification:** Approver notified (Slack, email, dashboard)
3. **Review:** Approver sees current state, proposed change, diff
4. **Decision:** Approve / Reject / Request Changes
5. **Apply:** On approval, changes applied with full audit

#### Via Retool/Admin UI

The Metadata Studio admin UI provides:
- Pending approvals queue
- Side-by-side diff view
- Comment thread for discussion
- One-click approve/reject
- Remediation dashboard for violations

### Governed Mode Constraints

| Constraint | Value |
|------------|-------|
| Allowed tiers | `tier1`, `tier2` (also `tier3+` if using this path) |
| Standard pack | **Required** for tier1/tier2 |
| Approval | Required from `kernel_architect` (tier1) or `metadata_steward` (tier2) |
| Audit | Full workflow history preserved |

---

## 🔄 Tier Promotion

Fields can be **promoted** from Lite to Governed:

### Scenario: Prototype → Production

1. Developer creates `sales.orders.discount_code` as `tier4` (Lite Mode)
2. Business decides this field needs audit tracking
3. Steward promotes to `tier2` with `SOC2_AUDIT` standard pack

### Via API

```bash
POST /api/metadata-studio/fields/promote
Content-Type: application/json

{
  "canonical_key": "sales.orders.discount_code",
  "new_tier": "tier2",
  "standard_pack_id": "SOC2_AUDIT",
  "reason": "Field now subject to audit logging requirements"
}
```

This triggers:
1. Validation that standard_pack_id is provided
2. Approval request to `metadata_steward`
3. On approval, tier updated with full audit trail

---

## 📊 Governance Dashboard

Track the balance between Lite and Governed fields:

```sql
SELECT 
  domain,
  tier,
  COUNT(*) AS field_count,
  COUNT(*) FILTER (WHERE standard_pack_id IS NOT NULL) AS anchored,
  COUNT(*) FILTER (WHERE standard_pack_id IS NULL) AS unanchored
FROM mdm_global_metadata
WHERE tenant_id = :tenant_id
GROUP BY domain, tier
ORDER BY domain, tier;
```

### Key Metrics

| Metric | Healthy Range | Alert Threshold |
|--------|---------------|-----------------|
| % Tier1/2 with standard_pack | 100% | < 100% |
| Lite fields created/week | Varies | > 100 (review needed) |
| Promotions/week | Low | Spike = governance gap |
| Pending approvals | < 10 | > 20 |

---

## 🤖 AI Orchestra Access

AI Orchestras operate under **autonomy tiers**:

| Orchestra Tier | Metadata Access |
|----------------|-----------------|
| **Tier 0** (Read-Only) | Query `vw_mdm_lite_metadata`, no writes |
| **Tier 1** (Suggest) | Propose new fields via Lite Mode, requires human apply |
| **Tier 2** (Propose) | Create approval requests, HITL required |
| **Tier 3** (Auto-Apply) | Apply pre-approved field templates only |

### Example: AI Suggesting a Field

```typescript
// AI Orchestra (Tier 1) suggests a new field
const suggestion = {
  entity_urn: 'inventory.stock_levels',
  field_name: 'reorder_point',
  label: 'Reorder Point Quantity',
  data_type: 'integer',
  tier: 'tier3',
  rationale: 'Common inventory management metric',
  confidence: 0.85
};

// Create as suggestion (not applied)
POST /api/metadata-studio/lite/suggest
{ ...suggestion, source: 'ai-orchestra', orchestra_id: 'db-governance' }

// Human reviews in dashboard, clicks "Approve & Apply"
```

---

## 🔧 Configuration

### Enable/Disable Lite Mode

```typescript
// apps/kernel/src/metadata-studio/config.ts
export const METADATA_CONFIG = {
  liteMode: {
    enabled: true,  // Set to false to require approval for all fields
    maxTier: 'tier3',  // Highest tier allowed in Lite Mode
    allowedDomains: ['sales', 'operations', 'hr'],  // Restrict domains
    blockedDomains: ['kernel', 'finance'],  // These always require Governed Mode
  },
  governedMode: {
    tier1Approver: 'kernel_architect',
    tier2Approver: 'metadata_steward',
    requireComment: true,  // Approver must add comment
  }
};
```

### Per-Tenant Override

```sql
-- Tenant-specific config in kernel.tenant_settings
INSERT INTO kernel.tenant_settings (tenant_id, key, value)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'metadata.lite_mode.enabled',
  'true'
);
```

---

## ✅ Decision Tree

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Is this a kernel identity field (tenant_id, user_id, session)?             │
│   YES → Governed Mode (tier1, KERNEL_* pack)                               │
│   NO ↓                                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Is this a financial reporting field (revenue, cost, GL)?                   │
│   YES → Governed Mode (tier1, MFRS_* pack)                                 │
│   NO ↓                                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Is this PII or subject to GDPR/PDPA?                                       │
│   YES → Governed Mode (tier2, GDPR_* or PDPA_* pack)                       │
│   NO ↓                                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Is this an audit/security field?                                           │
│   YES → Governed Mode (tier2, SOC2_* pack)                                 │
│   NO ↓                                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Is this a business-critical field with cross-system dependencies?          │
│   YES → Governed Mode (tier2 or tier3 with pack)                           │
│   NO ↓                                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Default: Lite Mode (tier3-5, no pack required)                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📚 References

| Document | Purpose |
|----------|---------|
| REF_METADATA_GLOSSARY.md | Term definitions |
| PRD_META_01_METADATA_STUDIO.md | Full PRD |
| CONT_06_SCHEMA_SPEC.md | Schema definitions |
| CONT_06_HEXAGON_MAPPING.md | Cell specifications |

---

*This guide is part of the Canon Governance System. Feedback welcome via GitHub issues.*
