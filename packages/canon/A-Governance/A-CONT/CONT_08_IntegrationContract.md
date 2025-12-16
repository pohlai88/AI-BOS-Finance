# CONT_08: Lego Integration Contract

> **🔴 IMMUTABLE CONTRACT** — Canon Governance  
> **Version:** 1.0.0  
> **Status:** Active  
> **Scope:** All Cells, Molecules, Canons  
> **Derives From:** CONT_01 (Canon Identity), CONT_07 (Finance Architecture)

---

## 1. Executive Summary

### 1.1 Purpose

This contract mandates that **every Cell, Molecule, and Canon** in the AI-BOS platform MUST implement a standardized **Integration Adapter Layer** that enables:

1. **Standalone Deployment** — Any Cell can run independently without the full ERP
2. **External System Connectivity** — Standard interfaces for legacy system integration
3. **Event-Driven Communication** — Webhooks and event subscriptions for real-time sync
4. **Data Portability** — Import/Export capabilities for migration and interop

### 1.2 The "Lego Principle"

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LEGO INTEGRATION LAW                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  "Any Cell MUST be detachable from the monolith and attachable     │
│   to ANY external system via its Integration Adapter Layer."        │
│                                                                     │
│  If a Cell cannot run standalone, it is NOT a Cell — it is         │
│  a tightly-coupled module that violates Canon architecture.        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Integration Adapter Architecture

### 2.1 Mandatory Adapter Types

Every Cell MUST implement these four adapter categories:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CELL INTEGRATION LAYER                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │   INBOUND    │  │   OUTBOUND   │  │   WEBHOOK    │  │  DATA   │ │
│  │   ADAPTER    │  │   ADAPTER    │  │   ADAPTER    │  │ ADAPTER │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────┬────┘ │
│         │                 │                 │               │      │
│         ▼                 ▼                 ▼               ▼      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    CELL CORE SERVICES                        │  │
│  │           (PaymentService, ApprovalService, etc.)            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

| Adapter Type | Purpose | Direction | Examples |
|--------------|---------|-----------|----------|
| **Inbound** | Accept data from external systems | External → Cell | REST API, GraphQL, gRPC, File Import |
| **Outbound** | Send data to external systems | Cell → External | API calls, File Export, Message Queue |
| **Webhook** | Real-time event notifications | Cell → External | Status changes, Approval events |
| **Data** | Bulk import/export operations | Bidirectional | CSV, JSON, XML, EDI |

### 2.2 Adapter Interface Contract

**File:** `packages/kernel-core/src/ports/integrationPort.ts`

```typescript
/**
 * Integration Port - Mandatory for ALL Cells
 * 
 * CONT_08: Every Cell MUST implement this port to enable
 * standalone deployment and external system connectivity.
 */
export interface IntegrationPort {
  // ============================================================================
  // INBOUND ADAPTER
  // ============================================================================
  
  /**
   * Accept external entity and map to internal format
   * Used for: Invoice import, Vendor sync, GL account mapping
   */
  importEntity(
    externalId: string,
    externalType: string,
    payload: Record<string, unknown>,
    mappingProfile?: string
  ): Promise<InboundResult>;

  /**
   * Validate external payload against Cell's schema
   */
  validateInbound(
    payload: Record<string, unknown>,
    schemaCode: string
  ): Promise<ValidationResult>;

  // ============================================================================
  // OUTBOUND ADAPTER
  // ============================================================================
  
  /**
   * Export internal entity to external format
   * Used for: Payment confirmation to ERP, Journal entry to GL
   */
  exportEntity(
    internalId: string,
    targetSystem: string,
    mappingProfile?: string
  ): Promise<OutboundResult>;

  /**
   * Push status update to external system
   */
  pushStatus(
    entityId: string,
    status: string,
    targetSystem: string
  ): Promise<void>;

  // ============================================================================
  // WEBHOOK ADAPTER
  // ============================================================================
  
  /**
   * Register webhook endpoint for event type
   */
  registerWebhook(
    eventType: string,
    targetUrl: string,
    secret: string,
    filters?: WebhookFilter[]
  ): Promise<WebhookRegistration>;

  /**
   * List registered webhooks
   */
  listWebhooks(tenantId: string): Promise<WebhookRegistration[]>;

  /**
   * Unregister webhook
   */
  unregisterWebhook(webhookId: string): Promise<void>;

  // ============================================================================
  // DATA ADAPTER
  // ============================================================================
  
  /**
   * Bulk import from file/stream
   */
  bulkImport(
    source: ReadableStream | Buffer,
    format: 'csv' | 'json' | 'xml' | 'edi',
    mappingProfile: string,
    options?: BulkImportOptions
  ): Promise<BulkImportResult>;

  /**
   * Bulk export to file/stream
   */
  bulkExport(
    filters: ExportFilters,
    format: 'csv' | 'json' | 'xml' | 'edi',
    mappingProfile?: string
  ): Promise<ReadableStream>;
}

// ============================================================================
// TYPES
// ============================================================================

export interface InboundResult {
  success: boolean;
  internalId: string;
  externalId: string;
  mappedFields: string[];
  warnings?: string[];
}

export interface OutboundResult {
  success: boolean;
  externalId?: string;
  payload: Record<string, unknown>;
  sentAt: Date;
}

export interface WebhookRegistration {
  id: string;
  eventType: string;
  targetUrl: string;
  status: 'active' | 'paused' | 'failed';
  createdAt: Date;
  lastTriggeredAt?: Date;
  failureCount: number;
}

export interface WebhookFilter {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'gt' | 'lt';
  value: unknown;
}

export interface BulkImportOptions {
  skipDuplicates?: boolean;
  validateOnly?: boolean;
  batchSize?: number;
  onProgress?: (progress: ImportProgress) => void;
}

export interface BulkImportResult {
  totalRows: number;
  imported: number;
  skipped: number;
  failed: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: Record<string, unknown>;
}
```

---

## 3. Mandatory Events (Webhook Triggers)

### 3.1 Event Naming Convention

```
{domain}.{molecule}.{cell}.{entity}.{action}

Examples:
- finance.ap.payment.created
- finance.ap.payment.approved
- finance.ap.payment.executed
- finance.ap.payment.completed
- finance.ap.payment.failed
- finance.gl.journal.posted
- finance.gl.journal.reversed
```

### 3.2 Standard Event Payload

```typescript
interface WebhookPayload {
  // Identity
  eventId: string;           // UUID, unique per event
  eventType: string;         // e.g., "finance.ap.payment.approved"
  timestamp: string;         // ISO 8601
  
  // Tenant Context
  tenantId: string;
  companyId?: string;
  
  // Entity Reference
  entityId: string;
  entityType: string;        // e.g., "payment"
  entityUrn: string;         // e.g., "urn:finance:payment:uuid"
  
  // Change Summary
  action: string;            // e.g., "approved"
  actor: {
    userId: string;
    email?: string;
    name?: string;
  };
  
  // State Change
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  
  // Correlation
  correlationId: string;
  causationId?: string;      // ID of event that caused this one
  
  // Links (HATEOAS)
  links: {
    self: string;            // API URL to fetch entity
    related?: Record<string, string>;
  };
}
```

### 3.3 Mandatory Events per Cell Type

| Cell Type | Required Events | Optional Events |
|-----------|-----------------|-----------------|
| **Payment** | created, approved, rejected, executed, completed, failed | retried, cancelled |
| **Invoice** | created, approved, rejected, posted, paid | disputed, credited |
| **Journal** | created, posted, reversed | approved, rejected |
| **Vendor** | created, updated, deactivated | reactivated, merged |
| **Customer** | created, updated, deactivated | reactivated, merged |

---

## 4. Standalone Deployment Requirements

### 4.1 Deployment Modes

Every Cell MUST support these deployment modes:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT MODE MATRIX                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  MODE 1: EMBEDDED (Default)                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Full AI-BOS Platform                                       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │
│  │  │ Cell A  │ │ Cell B  │ │ Cell C  │ │ Cell D  │           │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │   │
│  │       └──────────┬┴──────────┬┴──────────┘                 │   │
│  │                  ▼                                          │   │
│  │           Shared Kernel (Auth, Audit, Time)                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  MODE 2: STANDALONE (Integration)                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  External ERP (SAP, Oracle, NetSuite)                       │   │
│  │       │                                                     │   │
│  │       ▼ (REST API / Webhook)                                │   │
│  │  ┌─────────────────────────┐                                │   │
│  │  │   Payment Cell (AP-05)  │  ← Standalone Docker Container │   │
│  │  │   + Embedded Mini-Kernel│                                │   │
│  │  └─────────────────────────┘                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  MODE 3: HYBRID (Strangler Fig)                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Legacy ERP                    AI-BOS Cells                 │   │
│  │  ┌──────────┐                  ┌──────────┐                 │   │
│  │  │ Invoices │ ──────────────▶ │ Payments │                 │   │
│  │  │ (Legacy) │   CSV/API        │ (AP-05)  │                 │   │
│  │  └──────────┘                  └────┬─────┘                 │   │
│  │                                     │                       │   │
│  │  ┌──────────┐                       ▼ Webhook               │   │
│  │  │    GL    │ ◀──────────────── "payment.completed"        │   │
│  │  │ (Legacy) │                                               │   │
│  │  └──────────┘                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Standalone Docker Compose

Every Cell MUST provide a standalone Docker Compose file:

**File:** `docker-compose.standalone.yml`

```yaml
# CONT_08: Standalone Deployment Template
# Every Cell MUST provide this file

version: '3.8'

services:
  # Cell Application
  payment-cell:
    image: aibos/payment-cell:latest
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/payments
      - KERNEL_MODE=embedded  # Uses mini-kernel
      - WEBHOOK_SECRET=${WEBHOOK_SECRET}
      - EXTERNAL_AUTH_URL=${EXTERNAL_AUTH_URL:-}
    ports:
      - "3001:3000"
    depends_on:
      - db
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Cell Database (isolated)
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=payments
    volumes:
      - cell_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    ports:
      - "5433:5432"

volumes:
  cell_data:
```

### 4.3 Mini-Kernel for Standalone Mode

When deployed standalone, Cells use a **Mini-Kernel** that provides:

| Service | Embedded Behavior | External Integration |
|---------|-------------------|---------------------|
| **Auth** | Accept JWT from external IdP | `EXTERNAL_AUTH_URL` |
| **Audit** | Write to local `cell.audit_events` | Optional forward to central |
| **Time** | Use system clock, default period "OPEN" | API to query external calendar |
| **Policy** | Default policies, skip SoD if single user | API to query external RBAC |

---

## 5. Mapping Profiles

### 5.1 Purpose

Mapping Profiles define how external fields map to internal fields. This enables:
- Different ERPs have different field names
- Currency code formats vary (USD vs 840)
- Date formats vary (ISO vs locale)

### 5.2 Mapping Profile Schema

**File:** `packages/kernel-core/src/types/mappingProfile.ts`

```typescript
export interface MappingProfile {
  id: string;
  name: string;
  sourceSystem: string;      // e.g., "SAP", "NetSuite", "QuickBooks"
  targetEntity: string;      // e.g., "payment", "invoice", "vendor"
  version: string;
  
  // Field mappings
  fieldMappings: FieldMapping[];
  
  // Value transformations
  transformations?: Transformation[];
  
  // Validation rules
  validations?: ValidationRule[];
  
  // Default values for missing fields
  defaults?: Record<string, unknown>;
}

export interface FieldMapping {
  sourceField: string;       // e.g., "BELNR" (SAP document number)
  targetField: string;       // e.g., "sourceDocumentId"
  required: boolean;
  transform?: string;        // e.g., "uppercase", "trim", "parseDate"
}

export interface Transformation {
  field: string;
  type: 'lookup' | 'format' | 'calculate' | 'map';
  config: Record<string, unknown>;
}
```

### 5.3 Example: SAP Payment Import Profile

```json
{
  "id": "sap-payment-v1",
  "name": "SAP Payment Import",
  "sourceSystem": "SAP",
  "targetEntity": "payment",
  "version": "1.0.0",
  "fieldMappings": [
    { "sourceField": "BELNR", "targetField": "sourceDocumentId", "required": true },
    { "sourceField": "LIFNR", "targetField": "vendorId", "required": true },
    { "sourceField": "NAME1", "targetField": "vendorName", "required": true },
    { "sourceField": "WRBTR", "targetField": "amount", "required": true },
    { "sourceField": "WAERS", "targetField": "currency", "required": true, "transform": "currencyCode" },
    { "sourceField": "ZFBDT", "targetField": "paymentDate", "required": true, "transform": "parseDate:YYYYMMDD" }
  ],
  "transformations": [
    {
      "field": "currency",
      "type": "lookup",
      "config": {
        "table": "iso_currency_map",
        "sourceKey": "sap_code",
        "targetKey": "iso_code"
      }
    }
  ],
  "defaults": {
    "sourceDocumentType": "invoice"
  }
}
```

---

## 6. API Contract for Integration

### 6.1 Required Endpoints

Every Cell MUST expose these REST endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/{entity}` | GET | List entities with filters |
| `/api/v1/{entity}` | POST | Create entity |
| `/api/v1/{entity}/{id}` | GET | Get entity by ID |
| `/api/v1/{entity}/{id}` | PATCH | Update entity (if mutable) |
| `/api/v1/{entity}/{id}/status` | GET | Get status history |
| `/api/v1/import/{entity}` | POST | Bulk import |
| `/api/v1/export/{entity}` | GET | Bulk export |
| `/api/v1/webhooks` | GET/POST/DELETE | Webhook management |
| `/health` | GET | Health check |
| `/ready` | GET | Readiness check |

### 6.2 Standard Query Parameters

```
GET /api/v1/payments?
  tenant_id=uuid          # Required for multi-tenant
  &status=pending_approval
  &created_after=2024-01-01
  &created_before=2024-12-31
  &vendor_id=uuid
  &amount_min=1000
  &amount_max=10000
  &sort=created_at:desc
  &page=1
  &limit=50
```

### 6.3 Standard Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  links?: {
    self: string;
    next?: string;
    prev?: string;
  };
  errors?: ApiError[];
}

interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}
```

---

## 7. Compliance Matrix

### 7.1 Cell Integration Checklist

Every Cell MUST pass this checklist before release:

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 1 | Implements `IntegrationPort` interface | Code review | ☐ |
| 2 | Exposes all required REST endpoints | OpenAPI spec | ☐ |
| 3 | Publishes mandatory events to outbox | Integration test | ☐ |
| 4 | Supports webhook registration | API test | ☐ |
| 5 | Provides bulk import/export | E2E test | ☐ |
| 6 | Ships with `docker-compose.standalone.yml` | File exists | ☐ |
| 7 | Runs standalone without full Kernel | Docker test | ☐ |
| 8 | Includes at least one mapping profile | JSON file | ☐ |
| 9 | Documents external system integration | README | ☐ |
| 10 | Passes security audit (no secrets in code) | SAST scan | ☐ |

### 7.2 Governance Enforcement

```typescript
// Build-time validation (CI/CD)
const validateCellIntegration = async (cellPath: string) => {
  const checks = [
    checkIntegrationPortImplementation(cellPath),
    checkOpenApiSpec(cellPath),
    checkEventOutbox(cellPath),
    checkWebhookSupport(cellPath),
    checkBulkOperations(cellPath),
    checkStandaloneDockerCompose(cellPath),
    checkMappingProfiles(cellPath),
    checkIntegrationReadme(cellPath),
  ];
  
  const results = await Promise.all(checks);
  
  if (results.some(r => !r.passed)) {
    throw new Error('CONT_08 Violation: Cell does not meet integration requirements');
  }
};
```

---

## 8. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024-12-16 | AI-BOS Architecture | Initial release |

---

## 9. Related Contracts

- **CONT_01** — Canon Identity (Cell naming conventions)
- **CONT_04** — Payment Hub Architecture (AP-05 specific)
- **CONT_07** — Finance Canon Architecture (Domain model)

---

**This contract is IMMUTABLE after ratification. Changes require a new version.**
