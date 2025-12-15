// metadata-studio/services/metadata.service.ts
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { mdmGlobalMetadata } from '../db/schema/metadata.tables';
import {
  MdmGlobalMetadataSchema,
  type MdmGlobalMetadata,
} from '../schemas/mdm-global-metadata.schema';
import { approvalService } from './approval.service';
import type { Role } from '../middleware/auth.middleware';

/**
 * Same role type we used in business-rule.service.ts
 * kernel_architect | metadata_steward | business_admin | user
 */

export interface MetadataChangeRequest {
  actorRole: Role;
  actorId: string;
  body: unknown;
}

/**
 * For global metadata, we use a stricter policy:
 *
 * - Tier1/Tier2: ALWAYS require approval (HITL) for any change
 * - Tier3+:
 *    - metadata_steward or kernel_architect → can apply directly
 *    - others → require approval
 */
function canApplyMetadataImmediately(
  meta: MdmGlobalMetadata,
  role: Role,
): boolean {
  if (meta.tier === 'tier1' || meta.tier === 'tier2') {
    return false;
  }

  if (role === 'kernel_architect' || role === 'metadata_steward') {
    return true;
  }

  return false;
}

/**
 * Who should approve metadata change by tier.
 */
function requiredMetadataApprovalRole(meta: MdmGlobalMetadata): Role {
  if (meta.tier === 'tier1') return 'kernel_architect';
  if (meta.tier === 'tier2') return 'metadata_steward';
  return 'metadata_steward';
}

/**
 * Enforce GRCD rules:
 * - Tier1/Tier2 MUST declare a standardPackId
 */
function enforceMetadataBusinessRules(meta: MdmGlobalMetadata) {
  if (
    (meta.tier === 'tier1' || meta.tier === 'tier2') &&
    (!meta.standardPackId || meta.standardPackId.trim() === '')
  ) {
    throw new Error(
      'Tier1/Tier2 metadata MUST declare standardPackId (SoT pack)',
    );
  }
}

/**
 * Main entry: apply or queue a metadata change request.
 */
export async function applyMetadataChange(req: MetadataChangeRequest) {
  // 1) validate envelope
  const base = MdmGlobalMetadataSchema.parse(req.body);

  // 2) enforce GRCD-level rules (SoT, Tier expectations)
  enforceMetadataBusinessRules(base);

  // 3) decide immediate vs approval
  if (canApplyMetadataImmediately(base, req.actorRole)) {
    return await upsertGlobalMetadata(base, req.actorId);
  }

  // 4) fetch current state for diff
  const [current] = await db
    .select()
    .from(mdmGlobalMetadata)
    .where(
      and(
        eq(mdmGlobalMetadata.tenantId, base.tenantId),
        eq(mdmGlobalMetadata.canonicalKey, base.canonicalKey),
      ),
    );

  const approvalPayload = {
    tenantId: base.tenantId,
    entityType: 'GLOBAL_METADATA' as const,
    entityId: current?.id ?? null,
    entityKey: base.canonicalKey,
    tier: base.tier,
    lane: 'governed' as const, // conceptual lane for metadata
    payload: base,
    currentState: current ?? null,
    status: 'pending' as const,
    requestedBy: req.actorId,
    requiredRole: requiredMetadataApprovalRole(base),
  };

  await approvalService.createRequest(approvalPayload);

  return {
    status: 'pending_approval' as const,
  };
}

/**
 * Shared helper for immediate path & approval processing.
 */
export async function upsertGlobalMetadata(
  meta: MdmGlobalMetadata,
  actorId: string,
) {
  // look up by tenant + canonicalKey
  const [existing] = await db
    .select()
    .from(mdmGlobalMetadata)
    .where(
      and(
        eq(mdmGlobalMetadata.tenantId, meta.tenantId),
        eq(mdmGlobalMetadata.canonicalKey, meta.canonicalKey),
      ),
    );

  if (existing) {
    const [updated] = await db
      .update(mdmGlobalMetadata)
      .set({
        label: meta.label,
        description: meta.description,
        domain: meta.domain,
        module: meta.module,
        entityUrn: meta.entityUrn,
        tier: meta.tier,
        standardPackId: meta.standardPackId ?? null,
        dataType: meta.dataType,
        format: meta.format ?? null,
        aliasesRaw: meta.aliasesRaw ?? null,
        ownerId: meta.ownerId,
        stewardId: meta.stewardId,
        status: meta.status,
        isDraft: meta.isDraft,
        updatedBy: actorId,
        updatedAt: new Date(),
      })
      .where(eq(mdmGlobalMetadata.id, existing.id))
      .returning();

    return updated;
  }

  const [inserted] = await db
    .insert(mdmGlobalMetadata)
    .values({
      tenantId: meta.tenantId,
      canonicalKey: meta.canonicalKey,
      label: meta.label,
      description: meta.description,
      domain: meta.domain,
      module: meta.module,
      entityUrn: meta.entityUrn,
      tier: meta.tier,
      standardPackId: meta.standardPackId ?? null,
      dataType: meta.dataType,
      format: meta.format ?? null,
      aliasesRaw: meta.aliasesRaw ?? null,
      ownerId: meta.ownerId,
      stewardId: meta.stewardId,
      status: meta.status,
      isDraft: meta.isDraft,
      createdBy: actorId,
      updatedBy: actorId,
    })
    .returning();

  return inserted;
}

