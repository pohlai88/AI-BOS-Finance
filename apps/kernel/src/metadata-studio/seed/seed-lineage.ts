// metadata-studio/seed/seed-lineage.ts
// =============================================================================
// LINEAGE & KPI SEEDER
// Creates a realistic data flow: Source → Raw → Curated → Presentation
// =============================================================================

import 'dotenv/config';
import { db } from '../db/client';
import { mdmGlobalMetadata } from '../db/schema/metadata.tables';
import { mdmLineageNode, mdmLineageEdge } from '../db/schema/lineage.tables';
import { mdmCompositeKpi } from '../db/schema/kpi.tables';
import { randomUUID } from 'crypto';
import { sql } from 'drizzle-orm';

const TENANT_ID = process.env.DEV_TENANT_ID || '00000000-0000-0000-0000-000000000001';

// Lineage layers (simulating a typical data warehouse flow)
const LAYERS = ['source', 'raw', 'curated', 'presentation'] as const;
type Layer = (typeof LAYERS)[number];

async function seedLineageAndKPIs() {
  console.log('🔗 Seeding Lineage & KPIs...');
  console.log(`   Tenant: ${TENANT_ID}`);

  // 1. Fetch existing fields to use as nodes
  const existingFields = await db
    .select()
    .from(mdmGlobalMetadata)
    .limit(50);

  if (existingFields.length === 0) {
    console.error('❌ No fields found! Run the core seeder first:');
    console.error('   pnpm db:seed');
    process.exit(1);
  }

  console.log(`   Found ${existingFields.length} existing fields`);

  // 2. Clear existing lineage data (for re-runs)
  console.log('   Clearing existing lineage data...');
  await db.delete(mdmLineageEdge);
  await db.delete(mdmLineageNode);
  await db.delete(mdmCompositeKpi);

  // 3. Create Lineage Nodes (wrapping fields + external systems)
  console.log('   Creating lineage nodes...');

  const nodes: Array<{
    id: string;
    urn: string;
    nodeType: string;
    layer: Layer;
    label: string;
    entityId: string | null;
  }> = [];

  // Create nodes for existing fields, distributing across layers
  for (let i = 0; i < existingFields.length; i++) {
    const field = existingFields[i];
    const layer = LAYERS[i % LAYERS.length];
    const urn = `urn:metadata:field:${field.canonicalKey}`;

    const nodeId = randomUUID();
    nodes.push({
      id: nodeId,
      urn,
      nodeType: 'field',
      layer,
      label: field.label,
      entityId: field.id,
    });
  }

  // Add some external source systems
  const externalSources = [
    { name: 'SAP ECC', type: 'source', layer: 'source' as Layer },
    { name: 'Salesforce CRM', type: 'source', layer: 'source' as Layer },
    { name: 'AWS S3 Data Lake', type: 'transformation', layer: 'raw' as Layer },
    { name: 'Snowflake DW', type: 'transformation', layer: 'curated' as Layer },
    { name: 'Finance Dashboard', type: 'report', layer: 'presentation' as Layer },
    { name: 'CFO Report', type: 'report', layer: 'presentation' as Layer },
  ];

  for (const src of externalSources) {
    const nodeId = randomUUID();
    nodes.push({
      id: nodeId,
      urn: `urn:system:${src.name.toLowerCase().replace(/\s+/g, '_')}`,
      nodeType: src.type,
      layer: src.layer,
      label: src.name,
      entityId: null,
    });
  }

  // Insert all nodes
  await db.insert(mdmLineageNode).values(
    nodes.map((n) => ({
      id: n.id as any, // Coerce string to UUID
      tenantId: TENANT_ID as any, // Coerce string to UUID
      urn: n.urn,
      nodeType: n.nodeType,
      entityId: n.entityId as any, // Coerce string to UUID
      entityType: n.entityId ? 'mdm_global_metadata' : null,
      label: n.label,
      description: `${n.layer} layer node`,
      metadata: { layer: n.layer },
    }))
  );

  console.log(`   Created ${nodes.length} lineage nodes`);

  // 4. Create Edges (The Flow)
  console.log('   Wiring up graph edges...');

  const getNodesByLayer = (layer: Layer) => nodes.filter((n) => n.layer === layer);

  const sourceNodes = getNodesByLayer('source');
  const rawNodes = getNodesByLayer('raw');
  const curatedNodes = getNodesByLayer('curated');
  const prezNodes = getNodesByLayer('presentation');

  const edges: Array<{
    sourceUrn: string;
    targetUrn: string;
    edgeType: string;
  }> = [];

  // Connect Source → Raw (produces)
  for (const src of sourceNodes) {
    const targets = shuffleArray([...rawNodes]).slice(0, 2);
    for (const target of targets) {
      edges.push({
        sourceUrn: src.urn,
        targetUrn: target.urn,
        edgeType: 'produces',
      });
    }
  }

  // Connect Raw → Curated (transforms)
  for (const raw of rawNodes) {
    const targets = shuffleArray([...curatedNodes]).slice(0, 2);
    for (const target of targets) {
      edges.push({
        sourceUrn: raw.urn,
        targetUrn: target.urn,
        edgeType: 'transforms',
      });
    }
  }

  // Connect Curated → Presentation (consumes)
  for (const cur of curatedNodes) {
    const targets = shuffleArray([...prezNodes]).slice(0, 2);
    for (const target of targets) {
      edges.push({
        sourceUrn: cur.urn,
        targetUrn: target.urn,
        edgeType: 'consumes',
      });
    }
  }

  // Insert all edges
  if (edges.length > 0) {
    await db.insert(mdmLineageEdge).values(
      edges.map((e) => ({
        id: randomUUID() as any, // Coerce string to UUID
        tenantId: TENANT_ID as any, // Coerce string to UUID
        sourceUrn: e.sourceUrn,
        targetUrn: e.targetUrn,
        edgeType: e.edgeType,
        metadata: {},
      }))
    );
  }

  console.log(`   Created ${edges.length} lineage edges`);

  // 5. Create Composite KPIs
  console.log('   Creating composite KPIs...');

  const financeFields = curatedNodes.filter((n) =>
    n.label.toLowerCase().includes('amount') ||
    n.label.toLowerCase().includes('revenue') ||
    n.label.toLowerCase().includes('cost')
  );

  const kpis = [
    {
      canonicalKey: 'gross_margin_percent',
      name: 'Gross Margin %',
      description: 'Revenue minus cost of goods sold, divided by revenue',
      domain: 'finance',
    },
    {
      canonicalKey: 'revenue_per_employee',
      name: 'Revenue per Employee',
      description: 'Total revenue divided by headcount',
      domain: 'finance',
    },
    {
      canonicalKey: 'inventory_turnover',
      name: 'Inventory Turnover',
      description: 'Cost of goods sold divided by average inventory',
      domain: 'operations',
    },
  ];

  for (const kpi of kpis) {
    // Pick random fields for numerator/denominator
    const numField = financeFields[0] || curatedNodes[0];
    const denomField = financeFields[1] || curatedNodes[1];

    if (numField && denomField) {
      await db.insert(mdmCompositeKpi).values({
        id: randomUUID() as any, // Coerce string to UUID
        tenantId: TENANT_ID as any, // Coerce string to UUID
        canonicalKey: kpi.canonicalKey,
        name: kpi.name,
        description: kpi.description,
        numerator: {
          fieldId: numField.entityId || numField.id,
          expression: null,
          standardPackId: null,
          description: 'Numerator component',
        },
        denominator: {
          fieldId: denomField.entityId || denomField.id,
          expression: null,
          standardPackId: null,
          description: 'Denominator component',
        },
        governanceTier: 'tier1',
        domain: kpi.domain,
        entityUrn: `urn:metadata:kpi:${kpi.canonicalKey}`,
        tags: [kpi.domain, 'financial-ratio'],
        isActive: true,
        isDeprecated: false,
      });
    }
  }

  console.log(`   Created ${kpis.length} composite KPIs`);

  // Summary
  console.log('');
  console.log('✅ Lineage & KPI seeding complete!');
  console.log(`   📊 ${nodes.length} nodes`);
  console.log(`   🔗 ${edges.length} edges`);
  console.log(`   📈 ${kpis.length} KPIs`);
  console.log('');
  console.log('   Data flow: Source → Raw → Curated → Presentation');
}

// Helper: Shuffle array
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Run
seedLineageAndKPIs()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });

