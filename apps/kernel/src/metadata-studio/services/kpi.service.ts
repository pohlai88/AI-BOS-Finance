// metadata-studio/services/kpi.service.ts
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import {
  mdmKpiDefinition,
  mdmKpiComponent,
} from '../db/schema/kpi.tables';
import { mdmGlobalMetadata } from '../db/schema/metadata.tables';
import {
  MdmKpiDefinitionWithComponentsSchema,
  type MdmKpiDefinitionWithComponents,
  type MdmKpiComponentInput,
} from '../schemas/kpi.schema';
import { approvalService } from './approval.service';
import type { Role } from '../middleware/auth.middleware';

export interface KpiChangeRequest {
  actorRole: Role;
  actorId: string;
  body: unknown;
}

function canApplyKpiImmediately(
  def: MdmKpiDefinitionWithComponents['definition'],
  role: Role,
): boolean {
  // Tier1/Tier2 KPIs always require approval
  if (def.tier === 'tier1' || def.tier === 'tier2') {
    return false;
  }

  // Tier3+ can be directly modified by kernel + stewards
  if (role === 'kernel_architect' || role === 'metadata_steward') {
    return true;
  }

  return false;
}

function requiredKpiApprovalRole(
  def: MdmKpiDefinitionWithComponents['definition'],
): Role {
  if (def.tier === 'tier1') return 'kernel_architect';
  if (def.tier === 'tier2') return 'metadata_steward';
  return 'metadata_steward';
}

/**
 * GRCD rules for KPI:
 * - Tier1/Tier2 KPIs MUST be bound to a Tier1/Tier2 primary metadata field.
 * - Primary metadata must exist.
 */
async function enforceKpiBusinessRules(
  payload: MdmKpiDefinitionWithComponents,
) {
  const def = payload.definition;
  const tenantId = def.tenantId;

  const [primaryMeta] = await db
    .select()
    .from(mdmGlobalMetadata)
    .where(
      and(
        eq(mdmGlobalMetadata.tenantId, tenantId),
        eq(
          mdmGlobalMetadata.canonicalKey,
          def.primaryMetadataCanonicalKey,
        ),
      ),
    );

  if (!primaryMeta) {
    throw new Error(
      `Primary metadata not found for canonicalKey=${def.primaryMetadataCanonicalKey}`,
    );
  }

  if (def.tier === 'tier1' || def.tier === 'tier2') {
    if (primaryMeta.tier !== 'tier1' && primaryMeta.tier !== 'tier2') {
      throw new Error(
        `Tier1/Tier2 KPI must point to Tier1/Tier2 primary metadata; got ${primaryMeta.tier}`,
      );
    }

    if (!def.standardPackId) {
      throw new Error(
        'Tier1/Tier2 KPI MUST declare standardPackId (e.g. IFRS_CORE, INTERNAL_PERF)',
      );
    }
  }
}

/**
 * Main entry — apply KPI change or send to approval.
 */
export async function applyKpiChange(req: KpiChangeRequest) {
  const payload = MdmKpiDefinitionWithComponentsSchema.parse(req.body);

  await enforceKpiBusinessRules(payload);

  if (canApplyKpiImmediately(payload.definition, req.actorRole)) {
    return await upsertKpiDefinitionWithComponents(
      payload,
      req.actorId,
    );
  }

  const def = payload.definition;

  const [currentDef] = await db
    .select()
    .from(mdmKpiDefinition)
    .where(
      and(
        eq(mdmKpiDefinition.tenantId, def.tenantId),
        eq(mdmKpiDefinition.canonicalKey, def.canonicalKey),
      ),
    );

  const approvalPayload = {
    tenantId: def.tenantId,
    entityType: 'KPI' as const,
    entityId: currentDef?.id ?? null,
    entityKey: def.canonicalKey,
    tier: def.tier,
    lane: 'governed' as const,
    payload,
    currentState: currentDef ?? null,
    status: 'pending' as const,
    requestedBy: req.actorId,
    requiredRole: requiredKpiApprovalRole(def),
  };

  await approvalService.createRequest(approvalPayload);

  return {
    status: 'pending_approval' as const,
  };
}

/**
 * Shared helper used by:
 * - immediate apply
 * - approval processing
 */
export async function upsertKpiDefinitionWithComponents(
  payload: MdmKpiDefinitionWithComponents,
  actorId: string,
) {
  const def = payload.definition;
  const tenantId = def.tenantId;

  // 1) resolve primary metadata
  const [primaryMeta] = await db
    .select()
    .from(mdmGlobalMetadata)
    .where(
      and(
        eq(mdmGlobalMetadata.tenantId, tenantId),
        eq(
          mdmGlobalMetadata.canonicalKey,
          def.primaryMetadataCanonicalKey,
        ),
      ),
    );

  if (!primaryMeta) {
    throw new Error(
      `Primary metadata not found: ${def.primaryMetadataCanonicalKey}`,
    );
  }

  // 2) upsert definition
  const [existing] = await db
    .select()
    .from(mdmKpiDefinition)
    .where(
      and(
        eq(mdmKpiDefinition.tenantId, tenantId),
        eq(mdmKpiDefinition.canonicalKey, def.canonicalKey),
      ),
    );

  let kpiId: string;

  if (existing) {
    const [updated] = await db
      .update(mdmKpiDefinition)
      .set({
        name: def.name,
        description: def.description,
        domain: def.domain,
        category: def.category,
        standardPackId: def.standardPackId ?? null,
        tier: def.tier,
        status: def.status,
        expression: def.expression,
        expressionLanguage: def.expressionLanguage,
        primaryMetadataId: primaryMeta.id,
        primaryMetadataCanonicalKey: def.primaryMetadataCanonicalKey,
        aggregationLevel: def.aggregationLevel ?? null,
        ownerId: def.ownerId,
        stewardId: def.stewardId,
        updatedBy: actorId,
        updatedAt: new Date(),
      })
      .where(eq(mdmKpiDefinition.id, existing.id))
      .returning();

    kpiId = updated.id;
  } else {
    const [inserted] = await db
      .insert(mdmKpiDefinition)
      .values({
        tenantId,
        canonicalKey: def.canonicalKey,
        name: def.name,
        description: def.description,
        domain: def.domain,
        category: def.category,
        standardPackId: def.standardPackId ?? null,
        tier: def.tier,
        status: def.status,
        expression: def.expression,
        expressionLanguage: def.expressionLanguage,
        primaryMetadataId: primaryMeta.id,
        primaryMetadataCanonicalKey: def.primaryMetadataCanonicalKey,
        aggregationLevel: def.aggregationLevel ?? null,
        ownerId: def.ownerId,
        stewardId: def.stewardId,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();

    kpiId = inserted.id;
  }

  // 3) overwrite components for this KPI
  await upsertKpiComponents(
    tenantId,
    kpiId,
    payload.components,
    actorId,
  );

  return { ...def, kpiId };
}

async function upsertKpiComponents(
  tenantId: string,
  kpiId: string,
  components: MdmKpiComponentInput[],
  actorId: string,
) {
  // Resolve all metadata canonical keys in one shot
  const metaKeys = Array.from(
    new Set(components.map((c) => c.metadataCanonicalKey)),
  );

  let metas: any[] = [];
  if (metaKeys.length > 0) {
    metas = await db
      .select()
      .from(mdmGlobalMetadata)
      .where(
        and(
          eq(mdmGlobalMetadata.tenantId, tenantId),
          inArray(mdmGlobalMetadata.canonicalKey, metaKeys),
        ),
      );
  }

  const metaMap = new Map(
    metas.map((m) => [m.canonicalKey, m.id as string]),
  );

  for (const c of components) {
    if (!metaMap.has(c.metadataCanonicalKey)) {
      throw new Error(
        `Component metadata not found: ${c.metadataCanonicalKey}`,
      );
    }
  }

  // Strategy: clear and reinsert components for this KPI
  await db
    .delete(mdmKpiComponent)
    .where(
      and(
        eq(mdmKpiComponent.tenantId, tenantId),
        eq(mdmKpiComponent.kpiId, kpiId),
      ),
    );

  if (components.length === 0) return;

  await db.insert(mdmKpiComponent).values(
    components.map((c) => ({
      tenantId,
      kpiId,
      role: c.role,
      metadataId: metaMap.get(c.metadataCanonicalKey)!,
      metadataCanonicalKey: c.metadataCanonicalKey,
      componentExpression: c.componentExpression ?? null,
      sequence: c.sequence,
      isRequired: c.isRequired,
      createdBy: actorId,
      updatedBy: actorId,
    })),
  );
}

