// ============================================================================
// META ENTITIES ROUTES - UI-Driven Development
// ============================================================================
// Serves: META_05 (Canon Matrix / Entity Hierarchy)
// Philosophy: Simple routes that return exactly what the UI needs
// ============================================================================

import { Hono } from 'hono';
import { eq, sql, and, ilike } from 'drizzle-orm';
import { db } from '../db/client';
import { mdmEntityCatalog } from '../db/schema/entity-catalog.tables';
import { mdmGlobalMetadata } from '../db/schema/metadata.tables';
import { getAuth, type AppVariables } from '../middleware/auth.middleware';
import type {
  EntityTreeResponse,
  EntityDto,
  CreateEntityInput,
} from '@ai-bos/shared';

export const metaEntitiesRouter = new Hono<{ Variables: AppVariables }>();

// -----------------------------------------------------------------------------
// META_05: Entity Tree
// GET /api/meta/entities/tree
// -----------------------------------------------------------------------------
metaEntitiesRouter.get('/tree', async (c) => {
  const auth = getAuth(c);
  const tenantId = auth?.tenantId ?? 'default';

  try {
    // Fetch all entities with field counts
    const entities = await db.execute(sql`
      SELECT 
        ec.id,
        ec.tenant_id,
        ec.entity_urn,
        ec.entity_name,
        ec.entity_type,
        ec.domain,
        ec.module,
        ec.description,
        ec.owner_id,
        ec.created_at,
        ec.updated_at,
        COUNT(gm.id) as field_count
      FROM mdm_entity_catalog ec
      LEFT JOIN mdm_global_metadata gm 
        ON gm.entity_urn = ec.entity_urn 
        AND gm.tenant_id = ec.tenant_id
      WHERE ec.tenant_id = ${tenantId}
      GROUP BY ec.id, ec.tenant_id, ec.entity_urn, ec.entity_name, 
               ec.entity_type, ec.domain, ec.module, ec.description,
               ec.owner_id, ec.created_at, ec.updated_at
      ORDER BY ec.domain, ec.module, ec.entity_name
    `);

    const nodes: EntityDto[] = (entities.rows || []).map((row: any) => ({
      id: row.id,
      tenant_id: row.tenant_id,
      entity_urn: row.entity_urn,
      entity_name: row.entity_name,
      entity_type: row.entity_type || 'table',
      domain: row.domain,
      module: row.module || '',
      description: row.description,
      owner_id: row.owner_id,
      field_count: Number(row.field_count) || 0,
      created_at: row.created_at?.toISOString?.() || row.created_at,
      updated_at: row.updated_at?.toISOString?.() || row.updated_at,
    }));

    // Calculate stats
    const domains = new Set(nodes.map((n) => n.domain));

    const response: EntityTreeResponse = {
      nodes,
      stats: {
        domain_count: domains.size,
        entity_count: nodes.length,
        field_count: nodes.reduce((sum, n) => sum + (n.field_count || 0), 0),
      },
    };

    return c.json(response);
  } catch (error) {
    console.error('Error fetching entity tree:', error);
    return c.json(
      {
        nodes: [],
        stats: { domain_count: 0, entity_count: 0, field_count: 0 },
      } satisfies EntityTreeResponse,
      200,
    );
  }
});

// -----------------------------------------------------------------------------
// GET /api/meta/entities
// List entities with optional filters
// -----------------------------------------------------------------------------
metaEntitiesRouter.get('/', async (c) => {
  const auth = getAuth(c);
  const tenantId = auth?.tenantId ?? 'default';
  const domain = c.req.query('domain');
  const module = c.req.query('module');
  const q = c.req.query('q');

  try {
    let whereClause = eq(mdmEntityCatalog.tenantId, tenantId);

    if (domain) {
      whereClause = and(whereClause, eq(mdmEntityCatalog.domain, domain))!;
    }
    if (module) {
      whereClause = and(whereClause, eq(mdmEntityCatalog.module, module))!;
    }
    if (q) {
      whereClause = and(
        whereClause,
        ilike(mdmEntityCatalog.entityName, `%${q}%`),
      )!;
    }

    const entities = await db
      .select()
      .from(mdmEntityCatalog)
      .where(whereClause)
      .orderBy(mdmEntityCatalog.entityUrn);

    const data: EntityDto[] = entities.map((e) => ({
      id: e.id,
      tenant_id: e.tenantId,
      entity_urn: e.entityUrn,
      entity_name: e.entityName,
      entity_type: (e.entityType as EntityDto['entity_type']) || 'table',
      domain: e.domain,
      module: e.module || '',
      description: e.description || undefined,
      owner_id: e.ownerId || undefined,
      created_at: e.createdAt?.toISOString?.() || String(e.createdAt),
      updated_at: e.updatedAt?.toISOString?.() || String(e.updatedAt),
    }));

    return c.json({ data, total: data.length });
  } catch (error) {
    console.error('Error listing entities:', error);
    return c.json({ data: [], total: 0 }, 200);
  }
});

// -----------------------------------------------------------------------------
// GET /api/meta/entities/:urn
// Get single entity by URN
// -----------------------------------------------------------------------------
metaEntitiesRouter.get('/:urn', async (c) => {
  const auth = getAuth(c);
  const tenantId = auth?.tenantId ?? 'default';
  const urn = c.req.param('urn');

  try {
    const result = await db
      .select()
      .from(mdmEntityCatalog)
      .where(
        and(
          eq(mdmEntityCatalog.tenantId, tenantId),
          eq(mdmEntityCatalog.entityUrn, urn),
        ),
      )
      .limit(1);

    if (!result.length) {
      return c.json({ error: 'Entity not found' }, 404);
    }

    const e = result[0];
    const entity: EntityDto = {
      id: e.id,
      tenant_id: e.tenantId,
      entity_urn: e.entityUrn,
      entity_name: e.entityName,
      entity_type: (e.entityType as EntityDto['entity_type']) || 'table',
      domain: e.domain,
      module: e.module || '',
      description: e.description || undefined,
      owner_id: e.ownerId || undefined,
      created_at: e.createdAt?.toISOString?.() || String(e.createdAt),
      updated_at: e.updatedAt?.toISOString?.() || String(e.updatedAt),
    };

    return c.json(entity);
  } catch (error) {
    console.error('Error fetching entity:', error);
    return c.json({ error: 'Failed to fetch entity' }, 500);
  }
});

// -----------------------------------------------------------------------------
// POST /api/meta/entities
// Create a new entity (Lite Mode)
// -----------------------------------------------------------------------------
metaEntitiesRouter.post('/', async (c) => {
  const auth = getAuth(c);
  const tenantId = auth?.tenantId ?? 'default';
  const userId = auth?.userId ?? 'system';
  const body = await c.req.json<CreateEntityInput>();

  // Basic validation
  if (!body.entity_urn || !body.entity_name || !body.domain) {
    return c.json(
      { error: 'Missing required fields: entity_urn, entity_name, domain' },
      400,
    );
  }

  // Validate entity_urn format: {domain}.{entity_name}
  const urnParts = body.entity_urn.split('.');
  if (urnParts.length < 2) {
    return c.json(
      { error: 'Invalid entity_urn format. Expected: {domain}.{entity_name}' },
      400,
    );
  }

  try {
    // Check if entity already exists
    const existing = await db
      .select()
      .from(mdmEntityCatalog)
      .where(
        and(
          eq(mdmEntityCatalog.tenantId, tenantId),
          eq(mdmEntityCatalog.entityUrn, body.entity_urn),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return c.json({ error: 'Entity already exists', existing: existing[0] }, 409);
    }

    // Insert new entity
    const result = await db
      .insert(mdmEntityCatalog)
      .values({
        tenantId,
        entityUrn: body.entity_urn,
        entityName: body.entity_name,
        entityType: body.entity_type || 'table',
        domain: body.domain,
        module: body.module || '',
        description: body.description || null,
        ownerId: userId,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    const created = result[0];
    const response: EntityDto = {
      id: created.id,
      tenant_id: created.tenantId,
      entity_urn: created.entityUrn,
      entity_name: created.entityName,
      entity_type: (created.entityType as EntityDto['entity_type']) || 'table',
      domain: created.domain,
      module: created.module || '',
      description: created.description || undefined,
      owner_id: created.ownerId || undefined,
      created_at: created.createdAt?.toISOString?.() || String(created.createdAt),
      updated_at: created.updatedAt?.toISOString?.() || String(created.updatedAt),
    };

    return c.json(response, 201);
  } catch (error) {
    console.error('Error creating entity:', error);
    return c.json({ error: 'Failed to create entity' }, 500);
  }
});
