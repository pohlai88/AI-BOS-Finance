// ============================================================================
// META FIELDS ROUTES - UI-Driven Development
// ============================================================================
// Serves: META_02 (God View), META_03 (Prism Comparator)
// Philosophy: Simple routes that return exactly what the UI needs
// ============================================================================

import { Hono } from 'hono';
import { eq, and, ilike, sql, count } from 'drizzle-orm';
import { db } from '../db/client';
import { mdmGlobalMetadata } from '../db/schema/metadata.tables';
import { mdmEntityCatalog } from '../db/schema/entity-catalog.tables';
import { mdmMetadataMapping } from '../db/schema/metadata-mapping.tables';
import { mdmViolationReport } from '../db/schema/remediation.tables';
import { getAuth, type AppVariables } from '../middleware/auth.middleware';
import type {
  MetadataFieldsResponse,
  MetadataFieldDto,
  MetadataFieldsFilter,
  CreateMetadataFieldInput,
  PrismComparisonResponse,
  GovernanceTier,
  MetadataStatus,
} from '@ai-bos/shared';

// ============================================================================
// GRCD Enforcement Configuration
// ============================================================================

/**
 * GRCD_MODE controls governance enforcement level:
 * - 'lite': Warn and log violations but allow operations (default for dev)
 * - 'governed': Block violations for tier1/tier2 fields (production)
 */
const GRCD_MODE = (process.env.GRCD_MODE || 'lite') as 'lite' | 'governed';

/**
 * Record a GRCD violation in the database
 */
async function recordViolation(
  tenantId: string,
  code: string,
  severity: 'critical' | 'high' | 'medium' | 'low',
  description: string,
  targetKey: string,
  targetTable: string = 'mdm_global_metadata',
  context?: Record<string, unknown>,
) {
  try {
    await db.insert(mdmViolationReport).values({
      tenantId,
      scanId: crypto.randomUUID(), // Generate a unique scan ID for this check
      violationCode: code,
      severity,
      description,
      targetTable,
      targetKey,
      context: context || {},
      status: 'open',
    });
    console.log(`[GRCD] Recorded violation: ${code} for ${targetKey}`);
  } catch (error) {
    console.error(`[GRCD] Failed to record violation:`, error);
  }
}

console.log(`[GRCD] Running in ${GRCD_MODE.toUpperCase()} mode`);

export const metaFieldsRouter = new Hono<{ Variables: AppVariables }>();

// -----------------------------------------------------------------------------
// META_02: God View - List Fields
// GET /api/meta/fields
// -----------------------------------------------------------------------------
metaFieldsRouter.get('/', async (c) => {
  const auth = getAuth(c);
  const tenantId = auth?.tenantId ?? 'default';

  // Parse query params
  const query = c.req.query();
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
  const offset = (page - 1) * limit;

  try {
    // Build WHERE clause
    const conditions = [eq(mdmGlobalMetadata.tenantId, tenantId)];

    if (query.q) {
      conditions.push(
        ilike(mdmGlobalMetadata.label, `%${query.q}%`),
      );
    }
    if (query.domain) {
      conditions.push(eq(mdmGlobalMetadata.domain, query.domain));
    }
    if (query.module) {
      conditions.push(eq(mdmGlobalMetadata.module, query.module));
    }
    if (query.tier) {
      conditions.push(eq(mdmGlobalMetadata.tier, query.tier));
    }
    if (query.status) {
      conditions.push(eq(mdmGlobalMetadata.status, query.status));
    }
    if (query.entity_urn) {
      conditions.push(eq(mdmGlobalMetadata.entityUrn, query.entity_urn));
    }
    if (query.standard_pack_id) {
      conditions.push(eq(mdmGlobalMetadata.standardPackId, query.standard_pack_id));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Execute queries in parallel
    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(mdmGlobalMetadata)
        .where(whereClause)
        .orderBy(mdmGlobalMetadata.canonicalKey)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(mdmGlobalMetadata)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count) || 0;

    // Transform to DTO
    const fields: MetadataFieldDto[] = data.map((row) => ({
      id: row.id,
      tenant_id: row.tenantId,
      canonical_key: row.canonicalKey,
      entity_urn: row.entityUrn || '',
      label: row.label || '',
      description: row.description || undefined,
      data_type: row.dataType || 'string',
      format: row.format || undefined,
      tier: (row.tier as GovernanceTier) || 'tier3',
      domain: row.domain || '',
      module: row.module || '',
      status: (row.status as MetadataStatus) || 'draft',
      standard_pack_id: row.standardPackId || undefined,
      pii_flag: row.piiFlag || false,
      owner_id: row.ownerId || undefined,
      created_at: row.createdAt?.toISOString?.() || String(row.createdAt),
      updated_at: row.updatedAt?.toISOString?.() || String(row.updatedAt),
    }));

    const response: MetadataFieldsResponse = {
      data: fields,
      meta: {
        total,
        page,
        limit,
        has_more: offset + fields.length < total,
      },
    };

    return c.json(response);
  } catch (error) {
    console.error('Error listing fields:', error);
    return c.json(
      {
        data: [],
        meta: { total: 0, page: 1, limit: 50, has_more: false },
      } satisfies MetadataFieldsResponse,
      200,
    );
  }
});

// -----------------------------------------------------------------------------
// GET /api/meta/fields/:id
// Get single field by ID
// -----------------------------------------------------------------------------
metaFieldsRouter.get('/:id', async (c) => {
  const auth = getAuth(c);
  const tenantId = auth?.tenantId ?? 'default';
  const id = c.req.param('id');

  try {
    const result = await db
      .select()
      .from(mdmGlobalMetadata)
      .where(
        and(
          eq(mdmGlobalMetadata.tenantId, tenantId),
          eq(mdmGlobalMetadata.id, id),
        ),
      )
      .limit(1);

    if (!result.length) {
      return c.json({ error: 'Field not found' }, 404);
    }

    const row = result[0];
    const field: MetadataFieldDto = {
      id: row.id,
      tenant_id: row.tenantId,
      canonical_key: row.canonicalKey,
      entity_urn: row.entityUrn || '',
      label: row.label || '',
      description: row.description || undefined,
      data_type: row.dataType || 'string',
      format: row.format || undefined,
      tier: (row.tier as GovernanceTier) || 'tier3',
      domain: row.domain || '',
      module: row.module || '',
      status: (row.status as MetadataStatus) || 'draft',
      standard_pack_id: row.standardPackId || undefined,
      pii_flag: row.piiFlag || false,
      owner_id: row.ownerId || undefined,
      created_at: row.createdAt?.toISOString?.() || String(row.createdAt),
      updated_at: row.updatedAt?.toISOString?.() || String(row.updatedAt),
    };

    return c.json(field);
  } catch (error) {
    console.error('Error fetching field:', error);
    return c.json({ error: 'Failed to fetch field' }, 500);
  }
});

// -----------------------------------------------------------------------------
// POST /api/meta/fields
// Create a new field (Lite Mode - minimal validation)
// -----------------------------------------------------------------------------
metaFieldsRouter.post('/', async (c) => {
  const auth = getAuth(c);
  const tenantId = auth?.tenantId ?? 'default';
  const userId = auth?.userId ?? 'system';
  const body = await c.req.json<CreateMetadataFieldInput>();

  // Basic validation
  if (!body.entity_urn || !body.field_name || !body.label) {
    return c.json(
      { error: 'Missing required fields: entity_urn, field_name, label' },
      400,
    );
  }

  // Construct canonical_key
  const canonicalKey = `${body.entity_urn}.${body.field_name}`;

  // Derive domain from entity_urn if not provided
  const domain = body.domain || body.entity_urn.split('.')[0] || 'unknown';
  const tier = body.tier || 'tier3'; // Default to tier3 in Lite Mode

  // GRCD-12: Tier1/Tier2 requires standard_pack_id
  if ((tier === 'tier1' || tier === 'tier2') && !body.standard_pack_id) {
    const violationDesc = `${tier} field created without standard_pack_id`;

    if (GRCD_MODE === 'governed') {
      // In Governed Mode: Block the operation
      console.error(`[GRCD-12] BLOCKED: ${violationDesc}: ${canonicalKey}`);
      return c.json(
        {
          error: 'GRCD-12 Violation',
          message: `Tier1 and Tier2 fields require a standard_pack_id for regulatory anchoring`,
          field: canonicalKey,
          tier,
        },
        400,
      );
    } else {
      // In Lite Mode: Log warning and record violation for later remediation
      console.warn(`[GRCD-12] Warning: ${violationDesc}: ${canonicalKey}`);
      await recordViolation(
        tenantId,
        'GRCD-12',
        tier === 'tier1' ? 'critical' : 'high',
        violationDesc,
        canonicalKey,
        'mdm_global_metadata',
        { tier, field_name: body.field_name, entity_urn: body.entity_urn },
      );
    }
  }

  try {
    // GRCD-11: Check entity exists (warn, don't block in Lite Mode)
    const entityExists = await db
      .select()
      .from(mdmEntityCatalog)
      .where(
        and(
          eq(mdmEntityCatalog.tenantId, tenantId),
          eq(mdmEntityCatalog.entityUrn, body.entity_urn),
        ),
      )
      .limit(1);

    if (!entityExists.length) {
      const violationDesc = `Field references non-existent entity`;

      if (GRCD_MODE === 'governed' && (tier === 'tier1' || tier === 'tier2')) {
        // In Governed Mode: Block for tier1/tier2 fields
        console.error(`[GRCD-11] BLOCKED: ${violationDesc}: ${body.entity_urn}`);
        return c.json(
          {
            error: 'GRCD-11 Violation',
            message: `Entity must exist in catalog before creating tier1/tier2 fields`,
            entity_urn: body.entity_urn,
            tier,
          },
          400,
        );
      }

      // In Lite Mode (or for tier3+): Auto-create entity but record violation
      console.warn(`[GRCD-11] Auto-creating missing entity: ${body.entity_urn}`);
      await recordViolation(
        tenantId,
        'GRCD-11',
        'medium',
        violationDesc,
        body.entity_urn,
        'mdm_entity_catalog',
        { entity_urn: body.entity_urn, field_name: body.field_name },
      );

      const entityParts = body.entity_urn.split('.');
      await db.insert(mdmEntityCatalog).values({
        tenantId,
        entityUrn: body.entity_urn,
        entityName: entityParts[entityParts.length - 1] || body.entity_urn,
        entityType: 'table',
        domain,
        module: body.module || '',
        ownerId: userId,
        createdBy: userId,
        updatedBy: userId,
      });
    }

    // Check for duplicate canonical_key
    const existing = await db
      .select()
      .from(mdmGlobalMetadata)
      .where(
        and(
          eq(mdmGlobalMetadata.tenantId, tenantId),
          eq(mdmGlobalMetadata.canonicalKey, canonicalKey),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return c.json(
        { error: 'Field already exists', existing: existing[0] },
        409,
      );
    }

    // Insert field
    const result = await db
      .insert(mdmGlobalMetadata)
      .values({
        tenantId,
        entityUrn: body.entity_urn,
        canonicalKey,
        label: body.label,
        description: body.description || null,
        dataType: body.data_type || 'string',
        format: body.format || null,
        tier,
        domain,
        module: body.module || '',
        standardPackId: body.standard_pack_id || null,
        status: 'draft',
        ownerId: userId,
        stewardId: userId, // Default steward to same as owner
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    const created = result[0];
    const response: MetadataFieldDto = {
      id: created.id,
      tenant_id: created.tenantId,
      canonical_key: created.canonicalKey,
      entity_urn: created.entityUrn || '',
      label: created.label || '',
      description: created.description || undefined,
      data_type: created.dataType || 'string',
      format: created.format || undefined,
      tier: (created.tier as GovernanceTier) || 'tier3',
      domain: created.domain || '',
      module: created.module || '',
      status: (created.status as MetadataStatus) || 'draft',
      standard_pack_id: created.standardPackId || undefined,
      pii_flag: created.piiFlag || false,
      owner_id: created.ownerId || undefined,
      created_at: created.createdAt?.toISOString?.() || String(created.createdAt),
      updated_at: created.updatedAt?.toISOString?.() || String(created.updatedAt),
    };

    return c.json(response, 201);
  } catch (error) {
    console.error('Error creating field:', error);
    return c.json({ error: 'Failed to create field' }, 500);
  }
});

// -----------------------------------------------------------------------------
// META_03: Prism Comparator - Get Field Mappings
// GET /api/meta/fields/:key/mappings
// -----------------------------------------------------------------------------
metaFieldsRouter.get('/:key/mappings', async (c) => {
  const auth = getAuth(c);
  const tenantId = auth?.tenantId ?? 'default';
  const canonicalKey = c.req.param('key');

  try {
    // Get the canonical field
    const fieldResult = await db
      .select()
      .from(mdmGlobalMetadata)
      .where(
        and(
          eq(mdmGlobalMetadata.tenantId, tenantId),
          eq(mdmGlobalMetadata.canonicalKey, canonicalKey),
        ),
      )
      .limit(1);

    if (!fieldResult.length) {
      return c.json({ error: 'Field not found' }, 404);
    }

    const row = fieldResult[0];
    const canonicalField: MetadataFieldDto = {
      id: row.id,
      tenant_id: row.tenantId,
      canonical_key: row.canonicalKey,
      entity_urn: row.entityUrn || '',
      label: row.label || '',
      description: row.description || undefined,
      data_type: row.dataType || 'string',
      format: row.format || undefined,
      tier: (row.tier as GovernanceTier) || 'tier3',
      domain: row.domain || '',
      module: row.module || '',
      status: (row.status as MetadataStatus) || 'draft',
      standard_pack_id: row.standardPackId || undefined,
      pii_flag: row.piiFlag || false,
      owner_id: row.ownerId || undefined,
      created_at: row.createdAt?.toISOString?.() || String(row.createdAt),
      updated_at: row.updatedAt?.toISOString?.() || String(row.updatedAt),
    };

    // Get mappings for this field
    const mappings = await db
      .select()
      .from(mdmMetadataMapping)
      .where(
        and(
          eq(mdmMetadataMapping.tenantId, tenantId),
          eq(mdmMetadataMapping.canonicalKey, canonicalKey),
        ),
      );

    const response: PrismComparisonResponse = {
      canonical_key: canonicalKey,
      canonical_field: canonicalField,
      mappings: mappings.map((m) => ({
        id: m.id,
        canonical_key: m.canonicalKey,
        local_system: m.localSystem,
        local_entity: m.localEntity,
        local_field: m.localField,
        local_type: m.localType || '',
        transformation: m.transformation || undefined,
        notes: m.notes || undefined,
      })),
    };

    return c.json(response);
  } catch (error) {
    console.error('Error fetching field mappings:', error);
    return c.json({ error: 'Failed to fetch mappings' }, 500);
  }
});
