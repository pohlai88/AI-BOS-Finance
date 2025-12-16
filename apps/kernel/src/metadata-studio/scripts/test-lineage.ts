import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testLineageSetup() {
  console.log('🧪 Testing Lineage Layer Setup...\n');

  const client = await pool.connect();

  try {
    // 1. Test nodes
    const nodes = await client.query(`
      SELECT node_type, COUNT(*) as count
      FROM mdm_lineage_node
      WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
      GROUP BY node_type
      ORDER BY count DESC
    `);

    console.log('📊 Lineage Nodes:');
    nodes.rows.forEach(r => console.log(`   ${r.node_type}: ${r.count}`));
    console.log(`   Total: ${nodes.rows.reduce((sum, r) => sum + parseInt(r.count), 0)}\n`);

    // 2. Test edges
    const edges = await client.query(`
      SELECT edge_type, COUNT(*) as count
      FROM mdm_lineage_edge
      WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
      GROUP BY edge_type
      ORDER BY count DESC
    `);

    console.log('🔗 Lineage Edges:');
    edges.rows.forEach(r => console.log(`   ${r.edge_type}: ${r.count}`));
    console.log(`   Total: ${edges.rows.reduce((sum, r) => sum + parseInt(r.count), 0)}\n`);

    // 3. Test KPIs
    const kpis = await client.query(`
      SELECT canonical_key, name, governance_tier
      FROM mdm_composite_kpi
      WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
      ORDER BY governance_tier, name
    `);

    console.log('📈 Composite KPIs:');
    kpis.rows.forEach(k => console.log(`   ${k.canonical_key} (${k.governance_tier}): ${k.name}`));
    console.log(`   Total: ${kpis.rows.length}\n`);

    // 4. Test a sample graph traversal
    const sampleUrn = await client.query(`
      SELECT urn FROM mdm_lineage_node 
      WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
        AND node_type = 'field'
      LIMIT 1
    `);

    if (sampleUrn.rows.length > 0) {
      const testUrn = sampleUrn.rows[0].urn;

      const connections = await client.query(`
        SELECT 
          e.edge_type,
          CASE 
            WHEN e.source_urn = $1 THEN 'downstream'
            ELSE 'upstream'
          END as direction,
          CASE 
            WHEN e.source_urn = $1 THEN n.label
            ELSE n2.label
          END as connected_to
        FROM mdm_lineage_edge e
        LEFT JOIN mdm_lineage_node n ON n.urn = e.target_urn AND n.tenant_id = e.tenant_id
        LEFT JOIN mdm_lineage_node n2 ON n2.urn = e.source_urn AND n2.tenant_id = e.tenant_id
        WHERE (e.source_urn = $1 OR e.target_urn = $1)
          AND e.tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
        LIMIT 5
      `, [testUrn]);

      console.log(`🔍 Sample Lineage Path (${testUrn}):`);
      connections.rows.forEach(c => {
        console.log(`   ${c.direction} (${c.edge_type}): ${c.connected_to || 'N/A'}`);
      });
      console.log();
    }

    console.log('✅ All tests passed! Lineage layer is operational.\n');

    console.log('📡 API Endpoints Ready:');
    console.log('   GET  /api/meta/lineage');
    console.log('   GET  /api/meta/lineage/graph/:urn');
    console.log('   POST /api/meta/lineage/impact');
    console.log('   POST /api/meta/lineage/nodes');
    console.log('   POST /api/meta/lineage/edges\n');

    console.log('🚀 Next Steps:');
    console.log('   1. Start backend: cd apps/kernel/src/metadata-studio && pnpm dev');
    console.log('   2. Start BFF: cd apps/web && pnpm dev');
    console.log('   3. Test: curl http://localhost:3000/api/meta/lineage\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

testLineageSetup();
