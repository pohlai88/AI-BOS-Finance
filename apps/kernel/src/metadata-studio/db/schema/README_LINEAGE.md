# Lineage Graph Schema

## Overview

The lineage layer provides graph-based tracking of data flow and dependencies between metadata assets. It replaces the legacy `mdm_lineage_field` table with a more flexible, graph-oriented design.

## Schema Design

### `mdm_lineage_node`

Represents nodes in the lineage graph (assets like fields, entities, KPIs, reports, transformations, sources).

```typescript
{
  id: UUID              // Primary key
  tenantId: UUID        // Multi-tenant isolation
  urn: string           // Unique Resource Name (e.g., "urn:metadata:field:finance.revenue")
  nodeType: string      // Node type: field, entity, kpi, report, transformation, source
  entityId: UUID?       // Reference to actual entity (field, entity, KPI, etc.)
  entityType: string?   // Type of referenced entity (e.g., "mdm_global_metadata")
  label: string?        // Display name
  description: text?    // Human-readable description
  metadata: JSONB       // Flexible metadata (layer, domain, etc.)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Indexes:**
- `idx_lineage_node_tenant` - on `tenant_id`
- `idx_lineage_node_urn` - on `urn` (for lookups)
- `idx_lineage_node_type` - on `node_type` (for filtering)
- `idx_lineage_node_entity` - on `(entity_id, entity_type)` (for joins)

### `mdm_lineage_edge`

Represents directed edges connecting nodes (relationships like "produces", "consumes", "derived_from").

```typescript
{
  id: UUID              // Primary key
  tenantId: UUID        // Multi-tenant isolation
  sourceUrn: string     // Source node URN
  targetUrn: string     // Target node URN
  edgeType: string      // Relationship type: produces, consumes, derived_from, transforms, references
  transformation: text? // Optional transformation logic (SQL, expression, etc.)
  metadata: JSONB       // Flexible metadata
  createdAt: timestamp
}
```

**Indexes:**
- `idx_lineage_edge_tenant` - on `tenant_id`
- `idx_lineage_edge_source` - on `source_urn` (for downstream traversal)
- `idx_lineage_edge_target` - on `target_urn` (for upstream traversal)
- `idx_lineage_edge_type` - on `edge_type` (for filtering)

## URN Format

URNs uniquely identify nodes across the system:

```
urn:metadata:field:<canonical_key>
urn:metadata:entity:<entity_urn>
urn:metadata:kpi:<kpi_key>
urn:system:<system_name>
```

## Edge Types

- **`produces`** - Source system/transformation outputs data to target
- **`consumes`** - Target consumes data from source
- **`derived_from`** - Target is derived/calculated from source
- **`transforms`** - Source transforms into target
- **`references`** - Target references source (lookup, FK, etc.)

## Node Types

- **`field`** - Individual data field (column)
- **`entity`** - Entity/table/dataset
- **`kpi`** - Key Performance Indicator
- **`report`** - Report/dashboard
- **`transformation`** - ETL job, SQL view, data pipeline
- **`source`** - External source system (SAP, Salesforce, etc.)

## API Endpoints

### GET `/api/meta/lineage`

List all lineage nodes with optional filters.

**Query Params:**
- `type` - Filter by node type
- `layer` - Filter by metadata layer (source, raw, curated, presentation)
- `q` - Search query
- `limit` - Max results (default: 100)
- `offset` - Pagination offset

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "urn": "urn:metadata:field:finance.revenue",
      "nodeType": "field",
      "label": "Revenue",
      "metadata": { "layer": "curated" }
    }
  ],
  "meta": {
    "total": 100,
    "limit": 100,
    "offset": 0
  }
}
```

### GET `/api/meta/lineage/graph/:urn`

Get the lineage graph for a specific node (upstream and/or downstream dependencies).

**Query Params:**
- `direction` - `upstream`, `downstream`, or `both` (default: `both`)
- `depth` - Max hops to traverse (default: 2, max: 5)

**Response:**
```json
{
  "nodes": [...],
  "edges": [...],
  "meta": {
    "centerUrn": "urn:metadata:field:finance.revenue",
    "direction": "both",
    "depth": 2,
    "nodeCount": 15,
    "edgeCount": 20
  }
}
```

### POST `/api/meta/lineage/impact`

Perform impact analysis for a proposed change.

**Request Body:**
```json
{
  "urn": "urn:metadata:field:finance.revenue",
  "changeType": "field_delete" | "schema_change" | "data_type_change",
  "description": "Optional description"
}
```

**Response:**
```json
{
  "sourceChange": { ... },
  "totalAffected": 12,
  "criticalImpacts": [ ... ],    // Assets that will break
  "warnings": [ ... ],           // Assets that may degrade
  "safeChanges": [ ... ],        // Assets unaffected
  "riskScore": 45,               // 0-100
  "recommendation": "review",    // proceed | review | block
  "blastRadius": {
    "direct": 5,
    "indirect": 7,
    "maxDepth": 3
  }
}
```

### POST `/api/meta/lineage/nodes`

Create a new lineage node.

**Request Body:**
```json
{
  "urn": "urn:metadata:field:finance.new_field",
  "nodeType": "field",
  "entityId": "uuid-of-field",
  "entityType": "mdm_global_metadata",
  "label": "New Field",
  "description": "Description",
  "metadata": { "layer": "curated" }
}
```

### POST `/api/meta/lineage/edges`

Create a new lineage edge.

**Request Body:**
```json
{
  "sourceUrn": "urn:metadata:field:source_field",
  "targetUrn": "urn:metadata:field:target_field",
  "edgeType": "derived_from",
  "transformation": "SELECT source_field * 1.1 AS target_field",
  "metadata": {}
}
```

## Database Migration

Run the migration to create the lineage tables:

```bash
cd apps/kernel/src/metadata-studio
pnpm db:migrate
```

This will execute migration `0006_lineage_graph_tables.sql` which:
1. Drops the old `mdm_lineage_field` table
2. Creates `mdm_lineage_node` and `mdm_lineage_edge` tables
3. Creates necessary indexes

## Seeding Sample Data

Seed realistic lineage data (Source → Raw → Curated → Presentation flow):

```bash
cd apps/kernel/src/metadata-studio
pnpm db:seed:lineage
```

This creates:
- ~50+ lineage nodes (fields, systems, reports)
- ~100+ edges representing data flow
- Sample KPIs with component dependencies

## Usage Examples

### Example 1: Track Field Lineage

```typescript
// Create node for a source field
await metadataStudio.createLineageNode({
  urn: "urn:metadata:field:sap.BKPF.BUDAT",
  nodeType: "field",
  entityId: fieldId,
  label: "Posting Date",
  metadata: { layer: "source", system: "SAP ECC" }
});

// Create edge showing transformation
await metadataStudio.createLineageEdge({
  sourceUrn: "urn:metadata:field:sap.BKPF.BUDAT",
  targetUrn: "urn:metadata:field:finance.posting_date",
  edgeType: "transforms",
  transformation: "CAST(BUDAT AS DATE)"
});
```

### Example 2: Get Upstream Dependencies

```typescript
const graph = await metadataStudio.getLineageGraph(
  "urn:metadata:field:finance.revenue",
  { direction: "upstream", depth: 3 }
);

// Returns all fields/systems that feed into revenue
console.log(`Found ${graph.nodes.length} upstream dependencies`);
```

### Example 3: Impact Analysis Before Deletion

```typescript
const impact = await metadataStudio.analyzeImpact({
  urn: "urn:metadata:field:finance.cost_center",
  changeType: "field_delete",
  description: "Removing cost_center field"
});

if (impact.recommendation === "block") {
  console.error(`⚠️ Cannot delete! ${impact.criticalImpacts.length} assets will break`);
}
```

## Integration with Frontend (BFF)

The Next.js BFF proxies these endpoints:

```typescript
// In a Server Component or Route Handler
import { metadataStudio } from '@/lib/backend.server';

export async function GET() {
  const graph = await metadataStudio.getLineageGraph(
    "urn:metadata:field:finance.revenue"
  );
  
  return NextResponse.json(graph);
}
```

## Performance Considerations

1. **Graph Traversal** - Max depth is capped at 5 hops to prevent runaway queries
2. **Indexes** - All URN lookups are indexed for fast traversal
3. **Caching** - BFF layer caches lineage graphs for 60 seconds
4. **Batch Operations** - Use bulk inserts for creating multiple nodes/edges

## Future Enhancements

- [ ] Column-level lineage with SQL parsing
- [ ] ML-based lineage inference from query logs
- [ ] Visual lineage canvas UI component
- [ ] Automated impact analysis in CI/CD pipelines
- [ ] Lineage versioning and time-travel queries
