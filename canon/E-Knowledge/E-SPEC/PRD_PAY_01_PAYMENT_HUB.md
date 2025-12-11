# 📋 PRD: PAY_01 Payment Hub (Unified)

**Version:** 2.0 (Consolidated)  
**Last Updated:** 2024-12-11  
**Status:** READY FOR BUILD  
**Document ID:** `DOC_PAY_01`

---

## 📑 Document Registry

| ID | Type | Name | Status |
|----|------|------|--------|
| `DOC_PAY_01` | PRD | Payment Hub (Unified) | ✅ Active |
| `SCH_PAY_01` | Schema | Payment Transaction Schema | ✅ Active |
| `SCH_PAY_02` | Schema | Treasury Context Schema | ✅ Active |
| `PAG_PAY_01` | Page | Payment Hub (Dual-Lens) | ✅ Active |
| `COM_PAY_01` | Component | AuditSidebar | ✅ Active |
| `COM_PAY_02` | Component | TreasuryHeader | ✅ Active |
| `COM_PAY_03` | Component | FunctionalCard | ✅ Active |
| `COM_PAY_04` | Component | PaymentTable | ✅ Active |
| `FLW_PAY_01` | Flow | CFO Single Approval | ✅ Active |
| `FLW_PAY_02` | Flow | Batch Cluster Approval | ✅ Active |
| `FLW_PAY_03` | Flow | IC Settlement | ✅ Active |

---

## 1. 🎯 Executive Summary

### 1.1 Vision

We are building a **Group-Aware Financial Terminal** that serves dual purposes:

1. **Efficiency Mode:** High-volume batch processing for routine payments
2. **Strategy Mode:** Deep dive into subsidiary health and intercompany settlement

### 1.2 Core Philosophy

> **"Observability First, Action Second."**  
> **"Protect. Correct. React."**

### 1.3 Target Audience

| Persona | Primary Use | View Preference |
|---------|-------------|-----------------|
| **Group CFO** | Strategic oversight, IC settlement | Entity View |
| **Financial Controller** | Compliance, audit readiness | Both Views |
| **AP Manager** | High-volume processing | Functional View |
| **Treasury Analyst** | Liquidity monitoring | Entity View |

### 1.4 The Problem We Solve

| Problem | Traditional Approach | Our Solution |
|---------|---------------------|--------------|
| **100 Logins Problem** | Check 15 bank portals for cash | Treasury Header shows all-in-one |
| **IC Black Hole** | Unmatched IC transactions create variance | Elimination status blocks unmatched |
| **Utility Wednesday** | 500 invoices approved one-by-one | Functional clusters batch approve |
| **Audit Stress** | Scramble for WHO/WHAT/WHEN/WHERE/HOW | 4W1H Sidebar instant answers |

---

## 2. 🏗️ Dual-Lens Architecture

### 2.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PAY_01 PAYMENT HUB                                  │
│                    (Single Window, Dual Lens)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  [⚡ FUNCTIONAL VIEW]  |  [🏢 ENTITY VIEW]     ← TAB TOGGLE         │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────┬───────────────────────────────────┐   │
│   │                                 │                                   │   │
│   │   75% - MAIN CONTENT            │   25% - AUDIT SIDEBAR             │   │
│   │   (Cards or Table)              │   (4W1H Orchestra)                │   │
│   │                                 │                                   │   │
│   └─────────────────────────────────┴───────────────────────────────────┘   │
│                                                                             │
│   SHARED: Same DB → Same Schema → Different UI Rendering                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Tab 1: Functional View (Efficiency Lens) `PAG_PAY_01_TAB_FUNC`

**Goal:** High-volume processing (e.g., "Utility Wednesday")

**Layout:** Card-based Cluster Grid

**Logic:** Aggregates invoices into functional groups

```
┌────────────────────────────────────────┐  ┌────────────────────────────────────────┐
│  ⚡ UTILITIES (Global)                 │  │  🚚 LOGISTICS (Global)                 │
│  ────────────────────────────────────  │  │  ────────────────────────────────────  │
│  📄 142 Invoices   |   💰 $45,200      │  │  📄 38 Invoices    |   💰 $128,500     │
│  ────────────────────────────────────  │  │  ────────────────────────────────────  │
│  🟢 STATUS: CLEAN                      │  │  🟡 STATUS: 3 ANOMALIES                │
│  0 Anomalies found.                    │  │  ⚠️ Review required                    │
│  ────────────────────────────────────  │  │  ────────────────────────────────────  │
│         [ ✅ APPROVE BATCH ]           │  │         [ 🔍 REVIEW RISKS ]            │
└────────────────────────────────────────┘  └────────────────────────────────────────┘

┌────────────────────────────────────────┐  ┌────────────────────────────────────────┐
│  💼 PROFESSIONAL SERVICES              │  │  🏛️ INTERCOMPANY                       │
│  ────────────────────────────────────  │  │  ────────────────────────────────────  │
│  📄 22 Invoices    |   💰 $340,000     │  │  📄 8 Transactions |   💰 $1,200,000   │
│  ────────────────────────────────────  │  │  ────────────────────────────────────  │
│  🟡 STATUS: 1 HIGH VALUE               │  │  🔴 STATUS: 2 UNMATCHED                │
│  Requires CFO approval                 │  │  ⛔ Cannot batch - IC rules            │
│  ────────────────────────────────────  │  │  ────────────────────────────────────  │
│         [ 🔍 REVIEW RISKS ]            │  │         [ ⚖️ SETTLE IC ]               │
└────────────────────────────────────────┘  └────────────────────────────────────────┘
```

**Functional Card Behavior:**

| Card Status | Button | Action |
|-------------|--------|--------|
| `CLEAN` (0 Anomalies) | `APPROVE BATCH` | Approve all in cluster |
| `ANOMALIES > 0` | `REVIEW RISKS` | Filter to flagged items only |
| `INTERCOMPANY` | `SETTLE IC` | Open IC settlement workflow |
| `HIGH VALUE` | `REVIEW RISKS` | CFO threshold exceeded |

### 2.3 Tab 2: Entity View (Strategy Lens) `PAG_PAY_01_TAB_ENTITY`

**Goal:** Deep dive into specific subsidiary health

**Layout:** Treasury Header + Master-Detail Table

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TREASURY COMMAND BAR                                       [COM_PAY_02]    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ENTITY: [ 🏢 Acme Europe (Sub B) ▼ ]   |   BANK: Barclays ****9921         │
│  ─────────────────────────────────────────────────────────────────────────  │
│  💰 CASH: $45,000 (⚠️ LOW)              📉 BURN: 104% of Budget             │
│  ⚖️ IC POSITION: -$200k (Net Borrower)  |  📅 RUNWAY: < 1 Month             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────┬───────────────────────────────────┐
│  PAYMENT TABLE                          │   AUDIT SIDEBAR (4W1H)            │
│  ┌─────────────────────────────────┐   │   ┌───────────────────────────────┐│
│  │ ID     │ Vendor │ Amount │ Status│   │   │  📋 WHAT: INV-8821           ││
│  ├─────────────────────────────────┤   │   │  👤 WHO: Sarah → CFO          ││
│  │ PAY-01 │ Acme   │ $12.5k │ 🟡    │◄──┼───│  🕐 WHEN: Due Mar 15         ││
│  │ PAY-02 │ Beta   │ $55k   │ 🛡️    │   │   │  📍 WHERE: CC-901, GL-5000   ││
│  │ PAY-03 │ IC→SubA│ $200k  │ 🔴    │   │   │  ⚙️ HOW: Wire, USD            ││
│  └─────────────────────────────────┘   │   │                               ││
│                                         │   │  [  REJECT  ] [ ✅ APPROVE ]  ││
│                                         │   └───────────────────────────────┘│
└─────────────────────────────────────────┴───────────────────────────────────┘
```

### 2.4 Shared Components

| Component ID | Name | Used In | Purpose |
|--------------|------|---------|---------|
| `COM_PAY_01` | AuditSidebar | Both Views | 4W1H contextual display |
| `COM_PAY_02` | TreasuryHeader | Entity View | Cash/IC position |
| `COM_PAY_03` | FunctionalCard | Functional View | Cluster summary |
| `COM_PAY_04` | PaymentTable | Entity View | Transaction list |
| `COM_PAY_05` | ApprovalActions | Both Views | Approve/Reject buttons |

### 2.5 Responsive Behavior

| Screen | Layout |
|--------|--------|
| **Desktop (≥1280px)** | Fixed 75/25 split, both tabs available |
| **Tablet (768-1279px)** | 65/35 split, tabs collapse to dropdown |
| **Mobile (<768px)** | Full-width content, sidebar as drawer |

---

## 3. 📊 Unified Data Schema

### 3.1 Payment Transaction Schema `SCH_PAY_01`

```typescript
// ============================================================================
// SCH_PAY_01: UNIFIED PAYMENT SCHEMA
// Single schema serving both Functional and Entity views
// ============================================================================

import { MetadataField } from '@/kernel';

export const PAYMENT_SCHEMA: MetadataField[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    technical_name: 'tx_id', 
    business_term: 'Payment ID', 
    data_type: 'code', 
    is_critical: true, 
    width: 120,
    description: 'Unique payment transaction identifier'
  },
  { 
    technical_name: 'beneficiary', 
    business_term: 'Beneficiary', 
    data_type: 'text', 
    width: 200,
    description: 'Vendor or recipient name'
  },
  { 
    technical_name: 'invoice_ref', 
    business_term: 'Invoice #', 
    data_type: 'code', 
    width: 120,
    description: 'Reference to source invoice'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP CONTEXT (New in V2.0)
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    technical_name: 'tx_type', 
    business_term: 'Type', 
    data_type: 'status',
    width: 100,
    status_config: {
      'external': 'bg-gray-800 text-gray-300 border-gray-600',
      'intercompany': 'bg-purple-900/30 text-purple-400 border-purple-800' 
    },
    description: 'Transaction type: external vendor or intercompany'
  },
  { 
    technical_name: 'elimination_status', 
    business_term: 'IC Match', 
    data_type: 'status',
    width: 100,
    status_config: { 
      'matched': 'bg-emerald-900/30 text-emerald-400 border-emerald-800', 
      'unmatched': 'bg-red-900/30 text-red-400 border-red-800',
      'n/a': 'bg-gray-800 text-gray-400 border-gray-600'
    },
    description: 'Intercompany elimination matching status'
  },
  { 
    technical_name: 'functional_cluster', 
    business_term: 'Cluster', 
    data_type: 'status',
    width: 120,
    status_config: {
      'utilities': 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
      'logistics': 'bg-blue-900/30 text-blue-400 border-blue-800',
      'professional': 'bg-purple-900/30 text-purple-400 border-purple-800',
      'intercompany': 'bg-pink-900/30 text-pink-400 border-pink-800',
      'other': 'bg-gray-800 text-gray-400 border-gray-600'
    },
    description: 'Functional grouping for batch processing'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OBSERVABILITY (New in V2.0)
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    technical_name: 'risk_score', 
    business_term: 'Risk Score', 
    data_type: 'number',
    width: 80,
    description: 'Calculated risk score 0-100'
  },
  { 
    technical_name: 'deviation', 
    business_term: '% vs Avg', 
    data_type: 'percentage',
    width: 80,
    description: 'Deviation from historical average for this vendor'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MONEY (Governed - Critical)
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    technical_name: 'amount', 
    business_term: 'Amount', 
    data_type: 'currency', 
    format_pattern: 'USD', 
    is_critical: true, 
    width: 130,
    description: 'Payment amount in base currency'
  },
  { 
    technical_name: 'currency', 
    business_term: 'Currency', 
    data_type: 'text',
    width: 80,
    description: 'Transaction currency code'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS (Workflow)
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    technical_name: 'status', 
    business_term: 'Status', 
    data_type: 'status', 
    width: 120,
    status_config: {
      'draft': 'bg-gray-800 text-gray-400 border-gray-600',
      'pending': 'bg-amber-900/30 text-amber-400 border-amber-800',
      'approved': 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
      'rejected': 'bg-red-900/30 text-red-400 border-red-800',
      'paid': 'bg-blue-900/30 text-blue-400 border-blue-800',
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOW (Payment Method)
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    technical_name: 'method', 
    business_term: 'Method', 
    data_type: 'status', 
    width: 100,
    status_config: { 
      'wire': 'bg-blue-900/30 text-blue-400 border-blue-800', 
      'ach': 'bg-purple-900/30 text-purple-400 border-purple-800',
      'check': 'bg-gray-800 text-gray-400 border-gray-600',
      'card': 'bg-cyan-900/30 text-cyan-400 border-cyan-800'
    }
  },
  { 
    technical_name: 'bank_account', 
    business_term: 'Bank Account', 
    data_type: 'text',
    width: 150,
    description: 'Destination bank account (masked)'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WHO (Audit Trail)
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    technical_name: 'requested_by', 
    business_term: 'Requestor', 
    data_type: 'text', 
    width: 150 
  },
  { 
    technical_name: 'requestor_id', 
    business_term: 'Requestor ID', 
    data_type: 'code', 
    width: 100,
    hidden: true,
    description: 'User ID for SoD enforcement'
  },
  { 
    technical_name: 'approved_by', 
    business_term: 'Approved By', 
    data_type: 'text', 
    width: 150 
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WHEN (Timeline)
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    technical_name: 'created_at', 
    business_term: 'Created', 
    data_type: 'datetime',
    width: 150 
  },
  { 
    technical_name: 'due_date', 
    business_term: 'Due Date', 
    data_type: 'date', 
    is_critical: true,
    width: 120 
  },
  { 
    technical_name: 'approved_at', 
    business_term: 'Approved At', 
    data_type: 'datetime',
    width: 150 
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WHERE (Allocation)
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    technical_name: 'entity', 
    business_term: 'Entity', 
    data_type: 'text', 
    width: 150,
    description: 'Legal entity / subsidiary'
  },
  { 
    technical_name: 'cost_center', 
    business_term: 'Cost Center', 
    data_type: 'code',
    width: 120 
  },
  { 
    technical_name: 'gl_account', 
    business_term: 'GL Account', 
    data_type: 'code',
    width: 100 
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENT COMPLETENESS
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    technical_name: 'docs_attached', 
    business_term: 'Docs', 
    data_type: 'number',
    width: 60,
    description: 'Number of documents attached (e.g., 3/4)'
  },
  { 
    technical_name: 'docs_required', 
    business_term: 'Docs Req', 
    data_type: 'number',
    width: 60,
    hidden: true,
    description: 'Number of documents required'
  },
];
```

### 3.2 Treasury Context Schema `SCH_PAY_02`

```typescript
// ============================================================================
// SCH_PAY_02: TREASURY CONTEXT SCHEMA
// Solves the "100 Logins Problem" without backend integration
// ============================================================================

export interface TreasuryContext {
  entity_id: string;
  entity_name: string;
  bank_name: string;
  bank_account_masked: string;
  
  // Liquidity
  cash_balance: number;
  cash_status: 'healthy' | 'low' | 'critical';
  budget_used_pct: number;
  runway_months: number;
  
  // Intercompany Position
  ic_net_position: number;  // Positive = Net Lender, Negative = Net Borrower
  ic_status: 'lender' | 'borrower' | 'balanced';
}

// Mock data for MVP (no backend integration needed)
export const TREASURY_DATA: Record<string, TreasuryContext> = {
  'sub_a': { 
    entity_id: 'sub_a',
    entity_name: 'Acme Holdings (HQ)',
    bank_name: 'Chase',
    bank_account_masked: '****4821',
    cash_balance: 1250000, 
    cash_status: 'healthy',
    budget_used_pct: 0.45, 
    runway_months: 8,
    ic_net_position: 200000,
    ic_status: 'lender'
  },
  'sub_b': { 
    entity_id: 'sub_b',
    entity_name: 'Acme Europe',
    bank_name: 'Barclays',
    bank_account_masked: '****9921',
    cash_balance: 45000, 
    cash_status: 'critical',
    budget_used_pct: 1.04,  // Over budget!
    runway_months: 0.8,
    ic_net_position: -200000,
    ic_status: 'borrower'
  },
  'sub_c': { 
    entity_id: 'sub_c',
    entity_name: 'Acme Asia Pacific',
    bank_name: 'HSBC',
    bank_account_masked: '****3312',
    cash_balance: 580000, 
    cash_status: 'healthy',
    budget_used_pct: 0.72, 
    runway_months: 4,
    ic_net_position: 0,
    ic_status: 'balanced'
  },
};
```

### 3.3 Payment Type Interface

```typescript
// ============================================================================
// UNIFIED PAYMENT TYPE
// ============================================================================

export interface Payment {
  id: string;
  tx_id: string;
  beneficiary: string;
  invoice_ref: string;
  amount: number;
  currency: string;
  method: 'wire' | 'ach' | 'check' | 'card';
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'paid';
  
  // GROUP CONTEXT
  tx_type: 'external' | 'intercompany';
  elimination_status: 'matched' | 'unmatched' | 'n/a';
  functional_cluster: 'utilities' | 'logistics' | 'professional' | 'intercompany' | 'other';
  counterparty_entity?: string;  // For IC transactions
  
  // OBSERVABILITY
  risk_score: number;
  deviation?: number;
  
  // WHO
  requested_by: string;
  requestor_id: string;
  approved_by?: string;
  approver_id?: string;
  
  // WHEN
  created_at: string;
  due_date: string;
  approved_at?: string;
  
  // WHERE
  entity: string;
  cost_center: string;
  gl_account: string;
  
  // DOCUMENTS
  docs_attached: number;
  docs_required: number;
  manifests?: Manifest[];
  
  // GOVERNANCE
  policy_violation?: string;
  sod_warning?: boolean;
}

export interface Manifest {
  type: 'invoice' | 'receipt' | 'contract' | 'po';
  ref_id: string;
  label: string;
  file_size?: string;
  url?: string;
}
```

### 3.4 Functional Cluster Schema

```typescript
// ============================================================================
// FUNCTIONAL CLUSTER AGGREGATION
// Powers the Functional View card grid
// ============================================================================

export interface FunctionalCluster {
  cluster_id: string;
  cluster_name: string;
  icon: string;
  
  // Aggregates
  invoice_count: number;
  total_amount: number;
  
  // Status
  anomaly_count: number;
  status: 'clean' | 'anomalies' | 'blocked';
  
  // Actions
  can_batch_approve: boolean;
  block_reason?: string;
}

// Example cluster aggregation
export const FUNCTIONAL_CLUSTERS: FunctionalCluster[] = [
  {
    cluster_id: 'utilities',
    cluster_name: 'Utilities (Global)',
    icon: '⚡',
    invoice_count: 142,
    total_amount: 45200,
    anomaly_count: 0,
    status: 'clean',
    can_batch_approve: true,
  },
  {
    cluster_id: 'logistics',
    cluster_name: 'Logistics (Global)',
    icon: '🚚',
    invoice_count: 38,
    total_amount: 128500,
    anomaly_count: 3,
    status: 'anomalies',
    can_batch_approve: false,
    block_reason: '3 anomalies require review',
  },
  {
    cluster_id: 'intercompany',
    cluster_name: 'Intercompany',
    icon: '🏛️',
    invoice_count: 8,
    total_amount: 1200000,
    anomaly_count: 2,
    status: 'blocked',
    can_batch_approve: false,
    block_reason: '2 unmatched IC transactions',
  },
];
```

---

## 4. 🔍 The 4W1H Audit Orchestra `COM_PAY_01`

### 4.1 Sidebar Structure

When a transaction is clicked (in either view), the **Audit Sidebar** provides instant context:

```
┌───────────────────────────────────────────────────────────────────────────┐
│  AUDIT SIDEBAR                                              [COM_PAY_01]  │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  PAY-8821                                       Status: 🟡 PENDING  │  │
│  │  Logistics Co. International                                       │  │
│  │  ─────────────────────────────────────────────────────────────────  │  │
│  │  $12,500.00                          Type: EXTERNAL                │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  🛡️ GOVERNANCE ALERT                                               │  │
│  │  Amount > $10k requires VP approval                                │  │
│  │  Risk Score: ████████░░ 85/100                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  📋 WHAT ─────────────────────────────────────────────────────────────    │
│  │  Invoice Reference    INV-2024-001                                 │  │
│  │  PO Reference         PO-4422                                      │  │
│  │  Description          Freight services                             │  │
│                                                                           │
│  👤 WHO ──────────────────────────────────────────────────────────────    │
│  │  Requested By         Sarah Jenkins                                │  │
│  │  Awaiting             CFO Approval                                 │  │
│  │  ⚠️ SoD Check         PASSED                                       │  │
│                                                                           │
│  🕐 WHEN ─────────────────────────────────────────────────────────────    │
│  │  Created              Mar 10, 2024 09:00                           │  │
│  │  Due Date             Mar 15, 2024 (⚠️ 2 days)                     │  │
│  │  Aging                5 days                                       │  │
│                                                                           │
│  📍 WHERE ────────────────────────────────────────────────────────────    │
│  │  Entity               Subsidiary A                                 │  │
│  │  Cost Center          CC-901 (Logistics)                           │  │
│  │  GL Account           5000-20 (Freight)                            │  │
│                                                                           │
│  ⚙️ HOW ──────────────────────────────────────────────────────────────    │
│  │  Payment Method       Wire Transfer                                │  │
│  │  Currency             USD                                          │  │
│  │  Beneficiary Bank     Chase ****4821                               │  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  ⚖️ INTERCOMPANY CONTEXT (if tx_type = 'intercompany')             │  │
│  │  ─────────────────────────────────────────────────────────────────  │  │
│  │  Route: Sub A → Sub B                                              │  │
│  │  Elimination: 🔴 UNMATCHED                                         │  │
│  │  Netting: Can net against Loan #LN-992?                            │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  📎 LINKED MANIFESTS ─────────────────────────────────────────────────    │
│  │  📄 Invoice_INV-2024-001.pdf            1.2 MB                     │  │
│  │  📄 PurchaseOrder_4422.pdf              850 KB                     │  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │         [  REJECT  ]           [ ✅ APPROVE ]                      │  │
│  │                                                                     │  │
│  │         Approving as: CFO (You)                                    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Dimension Mapping

| Dimension | Question | Data Fields | UI Section |
|-----------|----------|-------------|------------|
| **WHAT** | What is being paid? | `tx_id`, `invoice_ref`, `description` | Top section + WHAT |
| **WHO** | Who requested? Who approves? | `requested_by`, `approved_by`, SoD check | WHO section |
| **WHEN** | Created when? Due when? | `created_at`, `due_date`, aging indicator | WHEN section |
| **WHERE** | Which entity? Cost center? | `entity`, `cost_center`, `gl_account` | WHERE section |
| **HOW** | Payment method? Currency? | `method`, `currency`, `bank_account` | HOW section |
| **IC Context** | IC route? Matched? | `counterparty_entity`, `elimination_status` | IC section (conditional) |

### 4.3 Conditional Sections

| Condition | Additional Section |
|-----------|-------------------|
| `risk_score > 50` | 🛡️ Governance Alert |
| `tx_type === 'intercompany'` | ⚖️ Intercompany Context |
| `sod_warning === true` | ⚠️ SoD Violation Warning |
| `docs_attached < docs_required` | 📎 Missing Documents Warning |
| `due_date < today` | ⏰ Overdue Alert |

---

## 5. 🛡️ Governance & Logic Rules

### 5.1 Segregation of Duties (SoD) `RULE_PAY_01`

```typescript
// ============================================================================
// RULE_PAY_01: SEGREGATION OF DUTIES
// ============================================================================

const SOD_RULES = {
  // Rule 1: Requestor cannot approve their own payment
  self_approval_blocked: true,
  
  // Rule 2: Amount thresholds determine required approver level
  thresholds: {
    auto_approve: 500,       // < $500 auto-approved
    manager_required: 5000,  // $500 - $5,000 needs manager
    vp_required: 10000,      // $5,000 - $10,000 needs VP
    cfo_required: 50000,     // $10,000+ needs CFO
  },
  
  // MVP: Warn. Phase 2: Block
  enforcement: 'warn' as const,
};

// UI Behavior
// ├── If currentUser.id === payment.requestor_id:
// │   ├── "Approve" button DISABLED
// │   └── Tooltip: "SoD Violation: You cannot approve your own request."
// │
// └── If amount > threshold without required role:
//     ├── "Approve" button shows warning
//     └── Tooltip: "Amount requires VP approval"
```

### 5.2 Intercompany Elimination Logic `RULE_PAY_02`

```typescript
// ============================================================================
// RULE_PAY_02: INTERCOMPANY NIGHTMARE CATCHER
// ============================================================================

const IC_RULES = {
  // Rule: IC transactions must be matched before approval
  require_elimination_match: true,
  
  // UI Behavior for unmatched IC
  unmatched_behavior: {
    table_row: 'highlight-red',
    approve_blocked: true,
    sidebar_warning: 'Unilateral IC Booking - Cannot approve until matched',
  },
};

// Check function
function canApproveIC(payment: Payment): { allowed: boolean; reason?: string } {
  if (payment.tx_type !== 'intercompany') {
    return { allowed: true };
  }
  
  if (payment.elimination_status === 'unmatched') {
    return { 
      allowed: false, 
      reason: 'IC transaction has no matching entry in counterparty books' 
    };
  }
  
  return { allowed: true };
}
```

### 5.3 Batch Approval Logic `RULE_PAY_03`

```typescript
// ============================================================================
// RULE_PAY_03: BATCH APPROVAL RULES
// ============================================================================

const BATCH_RULES = {
  // Rule: Batch approve only for clean clusters
  require_zero_anomalies: true,
  
  // Rule: IC transactions cannot be batch approved
  block_ic_batch: true,
  
  // Rule: High-value items cannot be batch approved
  max_batch_amount: 10000,
};

// Check function
function canBatchApprove(cluster: FunctionalCluster): { allowed: boolean; reason?: string } {
  if (cluster.anomaly_count > 0) {
    return { 
      allowed: false, 
      reason: `${cluster.anomaly_count} anomalies require individual review` 
    };
  }
  
  if (cluster.cluster_id === 'intercompany') {
    return { 
      allowed: false, 
      reason: 'IC transactions require individual settlement' 
    };
  }
  
  return { allowed: true };
}
```

### 5.4 Document Completeness Rules `RULE_PAY_04`

```typescript
// ============================================================================
// RULE_PAY_04: DOCUMENT REQUIREMENTS
// ============================================================================

const DOC_REQUIREMENTS: Record<string, { required: string[]; optional: string[] }> = {
  under_1000: {
    required: ['invoice'],
    optional: ['receipt'],
  },
  under_10000: {
    required: ['invoice', 'po'],
    optional: ['contract'],
  },
  over_10000: {
    required: ['invoice', 'po', 'contract'],
    optional: ['receipt'],
  },
};

// MVP: Warning only. Phase 2: Block approval if docs missing.
function checkDocCompleteness(payment: Payment): { complete: boolean; missing: string[] } {
  const threshold = payment.amount < 1000 ? 'under_1000' 
                  : payment.amount < 10000 ? 'under_10000' 
                  : 'over_10000';
                  
  const required = DOC_REQUIREMENTS[threshold].required;
  const attached = payment.manifests?.map(m => m.type) || [];
  const missing = required.filter(r => !attached.includes(r as any));
  
  return { complete: missing.length === 0, missing };
}
```

---

## 6. 🎬 User Flows

### 6.1 Flow 1: CFO Single Approval `FLW_PAY_01`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FLW_PAY_01: CFO SINGLE APPROVAL FLOW                                       │
└─────────────────────────────────────────────────────────────────────────────┘

1. CFO opens Payment Hub
   └─→ Default: Entity View, "My Queue" filter
   └─→ Treasury Header shows: HQ cash $1.25M, 3 pending approvals

2. CFO sees $55,000 payment flagged with 🛡️ shield
   └─→ Row highlighted (risk_score > 80)
   └─→ CFO clicks row

3. Audit Sidebar slides in
   └─→ 4W1H populated:
       ├── WHAT: Consulting Q1 Final
       ├── WHO: Jessica Pearson → CFO (You)
       ├── WHEN: Due Mar 25 (12 days)
       ├── WHERE: Subsidiary B, CC-001 Executive
       └── HOW: Wire, USD

4. CFO reviews governance alert
   └─→ "New Vendor + High Value"
   └─→ Risk Score: 92/100

5. CFO clicks linked manifests
   └─→ Opens ConsultingQ1_Final.pdf
   └─→ Verifies contract ServiceAgreement_110.pdf

6. CFO clicks "APPROVE"
   └─→ SoD check: PASSED (Jessica ≠ CFO)
   └─→ status = 'approved'
   └─→ approved_by = 'CFO (You)'
   └─→ approved_at = now()
   └─→ Toast: "Payment approved successfully"
   └─→ Row moves out of "My Queue"
```

### 6.2 Flow 2: Batch Cluster Approval `FLW_PAY_02`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FLW_PAY_02: BATCH CLUSTER APPROVAL FLOW (Utility Wednesday)                │
└─────────────────────────────────────────────────────────────────────────────┘

1. AP Manager opens Payment Hub
   └─→ Switches to: Functional View tab
   └─→ Sees cluster grid with 4 cards

2. AP Manager sees ⚡ Utilities card
   └─→ 142 Invoices | $45,200
   └─→ Status: 🟢 CLEAN (0 Anomalies)
   └─→ Button: [ APPROVE BATCH ]

3. AP Manager clicks "APPROVE BATCH"
   └─→ Confirmation modal:
       "Approve 142 utility invoices totaling $45,200?"
       [Cancel] [Approve All]

4. AP Manager confirms
   └─→ All 142 payments: status = 'approved'
   └─→ approved_by = 'AP Manager (You)'
   └─→ approved_at = now()
   └─→ Toast: "Batch approved: 142 payments, $45,200"
   └─→ Card status updates to "✅ PROCESSED"

5. AP Manager sees 🚚 Logistics card
   └─→ 38 Invoices | $128,500
   └─→ Status: 🟡 3 ANOMALIES
   └─→ Button: [ REVIEW RISKS ]

6. AP Manager clicks "REVIEW RISKS"
   └─→ View filters to only 3 anomalous payments
   └─→ Entity View auto-opens for individual review
```

### 6.3 Flow 3: IC Settlement `FLW_PAY_03`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FLW_PAY_03: INTERCOMPANY SETTLEMENT FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

1. Group CFO opens Payment Hub
   └─→ Entity View, selects "Acme Europe (Sub B)"
   └─→ Treasury Header shows: Cash $45k (⚠️ CRITICAL), IC: -$200k Borrower

2. CFO sees IC transaction: $200,000 to Sub A
   └─→ Type: 🏛️ INTERCOMPANY
   └─→ Elimination: 🔴 UNMATCHED
   └─→ Row highlighted RED

3. CFO clicks row, Audit Sidebar opens
   └─→ ⚖️ IC Context section visible:
       ├── Route: Sub B → Sub A
       ├── Elimination: UNMATCHED
       └── Warning: "Unilateral booking detected"

4. CFO sees "Approve" button is DISABLED
   └─→ Tooltip: "Cannot approve unmatched IC transaction"
   └─→ Button shows: [ ⚖️ SETTLE IC ]

5. CFO clicks "SETTLE IC"
   └─→ Opens IC Settlement modal:
       ├── Shows Sub A's corresponding entry
       ├── Match status: PENDING
       └── [Create Matching Entry in Sub A]

6. CFO initiates match
   └─→ Both entries linked
   └─→ elimination_status = 'matched'
   └─→ Row changes to: Elimination: 🟢 MATCHED
   └─→ "Approve" button now ENABLED

7. CFO approves both sides
   └─→ IC pair approved together
   └─→ Consolidation elimination journal ready
```

---

## 7. 📁 File Structure

```
src/modules/payment/
├── PAY_01_PaymentHub.tsx              # Main page with dual-lens tabs
├── components/
│   ├── TreasuryHeader.tsx             # COM_PAY_02: Entity cash/IC position
│   ├── FunctionalCard.tsx             # COM_PAY_03: Cluster summary card
│   ├── PaymentTable.tsx               # COM_PAY_04: Transaction table
│   ├── AuditSidebar.tsx               # COM_PAY_01: 4W1H Orchestra
│   ├── AuditSection.tsx               # Reusable 4W1H section
│   ├── LinkedManifests.tsx            # Document links
│   ├── GovernanceAlert.tsx            # Risk/policy warnings
│   ├── ICSettlementContext.tsx        # Intercompany section
│   └── ApprovalActions.tsx            # COM_PAY_05: Approve/Reject
├── schemas/
│   └── paymentSchema.ts               # SCH_PAY_01: Unified schema
├── data/
│   ├── paymentData.ts                 # Mock payments + config
│   └── treasuryData.ts                # SCH_PAY_02: Treasury mock
├── hooks/
│   ├── usePaymentApproval.ts          # Approval logic + SoD
│   ├── useBatchApproval.ts            # Cluster batch logic
│   └── useTreasuryContext.ts          # Entity selector
├── rules/
│   ├── sodRules.ts                    # RULE_PAY_01
│   ├── icRules.ts                     # RULE_PAY_02
│   ├── batchRules.ts                  # RULE_PAY_03
│   └── docRules.ts                    # RULE_PAY_04
├── types.ts                           # TypeScript interfaces
└── index.ts                           # Barrel export
```

---

## 8. 🎨 Design Tokens

### 8.1 Color System

```css
/* === STATUS COLORS (Dark Theme First) === */
:root {
  /* Base */
  --color-bg-primary: #050505;
  --color-bg-secondary: #0A0A0A;
  --color-bg-tertiary: #111111;
  --color-border: #1F1F1F;
  
  /* Status - Draft */
  --status-draft-bg: #1F1F1F;
  --status-draft-text: #888888;
  --status-draft-border: #333333;
  
  /* Status - Pending */
  --status-pending-bg: rgba(245, 158, 11, 0.15);
  --status-pending-text: #FBBF24;
  --status-pending-border: #92400E;
  
  /* Status - Approved */
  --status-approved-bg: rgba(16, 185, 129, 0.15);
  --status-approved-text: #34D399;
  --status-approved-border: #065F46;
  
  /* Status - Rejected */
  --status-rejected-bg: rgba(239, 68, 68, 0.15);
  --status-rejected-text: #F87171;
  --status-rejected-border: #991B1B;
  
  /* Status - Paid */
  --status-paid-bg: rgba(59, 130, 246, 0.15);
  --status-paid-text: #60A5FA;
  --status-paid-border: #1E40AF;
  
  /* Accent */
  --color-accent: #28E7A2;
  --color-accent-hover: #20B881;
  --color-accent-glow: rgba(40, 231, 162, 0.3);
  
  /* 4W1H Icons */
  --icon-what: #3B82F6;    /* Blue */
  --icon-who: #8B5CF6;     /* Purple */
  --icon-when: #F59E0B;    /* Amber */
  --icon-where: #10B981;   /* Emerald */
  --icon-how: #EC4899;     /* Pink */
}
```

### 8.2 Typography

```css
/* === TYPOGRAPHY === */
:root {
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-sans: 'Inter', system-ui, sans-serif;
  
  --text-xs: 10px;
  --text-sm: 12px;
  --text-base: 14px;
  --text-lg: 16px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 30px;
}
```

---

## 9. ✅ Success Criteria (The "Controller Test")

| # | Test Question | Expected Answer | Validates |
|---|---------------|-----------------|-----------|
| 1 | **Liquidity Visibility:** Can I see Sub B is broke *before* I approve their payment? | Yes - Treasury Header | `COM_PAY_02` |
| 2 | **IC Safety:** Does the system block if I try to approve unmatched IC? | Yes - Button disabled | `RULE_PAY_02` |
| 3 | **Efficiency:** Can I approve 50 Utility bills in 2 clicks? | Yes - Functional View | `FLW_PAY_02` |
| 4 | **Audit Defense:** Can I explain WHO/WHAT/WHEN/WHERE/HOW 6 months later? | Yes - Sidebar history | `COM_PAY_01` |
| 5 | **SoD Enforcement:** Am I blocked from approving my own request? | Yes - Button disabled | `RULE_PAY_01` |
| 6 | **Doc Completeness:** Can I see 3/4 docs attached at a glance? | Yes - Table indicator | `docs_attached` |
| 7 | **Dual-Lens Switch:** Can I toggle between batch and detail mode? | Yes - Tab toggle | `PAG_PAY_01` |

---

## 10. 🚀 Build Sequence

### 10.1 Sprint Plan

| Sprint | Focus | Tasks | Output |
|--------|-------|-------|--------|
| **Sprint 1** | Data Layer | Setup schemas, mock data, types | `SCH_PAY_01`, `SCH_PAY_02` ready |
| **Sprint 2** | Components | Build all 5 components | `COM_PAY_01-05` ready |
| **Sprint 3** | Logic | Implement rules + hooks | `RULE_PAY_01-04` ready |
| **Sprint 4** | Assembly | Connect hub with dual tabs | `PAG_PAY_01` ready |
| **Sprint 5** | Polish | Mobile, animations, toast | **MVP Shippable** |

### 10.2 Detailed Tasks

| Step | Task | Estimate | Output |
|------|------|----------|--------|
| 1.1 | Create `paymentSchema.ts` | 30 min | `SCH_PAY_01` |
| 1.2 | Create `treasuryData.ts` | 20 min | `SCH_PAY_02` |
| 1.3 | Create mock payments (15 records) | 30 min | Test data |
| 2.1 | Build `TreasuryHeader.tsx` | 45 min | `COM_PAY_02` |
| 2.2 | Build `FunctionalCard.tsx` | 45 min | `COM_PAY_03` |
| 2.3 | Build `AuditSidebar.tsx` | 1.5 hr | `COM_PAY_01` |
| 2.4 | Build `ApprovalActions.tsx` | 30 min | `COM_PAY_05` |
| 3.1 | Implement SoD logic | 30 min | `RULE_PAY_01` |
| 3.2 | Implement IC blocking | 30 min | `RULE_PAY_02` |
| 3.3 | Implement batch logic | 30 min | `RULE_PAY_03` |
| 3.4 | Implement doc check | 20 min | `RULE_PAY_04` |
| 4.1 | Assemble dual-tab hub | 1 hr | `PAG_PAY_01` |
| 4.2 | Connect state management | 45 min | Working flow |
| 5.1 | Mobile drawer behavior | 30 min | Responsive |
| 5.2 | Toast notifications | 20 min | Feedback |
| 5.3 | Final polish | 30 min | **Done** |
| | **TOTAL** | **~10 hours** | |

---

## 11. 📊 RBAC & CRUD Matrix

### 11.1 Role-Based Access Control

| Role | View Functional | View Entity | Approve < $5k | Approve < $50k | Approve All | Batch Approve | IC Settle |
|------|-----------------|-------------|---------------|----------------|-------------|---------------|-----------|
| **Viewer** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **AP Clerk** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **AP Manager** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Finance Manager** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **CFO** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Group CFO** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 11.2 CRUD Operations

| Entity | Create | Read | Update | Delete | Notes |
|--------|--------|------|--------|--------|-------|
| `Payment` | AP Clerk+ | All | Draft owner only | Admin only | Status changes via workflow |
| `Approval` | System | All | ❌ | ❌ | Immutable audit |
| `Manifest` | AP Clerk+ | All | Draft owner only | Draft owner only | Linked to payment |
| `TreasuryContext` | ❌ | All | ❌ | ❌ | Mock data (Phase 2: API) |
| `FunctionalCluster` | ❌ | All | ❌ | ❌ | Computed aggregate |

---

## 12. 🔄 State Machine

```
                         ┌─────────────┐
                         │   DRAFT     │
                         └──────┬──────┘
                                │ Submit
                                ▼
                         ┌─────────────┐
              ┌──────────│   PENDING   │──────────┐
              │          └─────────────┘          │
              │ Reject                            │ Approve
              ▼                                   ▼
       ┌─────────────┐                     ┌─────────────┐
       │  REJECTED   │                     │  APPROVED   │
       └─────────────┘                     └──────┬──────┘
              │                                   │ Execute (Manual)
              │ Re-submit (Phase 2)               ▼
              └─────────────────────┐      ┌─────────────┐
                                    │      │    PAID     │
                                    └─────►└─────────────┘

Allowed Transitions:
├── draft → pending       (Submit by requestor)
├── pending → approved    (Approve by authorized role)
├── pending → rejected    (Reject with reason)
├── approved → paid       (Manual bank execution)
└── rejected → draft      (Re-submit - PHASE 2)

Blocked Transitions:
├── pending → paid        (Must go through approved)
├── paid → *              (Terminal state)
└── * → draft             (Cannot revert to draft)
```

---

## 13. 📋 Controller Review & Acceptance

### 13.1 Challenge Matrix (Retained from V1.0)

| Area | Challenge Count | 🟢 MVP | 🟡 Phase 2 | 🔴 Out of Scope |
|------|-----------------|--------|------------|-----------------|
| **A. Frontend UI/UX** | 6 | 2 | 3 | 1 |
| **B. Database/Schema** | 7 | 0 | 5 | 2 |
| **C. Middleware** | 6 | 0 | 2 | 4 |
| **D. Audit Readiness** | 5 | 2 | 1 | 2 |
| **E. Backend Logic** | 4 | 2 | 2 | 0 |
| **TOTAL** | 28 | 6 | 13 | 9 |

### 13.2 MVP Scope Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PAY_01 MVP SCOPE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✅ INCLUDED (MVP)                                                          │
│  ├── Dual-lens UI (Functional + Entity tabs)                               │
│  ├── Treasury Header with mock data                                        │
│  ├── 4W1H Audit Sidebar                                                    │
│  ├── SoD enforcement (soft block)                                          │
│  ├── IC elimination blocking                                               │
│  ├── Batch approval for clean clusters                                     │
│  ├── Document completeness indicator                                       │
│  └── Mobile-responsive drawer                                              │
│                                                                             │
│  🟡 PHASE 2 (Next Sprint)                                                   │
│  ├── Controller dashboard with saved filters                               │
│  ├── Multi-step approval workflow                                          │
│  ├── Immutable audit_log table                                             │
│  ├── Bank file export (ISO20022)                                           │
│  └── Payment runs / batching                                               │
│                                                                             │
│  ❌ OUT OF SCOPE (Future)                                                   │
│  ├── Multi-invoice payments                                                │
│  ├── Multi-currency / FX                                                   │
│  ├── Bank API integration                                                  │
│  ├── GL posting automation                                                 │
│  └── Upstream AP module sync                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 13.3 Controller Endorsement

| Strategic Positive | Audit Value |
|--------------------|-------------|
| **4W1H + Manifests** - Every payment explainable in one screen | ⭐⭐⭐⭐⭐ |
| **Schema-Driven Control** - Centralized, less rogue forms | ⭐⭐⭐⭐⭐ |
| **Dual-Lens Architecture** - Efficiency AND depth in one tool | ⭐⭐⭐⭐⭐ |
| **IC Nightmare Prevention** - Blocks unmatched before variance | ⭐⭐⭐⭐⭐ |

### 13.4 Formal Sign-Off

| Role | Decision | Conditions |
|------|----------|------------|
| Finance Controller | ✅ APPROVED | All 🟢 MVP items implemented |
| Product Owner | ✅ APPROVED | 🔴 items not promised to stakeholders |
| Tech Lead | ✅ APPROVED | 🟡 items prioritized in Phase 2 |

---

## 14. 📅 Phase Roadmap

| Phase | Focus | Timeline | Key Deliverables |
|-------|-------|----------|------------------|
| **Phase 1 (MVP)** | Dual-Lens Hub | Week 1-2 | Tabs, Treasury Header, 4W1H, SoD, IC blocking |
| **Phase 2** | Controller Features | Week 3-4 | Saved filters, audit_log, bank export, bulk approve |
| **Phase 3** | Integration | Week 5-8 | AP sync, GL posting, exception engine |
| **Phase 4** | Treasury | Week 9-12 | Bank API, multi-currency, payment runs |

---

## 15. 📎 Appendix

### 15.1 Mock Data Reference

See `src/modules/payment/data/paymentData.ts` for complete mock dataset.

### 15.2 Implementation Code

Full implementation code retained from V1.0 (Section 9) is valid for Entity View. Additional components for Functional View to be added in Sprint 2.

### 15.3 Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-10 | Initial PRD - Single Entity View |
| 2.0 | 2024-12-11 | Merged: Dual-Lens, Group Context, IC Settlement, Functional Clusters |

---

*Document ID: `DOC_PAY_01` | Version 2.0 (Consolidated) | Status: READY FOR BUILD*

