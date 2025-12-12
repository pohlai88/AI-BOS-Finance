# 📋 PRD: KERNEL_01 AIBOS Kernel ("The Brain")

**Version:** 1.1 (Enriched with AI Constitution & Silent Killer Frontend)  
**Last Updated:** 2025-12-12  
**Status:** ✅ **READY FOR BUILD**  
**Document ID:** `DOC_KERNEL_01`  
**Code Reference:** `apps/kernel`  
**Constitution Reference:** AI-BOS AI & Data Constitution v1.1

---

## 📑 Document Registry

| ID | Type | Name | Status |
|----|------|------|--------|
| `DOC_KERNEL_01` | PRD | AIBOS Kernel (The Brain) | ✅ Active |
| `SCH_KERNEL_01` | Schema | Kernel API Contract Schema | ⏳ Pending |
| `SCH_KERNEL_02` | Schema | Metadata Registry Schema | ⏳ Pending |
| `SCH_KERNEL_03` | Schema | Lineage Graph Schema | ⏳ Pending |
| `SCH_KERNEL_04` | Schema | Policy Check Schema | ⏳ Pending |
| `ADR_006` | ADR | Kernel Architecture Decision | ⏳ Pending |
| `POLY_KERNEL_01` | Policy | Kernel Access Control Policy | ⏳ Pending |

---

## 1. 🎯 Executive Summary

### 1.1 Vision

The **AIBOS Kernel** is the **Active Neural Center** of the AIBOS ecosystem. It is not a passive library; it is a continuously running service (API/Worker) that serves as the single source of truth for all "Cells" (Apps/Modules).

> **"The Kernel is the Constitution's Enforcer. Logic (Canon) is decoupled from Execution (Cells) by enforcing Schemas (Law) defined in the Global Metadata Registry."**

### 1.2 Core Philosophy

- **Monorepo ≠ Monolith:** The Kernel lives in `apps/kernel` (the factory), but deploys as a standalone service (the product).
- **Schema-First:** All data structures are defined by Zod schemas before implementation (see `META_01`).
- **Single Source of Truth:** The Global Metadata Registry is the authoritative source for all field definitions.
- **Governance by Default:** Every transaction request must pass through the Kernel's Policy Check.

### 1.3 Target Audience

| Persona | Primary Use | Access Pattern |
|---------|-------------|----------------|
| **Frontend (Skin)** | Render "Silent Killer" UI, fetch metadata context | REST API calls |
| **Cells (Workers)** | Receive validated events, execute business logic | Event Bus subscription |
| **AI Orchestras** | Query metadata, check permissions, register lineage | RPC calls + MCP tools |
| **Audit Systems** | Track lineage, verify compliance | Read-only API access |

---

## 2. 🧠 Core Responsibilities: The Four Lobes

The Kernel has four distinct "Lobes" (Functional Areas) based on biological architecture:

### 2.1 The Hippocampus (Memory & Truth)

**Purpose:** Stores and serves the definitions of every field, entity, and concept.

#### Responsibilities:
- **Global Metadata Registry:** Wraps `mdm_global_metadata` and `mdm_entity_catalog` tables
- **Field Definitions:** Answers "What is `invoice_id`?" with complete semantic context
- **Entity Catalog:** Maintains authoritative list of all business entities
- **Version Control:** Tracks schema evolution and backward compatibility

#### Implementation:
```typescript
// Reference: apps/web/src/types/metadata.ts
interface MetadataRecord {
  dict_id: string;           // e.g., "DS-8821"
  business_term: string;    // e.g., "Purchase Orders"
  technical_name: string;   // e.g., "purchase_orders_main"
  definition_full: string;  // Complete semantic definition
  // ... (see existing MetadataRecord interface)
}
```

#### Key Endpoints (Constitution-Aligned Service Names):
- `GET /metadata/fields/search?q={term}` - Search metadata by business term or technical name
  - *Constitution Service:* `metadata.fields.search(query, filters)`
- `GET /metadata/fields/{dict_id}` - Get complete field definition
  - *Constitution Service:* `metadata.fields.describe(id)`
- `GET /metadata/entities` - List all entities in catalog
- `GET /metadata/entities/{entity_id}/fields` - Get all fields for an entity
- `GET /metadata/mappings/lookup?field={name}` - Lookup canonical mapping for local field
  - *Constitution Service:* `metadata.mappings.lookup(local_field)`
- `POST /metadata/mappings/suggest` - Suggest canonical mappings for local fields
  - *Constitution Service:* `metadata.mappings.suggest(local_fields[])`

---

### 2.2 The Frontal Lobe (Governance & Policy)

**Purpose:** Enforces the "Constitution" and access control policies.

#### Responsibilities:
- **Constitution Enforcer:** Every transaction request must pass through Policy Check
- **Access Control:** Determines if a specific "Cell", "User", or "AI Orchestra" can touch a specific "Data Asset"
- **Autonomy Tiers:** Enforces limits on AI Orchestras based on risk-based autonomy tiers (0-3)
- **Naming Policy:** Validates field names against `mdm_naming_policy` tiers
- **Change Request Management:** Handles change requests for metadata, schema, and policy modifications
- **Control Status:** Tracks compliance controls (MFRS/IFRS, GDPR/PDPA, SOC2, ISO)

#### Implementation:
```typescript
// Policy Check Request (Constitution-Aligned)
interface PolicyCheckRequest {
  actor: {
    type: 'user' | 'cell' | 'orchestra' | 'agent';
    id: string;
    orchestra_name?: string; // e.g., "db-governance-orchestra"
    tier?: number; // Autonomy tier (0-3) - REQUIRED for orchestras
  };
  action: 'read' | 'write' | 'delete' | 'export';
  resource: {
    type: 'field' | 'entity' | 'table' | 'api' | 'screen';
    id: string;
  };
  intent?: string; // Human-readable intent for audit
  context?: Record<string, unknown>;
}

// Autonomy Tier Definitions (from AI Constitution)
/**
 * Tier 0 – Read-Only Analysis
 * - Allowed: analysis, diagnostics, reports
 * - Forbidden: code changes, PRs, DB writes
 * 
 * Tier 1 – Suggest
 * - Allowed: recommendations in comments, markdown, tickets
 * - Forbidden: generating executable artefacts without human review
 * 
 * Tier 2 – Propose
 * - Allowed: generating SQL migrations, PRs, config patches
 * - Forbidden: auto-commit; requires human approval
 * 
 * Tier 3 – Auto-Apply (Guarded)
 * - Allowed: applying pre-approved classes of changes
 * - Always requires logs, diffs, and rollback plans
 */

// Policy Check Response
interface PolicyCheckResponse {
  allowed: boolean;
  reason?: string;
  constraints?: {
    max_rows?: number;
    allowed_columns?: string[];
    time_window?: { start: Date; end: Date };
  };
}
```

#### Key Endpoints (Constitution-Aligned):
- `POST /policy/dataAccess/check` - Check if action is allowed
  - *Constitution Service:* `policy.dataAccess.check(actor, resource, intent)`
- `POST /policy/changeRequest/create` - Create change request for metadata/schema/policy
  - *Constitution Service:* `policy.changeRequest.create(entity, proposed_change)`
- `GET /policy/controlStatus/list?standard={standard}&scope={scope}` - List control status
  - *Constitution Service:* `policy.controlStatus.list(standard, scope)`
- `GET /policy/tiers` - List autonomy tiers and their limits
- `GET /policy/constraints/{actor_id}` - Get all constraints for an actor

---

### 2.3 The Motor Cortex (Dispatch & Event Bus)

**Purpose:** Receives signals from the "Skin" (Frontend) and dispatches orders to "Cells" (Workers).

#### Responsibilities:
- **Event Orchestration:** Validates payload against Schema → Logs Lineage → Pushes to Queue → Triggers Cell
- **Protocol Translation:** Converts generic JSON events into strict, schema-validated commands
- **Event Routing:** Determines which Cells should receive which events
- **Retry Logic:** Handles failed event delivery with exponential backoff

#### Implementation:
```typescript
// Event Emission Request
interface EventEmitRequest {
  event_type: string;        // e.g., "invoice.created"
  source: {
    cell_id: string;
    user_id?: string;
  };
  payload: Record<string, unknown>;
  metadata?: {
    correlation_id?: string;
    trace_id?: string;
  };
}

// Event Emission Response
interface EventEmitResponse {
  event_id: string;
  status: 'accepted' | 'rejected';
  validation_errors?: string[];
  routed_to: string[]; // Cell IDs that will receive this event
}
```

#### Key Endpoints:
- `POST /events/emit` - Emit a new event
- `GET /events/{event_id}` - Get event status and routing
- `GET /events/queue/status` - Get queue health metrics

---

### 2.4 The Thalamus (The API Gateway)

**Purpose:** Provides metadata services and BFF support for the Frontend.

#### Responsibilities:
- **Metadata Services:** Provides endpoints for the Frontend to render the "Silent Killer" UI
- **BFF Support:** Supplies the "Context" (definitions, lineage hints) that the Next.js Frontend displays
- **Lineage Queries:** Answers "If I change this, what breaks?" questions
- **Search & Discovery:** Enables metadata search and field lookup

#### Implementation:
```typescript
// Lineage Impact Query
interface LineageImpactQuery {
  node_id: string;           // Field or entity ID
  direction: 'upstream' | 'downstream' | 'both';
  depth?: number;            // How many hops to traverse
}

// Lineage Impact Response
interface LineageImpactResponse {
  nodes: Array<{
    id: string;
    type: 'field' | 'entity' | 'table' | 'cell';
    name: string;
    impact_level: 'critical' | 'high' | 'medium' | 'low';
  }>;
  edges: Array<{
    from: string;
    to: string;
    relationship: 'depends_on' | 'produces' | 'transforms';
  }>;
}
```

#### Key Endpoints (Constitution-Aligned):
- `GET /lineage/graphForNode?node_id={id}&depth={depth}&direction={direction}` - Get lineage graph
  - *Constitution Service:* `lineage.graphForNode(node_id, depth, direction)`
- `GET /lineage/impactReport?node_id={id}` - Get impact analysis for a node
  - *Constitution Service:* `lineage.impactReport(node_id)`
- `POST /lineage/registerNode` - Register a new lineage node (for ETL jobs, APIs, ERP modules)
  - *Constitution Service:* `lineage.registerNode(node)`
- `POST /lineage/registerEdge` - Register a new lineage edge
  - *Constitution Service:* `lineage.registerEdge(edge)`
- `GET /metadata/context/{entity_id}` - Get full context for rendering UI (Silent Killer Frontend)

---

## 3. 🏗️ Technical Architecture

### 3.1 Deployment Model

| Aspect | Specification |
|--------|---------------|
| **Type** | Standalone API Service (REST + RPC) |
| **Framework** | Hono (recommended for high throughput) or Fastify |
| **Infrastructure** | Docker container, deployable to K8s or serverless |
| **Database** | Direct connection to Postgres Metadata DB (Supabase) |
| **Monorepo Location** | `apps/kernel` |
| **Dependencies** | `packages/schemas` (Shared Types), `packages/shared` (Utils) |

### 3.2 Monorepo Integration

```
nexuscanon-t60/
├── apps/
│   ├── web/              # The Skin (Frontend)
│   └── kernel/           # The Brain (This PRD)
├── packages/
│   ├── schemas/          # Shared API Types (Kernel ↔ Web contract)
│   ├── shared/           # Utilities (both Kernel and Web use)
│   └── canon/            # Governance rules (Kernel enforces)
```

**Key Principle:** The Kernel consumes packages but deploys independently. It's a neighbor in code, but a stranger in deployment.

### 3.3 Database Schema (Reference)

Based on existing metadata patterns (`apps/web/src/types/metadata.ts`):

```sql
-- Global Metadata Registry (mdm_global_metadata)
CREATE TABLE mdm_global_metadata (
  dict_id VARCHAR(50) PRIMARY KEY,        -- e.g., "DS-8821"
  business_term VARCHAR(255) NOT NULL,    -- e.g., "Purchase Orders"
  technical_name VARCHAR(255) NOT NULL,   -- e.g., "purchase_orders_main"
  version VARCHAR(20) NOT NULL,           -- e.g., "2.1.0"
  domain VARCHAR(100),                     -- e.g., "Finance"
  entity_group VARCHAR(100),              -- e.g., "Transactional"
  definition_full TEXT,
  data_type_tech VARCHAR(50),
  -- ... (see MetadataRecord interface for full schema)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Entity Catalog (mdm_entity_catalog)
CREATE TABLE mdm_entity_catalog (
  entity_id VARCHAR(50) PRIMARY KEY,
  entity_name VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50),                -- 'master', 'transactional', 'reference'
  domain VARCHAR(100),
  -- ... (additional fields)
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lineage Nodes (mdm_lineage_nodes)
CREATE TABLE mdm_lineage_nodes (
  node_id VARCHAR(50) PRIMARY KEY,
  node_type VARCHAR(50),                  -- 'field', 'entity', 'table', 'cell'
  node_name VARCHAR(255) NOT NULL,
  metadata JSONB,                          -- Flexible metadata storage
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lineage Edges (mdm_lineage_edges)
CREATE TABLE mdm_lineage_edges (
  edge_id VARCHAR(50) PRIMARY KEY,
  from_node_id VARCHAR(50) REFERENCES mdm_lineage_nodes(node_id),
  to_node_id VARCHAR(50) REFERENCES mdm_lineage_nodes(node_id),
  relationship VARCHAR(50),               -- 'depends_on', 'produces', 'transforms'
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Metadata Mappings (mdm_metadata_mapping)
CREATE TABLE mdm_metadata_mapping (
  mapping_id VARCHAR(50) PRIMARY KEY,
  local_system VARCHAR(100) NOT NULL,      -- e.g., "SAP_ERP_PROD"
  local_entity VARCHAR(255) NOT NULL,    -- e.g., "purchase_orders"
  local_field VARCHAR(255) NOT NULL,      -- e.g., "po_id"
  canonical_metadata_id VARCHAR(50) REFERENCES mdm_global_metadata(dict_id),
  mapping_source VARCHAR(50),             -- 'manual' | 'ai-suggested'
  approval_status VARCHAR(50),            -- 'pending' | 'approved' | 'rejected'
  confidence_score DECIMAL(3,2),          -- 0.00-1.00
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Naming Policy (mdm_naming_policy)
CREATE TABLE mdm_naming_policy (
  policy_id VARCHAR(50) PRIMARY KEY,
  tier INTEGER NOT NULL,                  -- 0-3 (autonomy tier)
  allowed_actions TEXT[],                 -- ['read', 'write', 'delete']
  constraints JSONB,                      -- Flexible constraint definitions
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 4. 🔌 API Contract (Key Interfaces)

> **Note:** All service names align with the AI-BOS AI & Data Constitution v1.1. The Kernel implements the **mandatory services** that all orchestras must use.

### 4.1 Metadata Domain

| Endpoint | Method | Constitution Service | Purpose | Example |
|----------|--------|---------------------|---------|---------|
| `/metadata/fields/search` | GET | `metadata.fields.search(query, filters)` | Search metadata by term | `?q=purchase+order&domain=Finance` |
| `/metadata/fields/{dict_id}` | GET | `metadata.fields.describe(id)` | Get complete field definition | `/metadata/fields/DS-8821` |
| `/metadata/entities` | GET | - | List all entities | `?domain=Finance&type=table` |
| `/metadata/entities/{id}/fields` | GET | - | Get fields for entity | `/metadata/entities/ORG_001/fields` |
| `/metadata/mappings/lookup` | GET | `metadata.mappings.lookup(local_field)` | Lookup field mappings | `?field=invoice_id&system=SAP_ERP` |
| `/metadata/mappings/suggest` | POST | `metadata.mappings.suggest(local_fields[])` | Suggest canonical mappings | Body: `{fields: ["po_id", "inv_num"]}` |
| `/metadata/context/field/{dict_id}` | GET | - | Get field context (Silent Killer) | `/metadata/context/field/DS-8821` |
| `/metadata/context/entity/{entity_id}` | GET | - | Get entity context (Silent Killer) | `/metadata/context/entity/ORG_001` |

### 4.2 Lineage Domain

| Endpoint | Method | Constitution Service | Purpose | Example |
|----------|--------|---------------------|---------|---------|
| `/lineage/graphForNode` | GET | `lineage.graphForNode(node_id, depth, direction)` | Get lineage graph | `?node_id=DS-8821&depth=3&direction=downstream` |
| `/lineage/impactReport` | GET | `lineage.impactReport(node_id)` | Get impact analysis | `?node_id=DS-8821` |
| `/lineage/registerNode` | POST | `lineage.registerNode(node)` | Register lineage node | Body: `{node_id, type, name, ...}` |
| `/lineage/registerEdge` | POST | `lineage.registerEdge(edge)` | Register lineage edge | Body: `{from_node_id, to_node_id, relationship, ...}` |

### 4.3 Policy Domain

| Endpoint | Method | Constitution Service | Purpose | Example |
|----------|--------|---------------------|---------|---------|
| `/policy/dataAccess/check` | POST | `policy.dataAccess.check(actor, resource, intent)` | Check if action allowed | Body: `PolicyCheckRequest` |
| `/policy/changeRequest/create` | POST | `policy.changeRequest.create(entity, proposed_change)` | Create change request | Body: `{entity_id, change_type, proposed_change, ...}` |
| `/policy/controlStatus/list` | GET | `policy.controlStatus.list(standard, scope)` | List control status | `?standard=MFRS&scope=Finance` |
| `/policy/tiers` | GET | - | List autonomy tiers and limits | - |
| `/policy/constraints/{actor_id}` | GET | - | Get constraints for actor | `/policy/constraints/orchestra_db_governance` |
| `/orchestras/validate` | POST | - | Validate orchestra manifest | Body: `{manifest: {...}}` |

### 4.4 Events Domain

| Endpoint | Method | Purpose | Example |
|----------|--------|---------|---------|
| `/events/emit` | POST | Emit new event | Body: `EventEmitRequest` |
| `/events/{event_id}` | GET | Get event status | `/events/evt_abc123` |
| `/events/queue/status` | GET | Get queue health | - |

---

## 5. 🚀 Implementation Phase 1: "The Skeleton"

### 5.1 Initial Structure

```
apps/kernel/
├── src/
│   ├── server.ts              # Hono/Fastify server setup
│   ├── routes/
│   │   ├── metadata.ts        # Hippocampus endpoints
│   │   ├── lineage.ts         # Lineage queries
│   │   ├── policy.ts          # Frontal Lobe endpoints
│   │   └── events.ts          # Motor Cortex endpoints
│   ├── services/
│   │   ├── MetadataService.ts # Wraps mdm_global_metadata
│   │   ├── LineageService.ts  # Manages lineage graph
│   │   ├── PolicyService.ts   # Enforces policies
│   │   └── EventService.ts    # Event orchestration
│   ├── db/
│   │   ├── drizzle.ts         # Drizzle ORM setup
│   │   └── schema.ts          # Database schema definitions
│   └── types/
│       └── api.ts             # API request/response types
├── package.json
├── tsconfig.json
└── README.md
```

### 5.2 Phase 1 Deliverables

1. **✅ Server Setup:** Fast API framework (Hono recommended)
2. **✅ Schema Connection:** Drizzle ORM integration with `mdm_*` tables
3. **✅ The "Truth" Endpoint:** `GET /metadata/fields/{dict_id}` - First working endpoint
4. **✅ Health Check:** `GET /health` - Basic service health endpoint

### 5.3 Success Criteria

- [ ] Kernel service starts and responds to health checks
- [ ] Can query metadata from `mdm_global_metadata` table
- [ ] Frontend can call `GET /metadata/fields/{dict_id}` and receive data
- [ ] All API contracts defined in `packages/schemas`

---

## 6. 🔗 Integration Points

### 6.1 Silent Killer Frontend Integration (`apps/web`)

The **Silent Killer Frontend** is the blue ocean UX strategy that embeds governance, metadata, and AI assistance directly into ERP screens without context switching.

#### Kernel Support Requirements:

The Kernel must provide **ultra-fast, contextual metadata** for the Silent Killer pattern:

1. **Single-Page Contextual Workbench Support:**
   - **Grid + Sidebar Pattern:** Kernel provides sidebar context (definitions, owners, lineage, AI hints) without navigation
   - **Micro-Actions:** Kernel supports inline metadata edits via lightweight API calls
   - **Context Switching Elimination:** All metadata queries return in < 50ms to avoid UI lag

2. **Key Kernel Endpoints for Silent Killer:**
   ```typescript
   // Get complete context for a field (sidebar rendering)
   GET /metadata/context/field/{dict_id}
   // Returns: definition, owner, sensitivity, lineage summary, AI suggestions
   
   // Get context for an entity (screen-level metadata)
   GET /metadata/context/entity/{entity_id}
   // Returns: all fields, mappings, quality signals, compliance status
   
   // Quick lookup for tooltips (inline definitions)
   GET /metadata/fields/quick?term={term}
   // Returns: short definition, sensitivity badge, owner name
   ```

3. **Quiet AI Integration:**
   - Kernel provides **Tier 0-1 AI suggestions** (read-only analysis, recommendations)
   - Suggestions appear as badges, hints, and micro-actions in the UI
   - No chat interface required - AI works through structured API responses

4. **State & Meaning as First-Class:**
   - Kernel returns visual state indicators:
     - Draft vs approved metadata
     - Certified vs experimental datasets
     - Strong vs weak lineage
     - Policy risk levels
   - Frontend renders these as badges, pills, and color coding

**Reference:** See `GRCD-METADATA-FRONTEND.md` for full Silent Killer strategy.

### 6.2 AI Orchestras Integration

The Kernel is the **mandatory dependency** for all AI Orchestras (DB, UX, API, Infra, Compliance, Business, DevEx).

#### Orchestra Requirements:

1. **Mandatory Metadata OS Usage:**
   - All orchestras MUST use Kernel services instead of direct database access
   - No orchestra may introduce new entities/fields without registering with Kernel
   - All orchestras must respect autonomy tiers enforced by Kernel

2. **Orchestra Manifest Validation:**
   ```typescript
   // Kernel validates orchestra manifests
   POST /orchestras/validate
   // Validates: tools, permissions, autonomy tiers, metadata dependencies
   ```

3. **Autonomy Tier Enforcement:**
   - Kernel enforces tier limits per orchestra:
     - **Tier 0:** Read-only (analysis, reports)
     - **Tier 1:** Suggest (recommendations only)
     - **Tier 2:** Propose (generate PRs, requires approval)
     - **Tier 3:** Auto-Apply (guarded, low-risk changes only)

4. **Orchestra-Specific Services:**
   ```typescript
   // DB Orchestra uses:
   - metadata.fields.search (validate schema naming)
   - lineage.impactReport (assess migration impact)
   - policy.dataAccess.check (verify permissions)
   
   // UX Orchestra uses:
   - metadata.fields.describe (get field labels, tooltips)
   - metadata.context/entity (get UI rendering context)
   
   // Compliance Orchestra uses:
   - policy.controlStatus.list (MFRS/IFRS, GDPR/PDPA, SOC2, ISO)
   - lineage.graphForNode (build evidence packs)
   ```

**Reference:** See `GRCD-METADATA-REPO-V1.0.md` and `GRCD-METADATA-V1.1.md` for full AI Constitution.

### 6.3 Frontend Integration (`apps/web`)

The Frontend (Skin) will call the Kernel for:

- **META_02 (God View):** Search and display metadata
- **META_03 (The Prism):** Fetch lineage graphs
- **Silent Killer UI:** Show field definitions in sidebar
- **BFF Context:** Get metadata context for rendering

**Example Integration:**
```typescript
// apps/web/src/lib/kernel-client.ts
export async function getFieldDefinition(dictId: string) {
  const response = await fetch(`${KERNEL_URL}/metadata/fields/${dictId}`);
  return response.json();
}
```

### 6.4 Cell Integration (Future Workers)

Cells will:
- Subscribe to event bus for relevant events
- Call policy check before performing actions
- Query metadata for field definitions
- Report lineage changes back to Kernel

### 6.5 Schema Package (`packages/schemas`)

Shared types between Kernel and Web:
```typescript
// packages/schemas/src/kernel-api.ts
export interface MetadataFieldResponse {
  dict_id: string;
  business_term: string;
  technical_name: string;
  definition_full: string;
  // ... (full MetadataRecord)
}

export interface PolicyCheckRequest { /* ... */ }
export interface PolicyCheckResponse { /* ... */ }
export interface EventEmitRequest { /* ... */ }
export interface EventEmitResponse { /* ... */ }
```

---

## 7. 📊 Validation Against Existing Architecture

### 7.1 Metadata Patterns ✅

**Validated:** The PRD aligns with existing metadata structures:
- `apps/web/src/types/metadata.ts` defines `MetadataRecord` interface
- `apps/web/src/data/mockMetadata.ts` provides sample data structure
- `apps/web/src/views/META_02_MetadataGodView.tsx` uses metadata for UI rendering

**Action:** Kernel will serve the same `MetadataRecord` structure, but from database instead of mock data.

### 7.2 Canon Governance ✅

**Validated:** The PRD respects Canon Identity rules:
- Kernel is a **Cell** (executable unit) with ID `KERNEL_01`
- Uses **Schemas** from `packages/schemas` (Plane C)
- Enforces **Policies** from `packages/canon` (Plane A)
- Follows **ADR_005** (Turborepo monorepo structure)

**Action:** Register Kernel in `packages/canon/B-Functional/B-CELL/registry.yaml`

### 7.3 Database Schema ✅

**Validated:** The PRD references existing database patterns:
- `db/schema.cds` shows SAP CDS entity structure
- Existing metadata types suggest Postgres table structure
- Lineage concepts exist in `META_03_ThePrismPage.tsx`

**Action:** Create Drizzle schema definitions matching the `mdm_*` table structure.

---

## 8. 🎯 Success Metrics

### 8.1 Phase 1 Metrics

- **Latency:** `GET /metadata/fields/{id}` responds in < 50ms (p95)
- **Availability:** Service uptime > 99.9%
- **Accuracy:** Metadata responses match database 100%

### 8.2 Future Metrics

- **Event Throughput:** Process 10,000 events/second
- **Policy Check Latency:** < 10ms (p95)
- **Lineage Query Performance:** < 100ms for 3-hop queries

---

## 9. 📚 References

### 9.1 Related Documents

#### Canon Governance:
- **CONT_01_CanonIdentity.md:** Governance rules the Kernel enforces
- **ADR_005_SwitchToTurborepo.md:** Monorepo structure decision
- **PRD_PAY_01_PAYMENT_HUB.md:** Example PRD structure

#### Frontend & UX:
- **GRCD-METADATA-FRONTEND.md:** Silent Killer Frontend strategy (blue ocean UX)
- **META_01 (Architecture):** Schema-first design principles
- **META_02 (God View):** Frontend that consumes Kernel metadata
- **META_03 (The Prism):** Frontend that consumes Kernel lineage

#### AI Constitution:
- **GRCD-METADATA-V1.1.md:** AI-BOS AI & Data Constitution (SSOT)
- **GRCD-METADATA-REPO-V1.0.md:** Repo-level README patterns
- **C-POLY/MCP_ORCHESTRATION_METHOD.md:** Orchestra orchestration patterns

### 9.2 Technical References

- **Hono Framework:** https://hono.dev (recommended for Kernel)
- **Drizzle ORM:** https://orm.drizzle.team (database access)
- **Zod:** https://zod.dev (schema validation, already in use)

---

## 10. 🚦 Next Steps

### Immediate (Week 1):
1. Create `apps/kernel` directory structure
2. Set up Hono server with health check endpoint
3. Create `packages/schemas` with Kernel API types
4. Implement `GET /metadata/fields/{dict_id}` endpoint

### Short-term (Weeks 2-4):
1. Complete all Metadata domain endpoints
2. Implement Policy Check endpoint
3. Add Lineage query endpoints
4. Frontend integration (META_02 calls Kernel)

### Medium-term (Months 2-3):
1. Event Bus implementation
2. Cell integration
3. Full lineage graph support
4. Performance optimization

---

## 11. ✅ Validation Checklist

- [x] PRD structure follows existing PRD template
- [x] Technical architecture validated against monorepo structure
- [x] Database schema aligns with existing metadata patterns
- [x] API contracts defined and ready for `packages/schemas`
- [x] Integration points identified (Frontend, Cells, Schema package)
- [x] Success criteria defined for Phase 1
- [x] References to existing Canon documents included
- [x] Deployment model clarified (Monorepo ≠ Monolith)
- [x] **Silent Killer Frontend support documented**
- [x] **AI Orchestras integration patterns defined**
- [x] **Constitution-aligned service names implemented**
- [x] **Autonomy tier definitions added (0-3)**
- [x] **Change Request service added**
- [x] **Control Status service added**
- [x] **Metadata mapping suggest service added**
- [x] **Orchestra manifest validation added**

---

**Status:** ✅ **READY FOR IMPLEMENTATION**

**Next Action:** Create `apps/kernel` directory and initialize Hono server.

---

*This PRD is part of the Canon Governance System. See `CONT_01_CanonIdentity.md` for governance rules.*
