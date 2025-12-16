// metadata-studio/api/meta-lineage.routes.ts
// =============================================================================
// LINEAGE API ROUTES - Graph traversal for data lineage
// Serves: META_03 Detail View, Lineage Canvas, Impact Analysis
// =============================================================================

import { Hono } from 'hono';
import { db } from '../db/client';
import { mdmLineageNode, mdmLineageEdge } from '../db/schema/lineage.tables';
import { eq, or, and, inArray, sql } from 'drizzle-orm';
import type { AuthContext } from '../middleware/auth.middleware';

type Variables = { auth: AuthContext };

export const metaLineageRouter = new Hono<{ Variables: Variables }>();

// -----------------------------------------------------------------------------
// GET /api/meta/lineage
// List all lineage nodes with optional filters
// -----------------------------------------------------------------------------
metaLineageRouter.get('/', async (c) => {
  const auth = c.get('auth');
  const { type, layer, q, limit = '100', offset = '0' } = c.req.query();

  try {
    let query = db
      .select()
      .from(mdmLineageNode)
      .where(eq(mdmLineageNode.tenantId, auth.tenantId))
      .limit(Number(limit))
      .offset(Number(offset));

    // Note: Additional filters would need dynamic query building
    // For MVP, we return all nodes

    const nodes = await query;

    return c.json({
      data: nodes,
      meta: {
        total: nodes.length,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error) {
    console.error('[Lineage] List nodes error:', error);
    return c.json({ error: 'Failed to fetch lineage nodes' }, 500);
  }
});

// -----------------------------------------------------------------------------
// GET /api/meta/lineage/graph/:urn
// Returns the upstream/downstream graph for a specific node URN
// Supports depth parameter for multi-hop traversal
// -----------------------------------------------------------------------------
metaLineageRouter.get('/graph/:urn', async (c) => {
  const auth = c.get('auth');
  const urn = decodeURIComponent(c.req.param('urn'));
  const direction = c.req.query('direction') || 'both'; // upstream, downstream, both
  const depth = Math.min(Number(c.req.query('depth') || 2), 5); // Max 5 hops

  try {
    // 1. Get the center node
    const [centerNode] = await db
      .select()
      .from(mdmLineageNode)
      .where(
        and(
          eq(mdmLineageNode.tenantId, auth.tenantId),
          eq(mdmLineageNode.urn, urn)
        )
      );

    if (!centerNode) {
      return c.json({ error: 'Node not found' }, 404);
    }

    // 2. Traverse the graph using iterative approach (up to `depth` hops)
    const visitedUrns = new Set<string>([urn]);
    const allNodes = [centerNode];
    const allEdges: typeof mdmLineageEdge.$inferSelect[] = [];

    let currentUrns = [urn];

    for (let hop = 0; hop < depth && currentUrns.length > 0; hop++) {
      // Build edge query based on direction
      const edgeConditions = [];

      if (direction === 'upstream' || direction === 'both') {
        edgeConditions.push(inArray(mdmLineageEdge.targetUrn, currentUrns));
      }
      if (direction === 'downstream' || direction === 'both') {
        edgeConditions.push(inArray(mdmLineageEdge.sourceUrn, currentUrns));
      }

      if (edgeConditions.length === 0) break;

      // Find edges connected to current nodes
      const edges = await db
        .select()
        .from(mdmLineageEdge)
        .where(
          and(
            eq(mdmLineageEdge.tenantId, auth.tenantId),
            or(...edgeConditions)
          )
        );

      if (edges.length === 0) break;

      // Collect new URNs to visit
      const nextUrns: string[] = [];

      for (const edge of edges) {
        // Add edge if not already added
        if (!allEdges.find((e) => e.id === edge.id)) {
          allEdges.push(edge);
        }

        // Check source and target
        if (!visitedUrns.has(edge.sourceUrn)) {
          visitedUrns.add(edge.sourceUrn);
          nextUrns.push(edge.sourceUrn);
        }
        if (!visitedUrns.has(edge.targetUrn)) {
          visitedUrns.add(edge.targetUrn);
          nextUrns.push(edge.targetUrn);
        }
      }

      // Fetch the new nodes
      if (nextUrns.length > 0) {
        const newNodes = await db
          .select()
          .from(mdmLineageNode)
          .where(
            and(
              eq(mdmLineageNode.tenantId, auth.tenantId),
              inArray(mdmLineageNode.urn, nextUrns)
            )
          );

        allNodes.push(...newNodes);
      }

      currentUrns = nextUrns;
    }

    // 3. Return the graph (matches ZLineageGraph schema)
    return c.json({
      nodes: allNodes,
      edges: allEdges,
      meta: {
        centerUrn: urn,
        direction,
        depth,
        nodeCount: allNodes.length,
        edgeCount: allEdges.length,
      },
    });
  } catch (error) {
    console.error('[Lineage] Graph traversal error:', error);
    return c.json({ error: 'Failed to fetch lineage graph' }, 500);
  }
});

// -----------------------------------------------------------------------------
// GET /api/meta/lineage/node/:id
// Get a single lineage node by ID
// -----------------------------------------------------------------------------
metaLineageRouter.get('/node/:id', async (c) => {
  const auth = c.get('auth');
  const id = c.req.param('id');

  try {
    const [node] = await db
      .select()
      .from(mdmLineageNode)
      .where(
        and(
          eq(mdmLineageNode.tenantId, auth.tenantId),
          eq(mdmLineageNode.id, id)
        )
      );

    if (!node) {
      return c.json({ error: 'Node not found' }, 404);
    }

    return c.json(node);
  } catch (error) {
    console.error('[Lineage] Get node error:', error);
    return c.json({ error: 'Failed to fetch node' }, 500);
  }
});

// -----------------------------------------------------------------------------
// POST /api/meta/lineage/impact
// Impact Analysis: Predict what breaks if a node changes
// Returns affected downstream nodes with severity
// -----------------------------------------------------------------------------
metaLineageRouter.post('/impact', async (c) => {
  const auth = c.get('auth');
  const body = await c.req.json<{
    urn: string;
    changeType: string;
    description?: string;
  }>();

  try {
    // 1. Get downstream graph (depth 5)
    const [centerNode] = await db
      .select()
      .from(mdmLineageNode)
      .where(
        and(
          eq(mdmLineageNode.tenantId, auth.tenantId),
          eq(mdmLineageNode.urn, body.urn)
        )
      );

    if (!centerNode) {
      return c.json({ error: 'Node not found' }, 404);
    }

    // 2. Traverse downstream
    const visitedUrns = new Set<string>([body.urn]);
    const affectedAssets: Array<{
      urn: string;
      type: string;
      impactType: 'breaks' | 'degrades' | 'warns' | 'safe';
      reason: string;
      distance: number;
      label?: string;
    }> = [];

    let currentUrns = [body.urn];
    let distance = 0;

    while (currentUrns.length > 0 && distance < 5) {
      distance++;

      const edges = await db
        .select()
        .from(mdmLineageEdge)
        .where(
          and(
            eq(mdmLineageEdge.tenantId, auth.tenantId),
            inArray(mdmLineageEdge.sourceUrn, currentUrns)
          )
        );

      const nextUrns: string[] = [];

      for (const edge of edges) {
        if (!visitedUrns.has(edge.targetUrn)) {
          visitedUrns.add(edge.targetUrn);
          nextUrns.push(edge.targetUrn);

          // Determine impact based on edge type and distance
          let impactType: 'breaks' | 'degrades' | 'warns' | 'safe' = 'warns';
          let reason = `Downstream dependency via ${edge.edgeType}`;

          if (body.changeType === 'field_delete') {
            impactType = distance === 1 ? 'breaks' : 'degrades';
            reason = `Direct consumer will break if ${body.urn} is deleted`;
          } else if (body.changeType === 'schema_change') {
            impactType = distance <= 2 ? 'degrades' : 'warns';
            reason = `Schema change may affect data format`;
          }

          affectedAssets.push({
            urn: edge.targetUrn,
            type: 'field', // Would be resolved from node lookup
            impactType,
            reason,
            distance,
          });
        }
      }

      currentUrns = nextUrns;
    }

    // 3. Fetch node details for affected assets
    if (affectedAssets.length > 0) {
      const affectedNodes = await db
        .select()
        .from(mdmLineageNode)
        .where(
          and(
            eq(mdmLineageNode.tenantId, auth.tenantId),
            inArray(
              mdmLineageNode.urn,
              affectedAssets.map((a) => a.urn)
            )
          )
        );

      const nodeMap = new Map(affectedNodes.map((n) => [n.urn, n]));
      for (const asset of affectedAssets) {
        const node = nodeMap.get(asset.urn);
        if (node) {
          asset.type = node.nodeType;
          asset.label = node.label || undefined;
        }
      }
    }

    // 4. Calculate risk score
    const criticalCount = affectedAssets.filter(
      (a) => a.impactType === 'breaks'
    ).length;
    const degradeCount = affectedAssets.filter(
      (a) => a.impactType === 'degrades'
    ).length;
    const warnCount = affectedAssets.filter(
      (a) => a.impactType === 'warns'
    ).length;

    const riskScore = Math.min(
      100,
      criticalCount * 30 + degradeCount * 15 + warnCount * 5
    );

    let recommendation: 'proceed' | 'review' | 'block' = 'proceed';
    if (riskScore >= 60) recommendation = 'block';
    else if (riskScore >= 30) recommendation = 'review';

    // 5. Return impact report (matches ZImpactReport)
    return c.json({
      sourceChange: {
        urn: body.urn,
        entityType: centerNode.nodeType,
        changeType: body.changeType,
        description: body.description || `Change to ${body.urn}`,
      },
      totalAffected: affectedAssets.length,
      criticalImpacts: affectedAssets.filter((a) => a.impactType === 'breaks'),
      warnings: affectedAssets.filter(
        (a) => a.impactType === 'degrades' || a.impactType === 'warns'
      ),
      safeChanges: affectedAssets.filter((a) => a.impactType === 'safe'),
      riskScore,
      recommendation,
      estimatedImpact: {
        users: Math.floor(affectedAssets.length * 2.5),
        workflows: Math.floor(affectedAssets.length * 0.8),
      },
      blastRadius: {
        direct: affectedAssets.filter((a) => a.distance === 1).length,
        indirect: affectedAssets.filter((a) => a.distance > 1).length,
        maxDepth: Math.max(...affectedAssets.map((a) => a.distance), 0),
      },
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Lineage] Impact analysis error:', error);
    return c.json({ error: 'Failed to perform impact analysis' }, 500);
  }
});

// -----------------------------------------------------------------------------
// POST /api/meta/lineage/nodes
// Create a new lineage node
// -----------------------------------------------------------------------------
metaLineageRouter.post('/nodes', async (c) => {
  const auth = c.get('auth');
  const body = await c.req.json();

  try {
    const [node] = await db
      .insert(mdmLineageNode)
      .values({
        tenantId: auth.tenantId as any, // Coerce string to UUID
        urn: body.urn,
        nodeType: body.nodeType,
        entityId: body.entityId,
        entityType: body.entityType,
        label: body.label,
        description: body.description,
        metadata: body.metadata || {},
      })
      .returning();

    return c.json(node, 201);
  } catch (error) {
    console.error('[Lineage] Create node error:', error);
    return c.json({ error: 'Failed to create lineage node' }, 500);
  }
});

// -----------------------------------------------------------------------------
// POST /api/meta/lineage/edges
// Create a new lineage edge
// -----------------------------------------------------------------------------
metaLineageRouter.post('/edges', async (c) => {
  const auth = c.get('auth');
  const body = await c.req.json();

  try {
    const [edge] = await db
      .insert(mdmLineageEdge)
      .values({
        tenantId: auth.tenantId as any, // Coerce string to UUID
        sourceUrn: body.sourceUrn,
        targetUrn: body.targetUrn,
        edgeType: body.edgeType,
        transformation: body.transformation,
        metadata: body.metadata || {},
      })
      .returning();

    return c.json(edge, 201);
  } catch (error) {
    console.error('[Lineage] Create edge error:', error);
    return c.json({ error: 'Failed to create lineage edge' }, 500);
  }
});
