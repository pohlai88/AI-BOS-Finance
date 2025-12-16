# 🎯 Lineage Layer Setup - Complete

## ✅ What's Been Completed

### 1. **Database Schema (Drizzle)**
- ✅ `mdm_lineage_node` table - Graph nodes for fields, entities, KPIs, reports, etc.
- ✅ `mdm_lineage_edge` table - Graph edges for relationships (produces, consumes, transforms)
- ✅ `mdm_composite_kpi` table - Numerator/denominator KPI definitions
- ✅ All indexes and constraints created
- ✅ Migrations generated:
  - `0006_lineage_graph_tables.sql`
  - `0007_composite_kpi_table.sql`

### 2. **Type Safety (Zod + TypeScript)**
- ✅ Zod schemas in `@ai-bos/shared/metadata-extended`:
  - `ZLineageNode`, `ZLineageEdge`, `ZLineageGraph`
  - `ZCompositeKPI`, `ZKPIComponent`
  - `ZImpactReport`, `ZAffectedAsset`
  - `ZSearchFilters`, `ZSearchResultItem`
- ✅ Drizzle type exports in `lineage.tables.ts` and `kpi.tables.ts`

### 3. **Backend API (Hono)**
File: `apps/kernel/src/metadata-studio/api/meta-lineage.routes.ts`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/meta/lineage` | GET | List all lineage nodes |
| `/api/meta/lineage/graph/:urn` | GET | Get lineage graph (upstream/downstream) |
| `/api/meta/lineage/impact` | POST | Impact analysis for proposed changes |
| `/api/meta/lineage/nodes` | POST | Create lineage node |
| `/api/meta/lineage/edges` | POST | Create lineage edge |

Features:
- ✅ Multi-hop graph traversal (configurable depth)
- ✅ Direction control (upstream/downstream/both)
- ✅ Impact analysis with risk scoring
- ✅ Blast radius calculation
- ✅ Auth middleware integrated

### 4. **BFF Layer (Next.js)**
Files: `apps/web/app/api/meta/lineage/**`

| Route | Type | Purpose |
|-------|------|---------|
| `/api/meta/lineage/route.ts` | Proxy | List nodes |
| `/api/meta/lineage/graph/[urn]/route.ts` | Proxy | Graph traversal |
| `/api/meta/lineage/impact/route.ts` | Proxy | Impact analysis |

- ✅ All routes include auth middleware (`requireAuth`)
- ✅ Error handling with `BackendError`
- ✅ Backend methods in `backend.server.ts`

### 5. **Frontend Hooks (React + SWR)**
File: `apps/web/lib/hooks/use-metadata.ts`

```typescript
// Available hooks:
useLineageGraph(urn, { direction, depth })  // Fetch & cache graph
useLineageNodes()                            // List all nodes
useImpactAnalysis()                          // Mutation for impact analysis
```

Features:
- ✅ Type-safe with Zod schemas
- ✅ Automatic caching & revalidation
- ✅ Optimistic updates
- ✅ Error handling

### 6. **Data Seeder**
File: `apps/kernel/src/metadata-studio/seed/seed-lineage.ts`

What it creates:
- ~56 lineage nodes (50 from existing fields + 6 external systems)
- ~68 edges (Source → Raw → Curated → Presentation flow)
- 3 composite KPIs (Gross Margin %, Revenue per Employee, Inventory Turnover)

## 🔧 What Needs To Be Done (Setup)

### **Step 1: Environment Configuration**

Create `.env` file in `apps/kernel/src/metadata-studio/`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/aibos_metadata"

# Development overrides (optional)
DEV_TENANT_ID="00000000-0000-0000-0000-000000000001"
DEV_USER_ID="dev-user-id"
DEV_USER_ROLE="metadata_steward"

# GRCD Mode
GRCD_MODE="lite"  # or "governed"

# Server
PORT=8787
```

### **Step 2: Apply Migrations**

```bash
cd apps/kernel/src/metadata-studio

# Apply the migrations
pnpm db:migrate
```

Expected output:
```
✅ Migration 0006_lineage_graph_tables.sql applied
✅ Migration 0007_composite_kpi_table.sql applied
```

### **Step 3: Seed Core Metadata (if not already done)**

```bash
pnpm db:seed
```

### **Step 4: Seed Lineage Graph**

```bash
pnpm db:seed:lineage
```

Expected output:
```
🔗 Seeding Lineage & KPIs...
   Found 50 existing fields
   Creating lineage nodes...
   Created 56 lineage nodes
   Wiring up graph edges...
   Created 68 lineage edges
   Creating composite KPIs...
   Created 3 composite KPIs

✅ Lineage & KPI seeding complete!
   📊 56 nodes
   🔗 68 edges
   📈 3 KPIs

   Data flow: Source → Raw → Curated → Presentation
```

### **Step 5: Test the API**

Start the metadata-studio server:

```bash
cd apps/kernel/src/metadata-studio
pnpm dev
```

Test endpoints:

```bash
# List all nodes
curl http://localhost:8787/api/meta/lineage

# Get lineage graph
curl "http://localhost:8787/api/meta/lineage/graph/urn:metadata:field:finance.revenue?direction=both&depth=2"

# Impact analysis
curl -X POST http://localhost:8787/api/meta/lineage/impact \
  -H "Content-Type: application/json" \
  -d '{
    "urn": "urn:metadata:field:finance.revenue",
    "changeType": "field_delete",
    "description": "Removing revenue field"
  }'
```

## 🎨 Frontend Integration Example

```typescript
import { useLineageGraph, useImpactAnalysis } from '@/lib/hooks/use-metadata';

function LineageCanvas({ fieldUrn }: { fieldUrn: string }) {
  // Fetch graph (cached, auto-revalidates)
  const { data: graph, isLoading, error } = useLineageGraph(fieldUrn, {
    direction: 'both',
    depth: 3
  });

  // Impact analysis mutation
  const { trigger: analyzeImpact, isMutating } = useImpactAnalysis();

  const handleAnalyze = async () => {
    const result = await analyzeImpact({
      urn: fieldUrn,
      changeType: 'field_delete',
      description: 'Testing impact'
    });
    
    console.log('Risk Score:', result.riskScore);
    console.log('Recommendation:', result.recommendation); // 'proceed' | 'review' | 'block'
  };

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBanner error={error} />;

  return (
    <div>
      <h2>Data Flow: {graph.nodes.length} nodes, {graph.edges.length} edges</h2>
      
      <button onClick={handleAnalyze} disabled={isMutating}>
        Analyze Impact
      </button>

      {/* Render graph with D3.js / React Flow / Cytoscape.js */}
      <GraphVisualization nodes={graph.nodes} edges={graph.edges} />
    </div>
  );
}
```

## 🚀 What This Enables

### Before (Passive Catalog)
- ❌ "Where is this field used?" → Manual search
- ❌ "What breaks if I change X?" → Trial and error
- ❌ "Show me the data flow" → Not possible

### After (Active Intelligence)
- ✅ "Where is this field used?" → Instant graph traversal
- ✅ "What breaks if I change X?" → Risk-scored impact report
- ✅ "Show me the data flow" → Visual DAG from source to dashboard

## 📊 Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  React Components + useLineageGraph() + useImpactAnalysis() │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP
┌────────────────────┴────────────────────────────────────────┐
│                    Next.js BFF                               │
│  /api/meta/lineage/** (Auth + Proxy + Caching)              │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP
┌────────────────────┴────────────────────────────────────────┐
│              Metadata-Studio (Hono)                          │
│  meta-lineage.routes.ts (Graph Traversal + Impact Analysis) │
└────────────────────┬────────────────────────────────────────┘
                     │ SQL
┌────────────────────┴────────────────────────────────────────┐
│                   PostgreSQL                                 │
│  mdm_lineage_node + mdm_lineage_edge + mdm_composite_kpi    │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Next Steps After Setup

1. **Visualize**: Build a graph visualization component (D3.js / React Flow)
2. **Extend**: Add more node types (dashboards, jobs, databases)
3. **Automate**: Auto-create lineage from SQL query parsing
4. **Integrate**: Connect to dbt, Airflow, or other data tools
5. **Alert**: Notify users when upstream dependencies change

---

**Status**: All code complete ✅  
**Remaining**: Database setup + migrations + seeding  
**Time to complete setup**: ~5 minutes
