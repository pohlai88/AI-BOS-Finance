// metadata-studio/services/glossary.service.ts
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { mdmGlossaryTerm } from '../db/schema/glossary.tables';
import {
  MdmGlossaryTermSchema,
  type MdmGlossaryTerm,
} from '../schemas/glossary.schema';
import { approvalService } from './approval.service';
import type { Role } from '../middleware/auth.middleware';

export interface GlossaryChangeRequest {
  actorRole: Role;
  actorId: string;
  body: unknown;
}

function canApplyGlossaryImmediately(
  term: MdmGlossaryTerm,
  role: Role,
): boolean {
  // Tier1/Tier2 always HITL
  if (term.tier === 'tier1' || term.tier === 'tier2') {
    return false;
  }

  // Tier3+ can be edited directly by stewards / kernel
  if (role === 'kernel_architect' || role === 'metadata_steward') {
    return true;
  }

  return false;
}

function requiredGlossaryApprovalRole(term: MdmGlossaryTerm): Role {
  if (term.tier === 'tier1') return 'kernel_architect';
  if (term.tier === 'tier2') return 'metadata_steward';
  return 'metadata_steward';
}

/**
 * Enforce GRCD rules for glossary:
 * - Tier1/Tier2 finance terms should generally have standardPackId
 *   (we can keep it soft for now, but you can tighten later).
 */
function enforceGlossaryBusinessRules(term: MdmGlossaryTerm) {
  if (
    (term.tier === 'tier1' || term.tier === 'tier2') &&
    term.domain === 'finance' &&
    (!term.standardPackId || term.standardPackId.trim() === '')
  ) {
    throw new Error(
      'Tier1/Tier2 finance glossary terms MUST declare standardPackId (SoT pack)',
    );
  }
}

export async function applyGlossaryChange(req: GlossaryChangeRequest) {
  const base = MdmGlossaryTermSchema.parse(req.body);

  enforceGlossaryBusinessRules(base);

  if (canApplyGlossaryImmediately(base, req.actorRole)) {
    return await upsertGlossaryTerm(base, req.actorId);
  }

  const [current] = await db
    .select()
    .from(mdmGlossaryTerm)
    .where(
      and(
        eq(mdmGlossaryTerm.tenantId, base.tenantId),
        eq(mdmGlossaryTerm.canonicalKey, base.canonicalKey),
      ),
    );

  const approvalPayload = {
    tenantId: base.tenantId,
    entityType: 'GLOSSARY' as const,
    entityId: current?.id ?? null,
    entityKey: base.canonicalKey,
    tier: base.tier,
    lane: 'governed' as const,
    payload: base,
    currentState: current ?? null,
    status: 'pending' as const,
    requestedBy: req.actorId,
    requiredRole: requiredGlossaryApprovalRole(base),
  };

  await approvalService.createRequest(approvalPayload);

  return {
    status: 'pending_approval' as const,
  };
}

export async function upsertGlossaryTerm(
  term: MdmGlossaryTerm,
  actorId: string,
) {
  const [existing] = await db
    .select()
    .from(mdmGlossaryTerm)
    .where(
      and(
        eq(mdmGlossaryTerm.tenantId, term.tenantId),
        eq(mdmGlossaryTerm.canonicalKey, term.canonicalKey),
      ),
    );

  if (existing) {
    const [updated] = await db
      .update(mdmGlossaryTerm)
      .set({
        term: term.term,
        description: term.description,
        domain: term.domain,
        category: term.category,
        standardPackId: term.standardPackId ?? null,
        language: term.language,
        tier: term.tier,
        status: term.status,
        synonymsRaw: term.synonymsRaw ?? null,
        relatedCanonicalKeys: term.relatedCanonicalKeys ?? null,
        updatedBy: actorId,
        updatedAt: new Date(),
      })
      .where(eq(mdmGlossaryTerm.id, existing.id))
      .returning();

    return updated;
  }

  const [inserted] = await db
    .insert(mdmGlossaryTerm)
    .values({
      tenantId: term.tenantId,
      canonicalKey: term.canonicalKey,
      term: term.term,
      description: term.description,
      domain: term.domain,
      category: term.category,
      standardPackId: term.standardPackId ?? null,
      language: term.language,
      tier: term.tier,
      status: term.status,
      synonymsRaw: term.synonymsRaw ?? null,
      relatedCanonicalKeys: term.relatedCanonicalKeys ?? null,
      createdBy: actorId,
      updatedBy: actorId,
    })
    .returning();

  return inserted;
}

