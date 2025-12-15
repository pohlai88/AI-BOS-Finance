// metadata-studio/services/lineage.service.ts
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import {
  mdmGlobalMetadata,
} from '../db/schema/metadata.tables';
import {
  mdmLineageField,
} from '../db/schema/lineage.tables';
import {
  LineageFieldCreateInputSchema,
  type LineageFieldCreateInput,
} from '../schemas/lineage.input.schema';
import {
  MdmLineageFieldSchema,
  type MdmLineageField,
} from '../schemas/lineage.schema';
import type { Role } from '../middleware/auth.middleware';

/**
 * For now we allow any "governance-capable" roles to declare lineage.
 * You can tighten this later (e.g. only metadata_steward/kernel_architect).
 */
function canDeclareLineage(role: Role): boolean {
  return (
    role === 'kernel_architect' ||
    role === 'metadata_steward' ||
    role === 'business_admin'
  );
}

export interface LineageDeclareRequest {
  actorRole: Role;
  actorId: string;
  tenantId: string;
  body: unknown;
}

/**
 * Declare or update a field-level lineage edge:
 *  sourceCanonicalKey → targetCanonicalKey
 */
export async function declareFieldLineage(
  req: LineageDeclareRequest,
): Promise<MdmLineageField> {
  if (!canDeclareLineage(req.actorRole)) {
    throw new Error('Role not allowed to declare lineage');
  }

  const input = LineageFieldCreateInputSchema.parse(req.body);

  const tenantId = input.tenantId ?? req.tenantId;

  // 1) Resolve canonical keys → metadata IDs
  const metas = await db
    .select()
    .from(mdmGlobalMetadata)
    .where(
      and(
        eq(mdmGlobalMetadata.tenantId, tenantId),
        inArray(mdmGlobalMetadata.canonicalKey, [
          input.sourceCanonicalKey,
          input.targetCanonicalKey,
        ]),
      ),
    );

  const sourceMeta = metas.find(
    (m) => m.canonicalKey === input.sourceCanonicalKey,
  );
  const targetMeta = metas.find(
    (m) => m.canonicalKey === input.targetCanonicalKey,
  );

  if (!sourceMeta) {
    throw new Error(
      `Source metadata not found for canonicalKey=${input.sourceCanonicalKey}`,
    );
  }
  if (!targetMeta) {
    throw new Error(
      `Target metadata not found for canonicalKey=${input.targetCanonicalKey}`,
    );
  }

  // 2) Upsert edge (by tenant + sourceId + targetId + relationshipType)
  const [existing] = await db
    .select()
    .from(mdmLineageField)
    .where(
      and(
        eq(mdmLineageField.tenantId, tenantId),
        eq(mdmLineageField.sourceMetadataId, sourceMeta.id),
        eq(mdmLineageField.targetMetadataId, targetMeta.id),
        eq(mdmLineageField.relationshipType, input.relationshipType),
      ),
    );

  const baseValues = {
    tenantId,
    sourceMetadataId: sourceMeta.id,
    targetMetadataId: targetMeta.id,
    relationshipType: input.relationshipType,
    transformationType: input.transformationType ?? null,
    transformationExpression: input.transformationExpression ?? null,
    isPrimaryPath: input.isPrimaryPath,
    confidenceScore: input.confidenceScore,
    verified: input.verified,
    verifiedBy: input.verifiedBy ?? null,
    verifiedAt: input.verifiedAt ? new Date(input.verifiedAt) : null,
  };

  const actorId = req.actorId;

  if (existing) {
    const [updated] = await db
      .update(mdmLineageField)
      .set({
        ...baseValues,
        updatedBy: actorId,
        updatedAt: new Date(),
      })
      .where(eq(mdmLineageField.id, existing.id))
      .returning();

    return MdmLineageFieldSchema.parse({
      ...updated,
      createdAt: updated.createdAt?.toISOString(),
      updatedAt: updated.updatedAt?.toISOString(),
      verifiedAt: updated.verifiedAt?.toISOString(),
    });
  }

  const [inserted] = await db
    .insert(mdmLineageField)
    .values({
      ...baseValues,
      createdBy: actorId,
      updatedBy: actorId,
    })
    .returning();

  return MdmLineageFieldSchema.parse({
    ...inserted,
    createdAt: inserted.createdAt?.toISOString(),
    updatedAt: inserted.updatedAt?.toISOString(),
    verifiedAt: inserted.verifiedAt?.toISOString(),
  });
}

export type LineageDirection = 'upstream' | 'downstream' | 'both';

export interface FieldLineageGraph {
  target: any; // mdm_global_metadata row
  upstream: { edge: any; source: any }[];
  downstream: { edge: any; target: any }[];
}

/**
 * Get upstream/downstream lineage for a given canonicalKey.
 */
export async function getFieldLineageGraph(
  tenantId: string,
  canonicalKey: string,
  direction: LineageDirection = 'upstream',
): Promise<FieldLineageGraph> {
  // 1) Find the target metadata
  const [meta] = await db
    .select()
    .from(mdmGlobalMetadata)
    .where(
      and(
        eq(mdmGlobalMetadata.tenantId, tenantId),
        eq(mdmGlobalMetadata.canonicalKey, canonicalKey),
      ),
    );

  if (!meta) {
    throw new Error(
      `Metadata not found for canonicalKey=${canonicalKey} (tenant=${tenantId})`,
    );
  }

  const result: FieldLineageGraph = {
    target: meta,
    upstream: [],
    downstream: [],
  };

  // 2) Upstream: who feeds this field?
  if (direction === 'upstream' || direction === 'both') {
    const upstreamEdges = await db
      .select()
      .from(mdmLineageField)
      .where(
        and(
          eq(mdmLineageField.tenantId, tenantId),
          eq(mdmLineageField.targetMetadataId, meta.id),
        ),
      );

    const upstreamIds = upstreamEdges.map((e) => e.sourceMetadataId);
    let upstreamMetas: any[] = [];
    if (upstreamIds.length > 0) {
      upstreamMetas = await db
        .select()
        .from(mdmGlobalMetadata)
        .where(inArray(mdmGlobalMetadata.id, upstreamIds));
    }

    result.upstream = upstreamEdges.map((edge) => ({
      edge,
      source: upstreamMetas.find((m) => m.id === edge.sourceMetadataId),
    }));
  }

  // 3) Downstream: who depends on this field?
  if (direction === 'downstream' || direction === 'both') {
    const downstreamEdges = await db
      .select()
      .from(mdmLineageField)
      .where(
        and(
          eq(mdmLineageField.tenantId, tenantId),
          eq(mdmLineageField.sourceMetadataId, meta.id),
        ),
      );

    const downstreamIds = downstreamEdges.map((e) => e.targetMetadataId);
    let downstreamMetas: any[] = [];
    if (downstreamIds.length > 0) {
      downstreamMetas = await db
        .select()
        .from(mdmGlobalMetadata)
        .where(inArray(mdmGlobalMetadata.id, downstreamIds));
    }

    result.downstream = downstreamEdges.map((edge) => ({
      edge,
      target: downstreamMetas.find((m) => m.id === edge.targetMetadataId),
    }));
  }

  return result;
}

/**
 * Tier 1 lineage coverage: which Tier 1 fields have at least one edge?
 */
export async function getTier1LineageCoverage(tenantId: string) {
  const tier1Metas = await db
    .select()
    .from(mdmGlobalMetadata)
    .where(
      and(
        eq(mdmGlobalMetadata.tenantId, tenantId),
        eq(mdmGlobalMetadata.tier, 'tier1'),
        eq(mdmGlobalMetadata.status, 'active'),
      ),
    );

  if (!tier1Metas.length) {
    return {
      totalTier1: 0,
      covered: 0,
      uncovered: 0,
      uncoveredCanonicalKeys: [] as string[],
    };
  }

  const tier1Ids = tier1Metas.map((m) => m.id);

  const edges = await db
    .select()
    .from(mdmLineageField)
    .where(
      and(
        eq(mdmLineageField.tenantId, tenantId),
        inArray(mdmLineageField.targetMetadataId, tier1Ids),
      ),
    );

  const coveredSet = new Set(edges.map((e) => e.targetMetadataId));

  const uncovered = tier1Metas.filter((m) => !coveredSet.has(m.id));

  return {
    totalTier1: tier1Metas.length,
    covered: coveredSet.size,
    uncovered: uncovered.length,
    uncoveredCanonicalKeys: uncovered.map((m) => m.canonicalKey),
  };
}

